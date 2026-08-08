/**
 * Google Places APIクライアントのリクエストとZod変換を検証する。
 * 写真を要求せず、徒歩経路と選出店舗詳細だけを扱うことを保証する。
 */

import { describe, expect, it, vi } from "vitest";
import { GooglePlacesClient, GooglePlacesError } from "./googlePlaces";

/**
 * 料金レンジだけを差し替えたPlace Detailsレスポンスを生成する。
 *
 * @param priceRange - Google API形式の料金レンジ。
 * @returns fetchスタブで返すHTTPレスポンス。
 */
function createPlaceDetailsResponse(priceRange: unknown): Response {
  return Response.json({
    id: "place-a",
    displayName: { text: "麺屋テスト" },
    formattedAddress: "東京都千代田区1-1",
    location: { latitude: 35.681236, longitude: 139.767125 },
    priceRange,
  });
}

describe("GooglePlacesClient", () => {
  it("Nearby Searchから徒歩経路候補を取得する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        places: [{ id: "place-a" }, { id: "place-b" }],
        routingSummaries: [
          { legs: [{ duration: "125.2s", distanceMeters: 320 }] },
          { legs: [{ duration: "480s", distanceMeters: 760 }] },
        ],
      }),
    );
    const client = new GooglePlacesClient("server-api-key", fetchMock);

    const candidates = await client.searchNearby(
      { latitude: 35.681236, longitude: 139.767125 },
      ["ramen_restaurant"],
    );

    expect(candidates).toEqual([
      {
        googlePlaceId: "place-a",
        distanceMeters: 320,
        campusToRestaurantSeconds: 126,
      },
      {
        googlePlaceId: "place-b",
        distanceMeters: 760,
        campusToRestaurantSeconds: 480,
      },
    ]);
    const request = fetchMock.mock.calls[0];
    expect(request?.[1]?.headers).toMatchObject({
      "X-Goog-FieldMask": "places.id,routingSummaries",
    });
    expect(String(request?.[1]?.body)).not.toContain("photos");
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      includedPrimaryTypes: ["ramen_restaurant"],
      maxResultCount: 20,
      locationRestriction: { circle: { radius: 800 } },
      routingParameters: { travelMode: "WALK" },
    });
  });

  it("選出店舗の必須詳細と整数料金レンジを取得する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        id: "place-a",
        displayName: { text: "麺屋テスト" },
        formattedAddress: "東京都千代田区1-1",
        location: { latitude: 35.681236, longitude: 139.767125 },
        priceRange: {
          startPrice: { currencyCode: "JPY", units: "800", nanos: 0 },
          endPrice: { currencyCode: "JPY", units: "1200", nanos: 0 },
        },
      }),
    );
    const client = new GooglePlacesClient("server-api-key", fetchMock);

    await expect(client.getPlaceDetails("place-a")).resolves.toEqual({
      googlePlaceId: "place-a",
      name: "麺屋テスト",
      address: "東京都千代田区1-1",
      latitude: 35.681236,
      longitude: 139.767125,
      priceRange: {
        currencyCode: "JPY",
        startPrice: 800,
        endPrice: 1200,
      },
    });
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,priceRange",
    });
  });

  it("想定外のGoogleレスポンスをGoogle Placesエラーとして拒否する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ places: [{ place_id: "legacy" }] }));
    const client = new GooglePlacesClient("server-api-key", fetchMock);

    await expect(
      client.searchNearby({ latitude: 35.681236, longitude: 139.767125 }, [
        "ramen_restaurant",
      ]),
    ).rejects.toThrow(GooglePlacesError);
  });

  it("店舗と徒歩経路の件数が一致しなければ拒否する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        places: [{ id: "place-a" }, { id: "place-b" }],
        routingSummaries: [
          { legs: [{ duration: "120s", distanceMeters: 300 }] },
        ],
      }),
    );
    const client = new GooglePlacesClient("server-api-key", fetchMock);

    await expect(
      client.searchNearby({ latitude: 35.681236, longitude: 139.767125 }, [
        "ramen_restaurant",
      ]),
    ).rejects.toThrow(GooglePlacesError);
  });

  it("Google Placesのタイムアウトを専用エラーへ変換する", async () => {
    const timeoutError = new DOMException("Timed out", "TimeoutError");
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockRejectedValue(timeoutError);
    const client = new GooglePlacesClient("server-api-key", fetchMock);

    await expect(
      client.searchNearby({ latitude: 35.681236, longitude: 139.767125 }, [
        "ramen_restaurant",
      ]),
    ).rejects.toThrow(GooglePlacesError);
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    {
      name: "小数を含む開始価格",
      priceRange: {
        startPrice: { currencyCode: "JPY", units: "800", nanos: 1 },
      },
      expected: null,
    },
    {
      name: "通貨コードが異なる終了価格",
      priceRange: {
        startPrice: { currencyCode: "JPY", units: "800", nanos: 0 },
        endPrice: { currencyCode: "USD", units: "1200", nanos: 0 },
      },
      expected: { currencyCode: "JPY", startPrice: 800, endPrice: null },
    },
    {
      name: "開始価格以下の終了価格",
      priceRange: {
        startPrice: { currencyCode: "JPY", units: "800", nanos: 0 },
        endPrice: { currencyCode: "JPY", units: "800", nanos: 0 },
      },
      expected: { currencyCode: "JPY", startPrice: 800, endPrice: null },
    },
  ])("$nameを保存可能な料金へ変換する", async ({ priceRange, expected }) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(createPlaceDetailsResponse(priceRange));
    const client = new GooglePlacesClient("server-api-key", fetchMock);

    await expect(client.getPlaceDetails("place-a")).resolves.toMatchObject({
      priceRange: expected,
    });
  });

  it("HTTPエラーレスポンスを専用エラーとして拒否する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 503 }));
    const client = new GooglePlacesClient("server-api-key", fetchMock);

    await expect(
      client.searchNearby({ latitude: 35.681236, longitude: 139.767125 }, [
        "ramen_restaurant",
      ]),
    ).rejects.toThrow(GooglePlacesError);
  });

  it("空のAPIキーを拒否する", () => {
    expect(() => new GooglePlacesClient(" ")).toThrow(GooglePlacesError);
  });
});
