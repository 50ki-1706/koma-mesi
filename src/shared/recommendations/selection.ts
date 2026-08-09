/**
 * Nearby Search候補を距離帯へ分割し、重複しない店舗を抽選する。
 * Google通信やDB操作を含まない純粋な推薦選定ロジックを提供する。
 */

import { DISTANCE_GROUPS } from "@/constants/constants";
import {
  GOOGLE_PRIMARY_TYPES_BY_LUNCH_CATEGORY,
  LUNCH_RECOMMENDATION_CATEGORIES,
  type LunchRecommendationCategory,
  MAX_CAMPUS_TO_RESTAURANT_DISTANCE_METERS,
  RECOMMENDATION_CATEGORY_COUNT,
  RECOMMENDATIONS_PER_CATEGORY,
} from "@/constants/recommendationGeneration";
import type {
  Coordinates,
  GooglePlacesGateway,
  NearbyRestaurantCandidate,
} from "./googlePlaces";
import type { SelectedRestaurant } from "./repository";

/** 推薦店舗の距離グループ。 */
export type DistanceGroup = (typeof DISTANCE_GROUPS)[number];

/** テストで固定可能な0以上1未満の乱数生成関数。 */
export type RandomSource = () => number;

/** 推薦候補が9店舗揃わないことを表すエラー。 */
export class InsufficientRecommendationCandidatesError extends Error {
  /** 推薦候補不足エラーを生成する。 */
  constructor() {
    super(
      `${MAX_CAMPUS_TO_RESTAURANT_DISTANCE_METERS}m以内に${RECOMMENDATIONS_PER_CATEGORY}店舗あるカテゴリを${RECOMMENDATION_CATEGORY_COUNT}つ確保できませんでした。`,
    );
    this.name = "InsufficientRecommendationCandidatesError";
  }
}

/**
 * 配列をFisher-Yates法でシャッフルする。
 *
 * @param values - 並べ替える値。
 * @param random - 0以上1未満の乱数生成関数。
 * @returns 元配列を変更しないシャッフル済み配列。
 */
export function shuffle<T>(values: readonly T[], random: RandomSource): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex] as T,
      shuffled[index] as T,
    ];
  }
  return shuffled;
}

/**
 * 距離順候補を件数が均等になる3グループへ分割する。
 *
 * @param candidates - 距離順に並べる候補。
 * @returns near、middle、farの候補配列。
 */
export function splitCandidatesByDistance(
  candidates: readonly NearbyRestaurantCandidate[],
): Record<DistanceGroup, NearbyRestaurantCandidate[]> {
  const sorted = [...candidates].sort(
    (left, right) => left.distanceMeters - right.distanceMeters,
  );
  const groups: Record<DistanceGroup, NearbyRestaurantCandidate[]> = {
    near: [],
    middle: [],
    far: [],
  };

  sorted.forEach((candidate, index) => {
    const groupIndex = Math.min(
      DISTANCE_GROUPS.length - 1,
      Math.floor((index * DISTANCE_GROUPS.length) / sorted.length),
    );
    const distanceGroup = DISTANCE_GROUPS[groupIndex];
    if (distanceGroup !== undefined) {
      groups[distanceGroup].push(candidate);
    }
  });
  return groups;
}

/**
 * 1カテゴリの候補から各距離帯を1店舗ずつ抽選する。
 *
 * @param category - ホットペッパー由来カテゴリ。
 * @param candidates - Nearby Search候補。
 * @param excludedPlaceIds - 他カテゴリですでに選択したPlace ID。
 * @param random - 0以上1未満の乱数生成関数。
 * @returns 3店舗揃った場合の選出結果。候補不足ならnull。
 */
export function selectRestaurantsForCategory(
  category: LunchRecommendationCategory,
  candidates: readonly NearbyRestaurantCandidate[],
  excludedPlaceIds: ReadonlySet<string>,
  random: RandomSource,
): SelectedRestaurant[] | null {
  const uniqueCandidates = [
    ...new Map(
      candidates
        .filter(
          (candidate) =>
            candidate.distanceMeters <=
              MAX_CAMPUS_TO_RESTAURANT_DISTANCE_METERS &&
            !excludedPlaceIds.has(candidate.googlePlaceId),
        )
        .map((candidate) => [candidate.googlePlaceId, candidate]),
    ).values(),
  ];

  if (uniqueCandidates.length < RECOMMENDATIONS_PER_CATEGORY) {
    return null;
  }

  const groups = splitCandidatesByDistance(uniqueCandidates);
  const selections = DISTANCE_GROUPS.map((distanceGroup) => {
    const group = groups[distanceGroup];
    const candidate = group[Math.floor(random() * group.length)];
    if (candidate === undefined) {
      return null;
    }
    return {
      category,
      distanceGroup,
      googlePlaceId: candidate.googlePlaceId,
      distanceMeters: candidate.distanceMeters,
      campusToRestaurantSeconds: candidate.campusToRestaurantSeconds,
    };
  });

  return selections.every(
    (selection): selection is SelectedRestaurant => selection !== null,
  )
    ? selections
    : null;
}

/**
 * ランダム順にカテゴリを検索し、3カテゴリ×3店舗を選出する。
 *
 * @param gateway - Google Places操作。
 * @param origin - 大学の座標。
 * @param random - 0以上1未満の乱数生成関数。
 * @returns 重複しない9店舗の選出結果。
 */
export async function selectDailyRecommendations(
  gateway: GooglePlacesGateway,
  origin: Coordinates,
  random: RandomSource,
): Promise<SelectedRestaurant[]> {
  const selectedPlaceIds = new Set<string>();
  const selections: SelectedRestaurant[] = [];
  const categories = shuffle(LUNCH_RECOMMENDATION_CATEGORIES, random);

  for (const category of categories) {
    const candidates = await gateway.searchNearby(
      origin,
      GOOGLE_PRIMARY_TYPES_BY_LUNCH_CATEGORY[category],
    );
    const categorySelections = selectRestaurantsForCategory(
      category,
      candidates,
      selectedPlaceIds,
      random,
    );
    if (categorySelections === null) {
      continue;
    }

    for (const selection of categorySelections) {
      selectedPlaceIds.add(selection.googlePlaceId);
      selections.push(selection);
    }
    if (
      selections.length ===
      RECOMMENDATION_CATEGORY_COUNT * RECOMMENDATIONS_PER_CATEGORY
    ) {
      return selections;
    }
  }

  throw new InsufficientRecommendationCandidatesError();
}
