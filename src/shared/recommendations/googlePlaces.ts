/**
 * Google Places API（New）への通信とレスポンス変換を担当する。
 * Nearby Searchでは写真を要求せず、候補のIDと徒歩経路だけを取得する。
 */

import { z } from "zod";
import {
  GOOGLE_NEARBY_SEARCH_MAX_RESULTS,
  MAX_CAMPUS_TO_RESTAURANT_DISTANCE_METERS,
} from "@/constants/recommendationGeneration";

const GOOGLE_PLACES_API_BASE_URL = "https://places.googleapis.com/v1";
const GOOGLE_PLACES_LANGUAGE_CODE = "ja";
const GOOGLE_PLACES_REGION_CODE = "JP";

const GoogleRoutingSummarySchema = z.object({
  legs: z
    .array(
      z.object({
        duration: z.string().regex(/^\d+(?:\.\d+)?s$/),
        distanceMeters: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

const GoogleNearbySearchResponseSchema = z.object({
  places: z.array(z.object({ id: z.string().min(1) })).default([]),
  routingSummaries: z.array(GoogleRoutingSummarySchema).default([]),
});

const GoogleMoneySchema = z.object({
  currencyCode: z.string().length(3),
  units: z.string().regex(/^-?\d+$/),
  nanos: z.number().int().min(-999_999_999).max(999_999_999).default(0),
});

const GooglePlaceDetailsResponseSchema = z.object({
  id: z.string().min(1),
  displayName: z.object({ text: z.string().min(1) }),
  formattedAddress: z.string().min(1),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  priceRange: z
    .object({
      startPrice: GoogleMoneySchema.optional(),
      endPrice: GoogleMoneySchema.optional(),
    })
    .optional(),
});

/** 大学または店舗の座標。 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Nearby Searchで取得した推薦候補。 */
export interface NearbyRestaurantCandidate {
  googlePlaceId: string;
  distanceMeters: number;
  campusToRestaurantSeconds: number;
}

/** Googleから取得した料金レンジ。 */
export interface GooglePlacePriceRange {
  currencyCode: string;
  startPrice: number;
  endPrice: number | null;
}

/** 選出後に取得する店舗詳細。 */
export interface GooglePlaceDetails {
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  priceRange: GooglePlacePriceRange | null;
}

/** 推薦生成処理が利用するGoogle Places操作。 */
export interface GooglePlacesGateway {
  /**
   * 指定カテゴリに該当する店舗候補と大学からの徒歩経路を取得する。
   *
   * @param origin - 大学の座標。
   * @param includedPrimaryTypes - Google Placesのprimary type一覧。
   * @returns Place IDと徒歩経路情報の一覧。
   */
  searchNearby(
    origin: Coordinates,
    includedPrimaryTypes: readonly string[],
  ): Promise<NearbyRestaurantCandidate[]>;

  /**
   * 選出された店舗の保存必須項目と料金レンジを取得する。
   *
   * @param googlePlaceId - Google Place ID。
   * @returns 店舗詳細。
   */
  getPlaceDetails(googlePlaceId: string): Promise<GooglePlaceDetails>;
}

/** Google Places APIとの通信に失敗したことを表すエラー。 */
export class GooglePlacesError extends Error {
  /**
   * Google Places APIエラーを生成する。
   *
   * @param message - ログとAPIエラー変換に使用するメッセージ。
   */
  constructor(message: string) {
    super(message);
    this.name = "GooglePlacesError";
  }
}

/**
 * GoogleのDuration文字列を保存用の秒数へ変換する。
 *
 * @param duration - `123s`形式のDuration。
 * @returns 切り上げた秒数。
 */
function parseDurationSeconds(duration: string): number {
  return Math.ceil(Number(duration.slice(0, -1)));
}

/**
 * Google Moneyを整数価格へ変換する。
 *
 * @param money - Google Money。未取得時はundefined。
 * @returns 小数を含まない場合の整数価格。変換不能時はnull。
 */
function parseMoney(
  money: z.infer<typeof GoogleMoneySchema> | undefined,
): number | null {
  if (money === undefined || money.nanos !== 0) {
    return null;
  }

  const units = Number(money.units);
  return Number.isSafeInteger(units) && units >= 0 ? units : null;
}

/**
 * Googleの料金レンジをDB保存形式へ変換する。
 *
 * @param priceRange - Google Place Detailsの料金レンジ。
 * @returns 保存可能な料金レンジ。必須値を欠く場合はnull。
 */
function parsePriceRange(
  priceRange: z.infer<typeof GooglePlaceDetailsResponseSchema>["priceRange"],
): GooglePlacePriceRange | null {
  const startPrice = parseMoney(priceRange?.startPrice);
  if (priceRange?.startPrice === undefined || startPrice === null) {
    return null;
  }

  const endPrice = parseMoney(priceRange.endPrice);
  return {
    currencyCode: priceRange.startPrice.currencyCode,
    startPrice,
    endPrice:
      endPrice !== null &&
      priceRange.endPrice?.currencyCode ===
        priceRange.startPrice.currencyCode &&
      endPrice > startPrice
        ? endPrice
        : null,
  };
}

/** Google Places API（New）のHTTPクライアント。 */
export class GooglePlacesClient implements GooglePlacesGateway {
  private readonly apiKey: string;
  private readonly fetchImplementation: typeof fetch;

  /**
   * Google Placesクライアントを生成する。
   *
   * @param apiKey - ブラウザへ公開しないサーバー用APIキー。
   * @param fetchImplementation - テストで差し替え可能なfetch実装。
   */
  constructor(apiKey: string, fetchImplementation: typeof fetch = fetch) {
    if (apiKey.trim().length === 0) {
      throw new GooglePlacesError("GOOGLE_MAPS_API_KEYが設定されていません。");
    }
    this.apiKey = apiKey;
    this.fetchImplementation = fetchImplementation;
  }

  /**
   * 指定カテゴリに該当する店舗候補と大学からの徒歩経路を取得する。
   *
   * @param origin - 大学の座標。
   * @param includedPrimaryTypes - Google Placesのprimary type一覧。
   * @returns 800m以内の判定に必要な候補一覧。
   */
  async searchNearby(
    origin: Coordinates,
    includedPrimaryTypes: readonly string[],
  ): Promise<NearbyRestaurantCandidate[]> {
    const response = await this.fetchImplementation(
      `${GOOGLE_PLACES_API_BASE_URL}/places:searchNearby`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": "places.id,routingSummaries",
        },
        body: JSON.stringify({
          includedPrimaryTypes,
          maxResultCount: GOOGLE_NEARBY_SEARCH_MAX_RESULTS,
          rankPreference: "DISTANCE",
          languageCode: GOOGLE_PLACES_LANGUAGE_CODE,
          regionCode: GOOGLE_PLACES_REGION_CODE,
          locationRestriction: {
            circle: {
              center: origin,
              radius: MAX_CAMPUS_TO_RESTAURANT_DISTANCE_METERS,
            },
          },
          routingParameters: {
            origin,
            travelMode: "WALK",
          },
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new GooglePlacesError(
        `Nearby Searchに失敗しました（HTTP ${response.status}）。`,
      );
    }

    const parsed = GoogleNearbySearchResponseSchema.parse(
      (await response.json()) as unknown,
    );

    return parsed.places.flatMap((place, index) => {
      const leg = parsed.routingSummaries[index]?.legs[0];
      if (leg === undefined) {
        return [];
      }
      return [
        {
          googlePlaceId: place.id,
          distanceMeters: leg.distanceMeters,
          campusToRestaurantSeconds: parseDurationSeconds(leg.duration),
        },
      ];
    });
  }

  /**
   * 選出された店舗の保存必須項目と料金レンジを取得する。
   *
   * @param googlePlaceId - Google Place ID。
   * @returns DBへ保存可能な店舗詳細。
   */
  async getPlaceDetails(googlePlaceId: string): Promise<GooglePlaceDetails> {
    const response = await this.fetchImplementation(
      `${GOOGLE_PLACES_API_BASE_URL}/places/${encodeURIComponent(googlePlaceId)}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask":
            "id,displayName,formattedAddress,location,priceRange",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new GooglePlacesError(
        `Place Detailsに失敗しました（HTTP ${response.status}）。`,
      );
    }

    const place = GooglePlaceDetailsResponseSchema.parse(
      (await response.json()) as unknown,
    );
    return {
      googlePlaceId: place.id,
      name: place.displayName.text,
      address: place.formattedAddress,
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      priceRange: parsePriceRange(place.priceRange),
    };
  }
}
