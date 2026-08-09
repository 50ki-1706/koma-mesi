/**
 * Google Geocoding APIクライアントのリクエストとZod変換を検証する。
 * 該当なし・通信異常・不正応答をそれぞれ正しく処理することを保証する。
 */

import { describe, expect, it, vi } from "vitest";
import { GeocodingError, geocodeAddress } from "./geocoding";

describe("geocodeAddress", () => {
  it("住所を緯度経度へ変換する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status: "OK",
        results: [
          { geometry: { location: { lat: 35.681236, lng: 139.767125 } } },
        ],
      }),
    );

    const location = await geocodeAddress(
      "東京都千代田区1-1",
      "server-api-key",
      fetchMock,
    );

    expect(location).toEqual({ latitude: 35.681236, longitude: 139.767125 });
    const request = fetchMock.mock.calls[0];
    const requestedUrl = new URL(String(request?.[0]));
    expect(requestedUrl.searchParams.get("address")).toBe("東京都千代田区1-1");
    expect(requestedUrl.searchParams.get("key")).toBe("server-api-key");
  });

  it("該当住所がない場合はnullを返す", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ status: "ZERO_RESULTS" }));

    const location = await geocodeAddress(
      "存在しない住所",
      "server-api-key",
      fetchMock,
    );

    expect(location).toBeNull();
  });

  it("HTTPエラー時は例外を送出する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("error", { status: 500 }));

    await expect(
      geocodeAddress("東京都千代田区1-1", "server-api-key", fetchMock),
    ).rejects.toThrow(GeocodingError);
  });

  it("APIがエラーステータスを返した場合は例外を送出する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ status: "REQUEST_DENIED" }));

    await expect(
      geocodeAddress("東京都千代田区1-1", "server-api-key", fetchMock),
    ).rejects.toThrow(GeocodingError);
  });

  it("不正なJSON応答の場合は例外を送出する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("{invalid-json", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      geocodeAddress("東京都千代田区1-1", "server-api-key", fetchMock),
    ).rejects.toThrow(GeocodingError);
  });

  it("タイムアウト時は例外を送出する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() => {
      const error = new Error("timed out");
      error.name = "TimeoutError";
      return Promise.reject(error);
    });

    await expect(
      geocodeAddress("東京都千代田区1-1", "server-api-key", fetchMock),
    ).rejects.toThrow(GeocodingError);
  });
});
