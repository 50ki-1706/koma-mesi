/**
 * 日次推薦のカテゴリ探索・距離帯分割・重複排除を検証する。
 * Google通信をスタブ化し、3カテゴリ×3店舗の選出契約を保証する。
 */

import { describe, expect, it, vi } from "vitest";
import type {
  GooglePlaceDetails,
  GooglePlacesGateway,
  NearbyRestaurantCandidate,
} from "./googlePlaces";
import {
  InsufficientRecommendationCandidatesError,
  selectDailyRecommendations,
  selectRestaurantsForCategory,
  splitCandidatesByDistance,
} from "./selection";

/**
 * 距離だけを指定してテスト用候補を生成する。
 *
 * @param id - Google Place IDの末尾。
 * @param distanceMeters - 大学からの徒歩経路距離。
 * @returns Nearby Search候補。
 */
function createCandidate(
  id: string,
  distanceMeters: number,
): NearbyRestaurantCandidate {
  return {
    googlePlaceId: `place-${id}`,
    distanceMeters,
    campusToRestaurantSeconds: Math.ceil(distanceMeters / 80) * 60,
  };
}

describe("splitCandidatesByDistance", () => {
  it("距離順の候補をnear・middle・farへ均等に分割する", () => {
    const groups = splitCandidatesByDistance([
      createCandidate("6", 600),
      createCandidate("2", 200),
      createCandidate("4", 400),
      createCandidate("1", 100),
      createCandidate("5", 500),
      createCandidate("3", 300),
    ]);

    expect(groups.near.map((candidate) => candidate.distanceMeters)).toEqual([
      100, 200,
    ]);
    expect(groups.middle.map((candidate) => candidate.distanceMeters)).toEqual([
      300, 400,
    ]);
    expect(groups.far.map((candidate) => candidate.distanceMeters)).toEqual([
      500, 600,
    ]);
  });
});

describe("selectRestaurantsForCategory", () => {
  it("800m超過と選択済み店舗を除外して各距離帯から1店舗選ぶ", () => {
    const selections = selectRestaurantsForCategory(
      "ラーメン",
      [
        createCandidate("selected", 100),
        createCandidate("near", 200),
        createCandidate("middle", 500),
        createCandidate("far", 800),
        createCandidate("outside", 801),
      ],
      new Set(["place-selected"]),
      () => 0,
    );

    expect(selections).toEqual([
      expect.objectContaining({
        distanceGroup: "near",
        googlePlaceId: "place-near",
      }),
      expect.objectContaining({
        distanceGroup: "middle",
        googlePlaceId: "place-middle",
      }),
      expect.objectContaining({
        distanceGroup: "far",
        googlePlaceId: "place-far",
      }),
    ]);
  });

  it("利用可能な候補が3店舗未満ならカテゴリを採用しない", () => {
    expect(
      selectRestaurantsForCategory(
        "ラーメン",
        [createCandidate("1", 100), createCandidate("2", 200)],
        new Set(),
        () => 0,
      ),
    ).toBeNull();
  });
});

describe("selectDailyRecommendations", () => {
  it("候補不足カテゴリを飛ばして3カテゴリ×3店舗を重複なく選ぶ", async () => {
    const searchedPrimaryTypes: Array<readonly string[]> = [];
    let searchIndex = 0;
    const gateway: GooglePlacesGateway = {
      searchNearby: vi.fn(async (_origin, includedPrimaryTypes) => {
        searchedPrimaryTypes.push(includedPrimaryTypes);
        searchIndex += 1;
        if (searchIndex === 1) {
          return [
            createCandidate("only-1", 100),
            createCandidate("only-2", 200),
          ];
        }
        return [
          createCandidate(`${searchIndex}-1`, 100),
          createCandidate(`${searchIndex}-2`, 300),
          createCandidate(`${searchIndex}-3`, 700),
        ];
      }),
      getPlaceDetails: vi.fn(async (): Promise<GooglePlaceDetails> => {
        throw new Error("選定テストでは呼び出しません。");
      }),
    };

    const selections = await selectDailyRecommendations(
      gateway,
      { latitude: 35.681236, longitude: 139.767125 },
      () => 0,
    );

    expect(selections).toHaveLength(9);
    expect(new Set(selections.map((item) => item.googlePlaceId)).size).toBe(9);
    expect(new Set(selections.map((item) => item.category)).size).toBe(3);
    expect(searchedPrimaryTypes).toHaveLength(4);
    expect(searchedPrimaryTypes.every((types) => types.length > 0)).toBe(true);
  });

  it("全カテゴリで候補が不足した場合は固定メッセージの例外を返す", async () => {
    const gateway: GooglePlacesGateway = {
      searchNearby: vi.fn(async () => [
        createCandidate("only-1", 100),
        createCandidate("only-2", 200),
      ]),
      getPlaceDetails: vi.fn(async (): Promise<GooglePlaceDetails> => {
        throw new Error("選定テストでは呼び出しません。");
      }),
    };

    await expect(
      selectDailyRecommendations(
        gateway,
        { latitude: 35.681236, longitude: 139.767125 },
        () => 0,
      ),
    ).rejects.toEqual(
      new InsufficientRecommendationCandidatesError(),
    );
    expect(gateway.searchNearby).toHaveBeenCalledTimes(11);
  });
});
