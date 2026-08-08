/**
 * Google Places APIクライアントのリクエストとZod変換を検証する。
 * 写真を要求せず、徒歩経路と選出店舗詳細だけを扱うことを保証する。
 */

import { describe, expect, it, vi } from "vitest";
import { GooglePlacesClient } from "./googlePlaces";

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

  it("想定外のGoogleレスポンスをZodで拒否する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ places: [{ place_id: "legacy" }] }));
    const client = new GooglePlacesClient("server-api-key", fetchMock);

    await expect(
      client.searchNearby({ latitude: 35.681236, longitude: 139.767125 }, [
        "ramen_restaurant",
      ]),
    ).rejects.toThrow();
  });
});
