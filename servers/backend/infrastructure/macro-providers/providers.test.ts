import { expect, test } from "bun:test";
import { createProviderHttpClient, parseProviderNumber } from "./http-client";
import { createFredProvider } from "./fred/fred.provider";
import { createPoint } from "@/modules/macro";
import { createWorldBankProvider } from "./worldbank/worldbank.provider";

function fakeHttp(responses: unknown[]) {
  const urls: URL[] = [];
  return { urls, async json(url: URL) { urls.push(url); const next = responses.shift(); if (next === undefined) throw new Error("Unexpected request"); return next; } };
}

test("FRED paginates and skips missing markers", async () => {
  const http = fakeHttp([{ count: 3, observations: [{ date: "2024-01-01", value: "1.5" }, { date: "2024-02-01", value: "." }] }, { count: 3, observations: [{ date: "2024-03-01", value: "2" }] }]);
  const result = await createFredProvider("test", http).fetchObservations({ providerSeriesId: "TEST" });
  expect(result).toEqual([createPoint("2024-01-01", 1.5), createPoint("2024-03-01", 2)]);
  expect(http.urls[1]!.searchParams.get("offset")).toBe("2");
});

test("provider rejects malformed/non-finite numbers", () => {
  expect(parseProviderNumber(null)).toBeUndefined();
  expect(() => parseProviderNumber("Infinity")).toThrow();
  expect(() => parseProviderNumber("bad")).toThrow();
});

test("World Bank paginates all-country observations, filters country and caches indicator", async () => {
  const http = fakeHttp([[{ pages: 2 }, [{ countryiso3code: "USA", date: "2023", value: 2 }]], [{ pages: 2 }, [{ countryiso3code: "DEU", date: "2023", value: 1 }, { countryiso3code: "USA", date: "2022", value: null }]]]);
  const provider = createWorldBankProvider(http);
  expect(await provider.fetchObservations({ providerSeriesId: "USA:TEST" })).toEqual([createPoint("2023-01-01", 2)]);
  expect(await provider.fetchObservations({ providerSeriesId: "DEU:TEST" })).toEqual([createPoint("2023-01-01", 1)]);
  expect(http.urls.length).toBe(2);
});

test("World Bank distinguishes aggregates", async () => {
  const http = fakeHttp([[{ pages: 1 }, [{ id: "USA", iso2Code: "US", name: "United States", region: { id: "NAC", value: "North America" } }, { id: "WLD", iso2Code: "1W", name: "World", region: { id: "NA", value: "Aggregates" } }]]]);
  expect((await createWorldBankProvider(http).fetchCountries()).map((c) => c.isAggregate)).toEqual([false, true]);
});

test("HTTP retries 429 with Retry-After and redacts query secrets on errors", async () => {
  const delays: number[] = [];
  let calls = 0;
  const http = createProviderHttpClient({ minIntervalMs: 0, sleep: async (ms) => { delays.push(ms); }, fetch: (async () => {
    calls++;
    return calls === 1 ? new Response(null, { status: 429, headers: { "retry-after": "2" } }) : Response.json({ ok: true });
  }) });
  expect(await http.json(new URL("https://example.com?api_key=secret"))).toEqual({ ok: true });
  expect(delays).toContain(2000);
  const failing = createProviderHttpClient({ retries: 0, minIntervalMs: 0, fetch: async () => new Response(null, { status: 403 }) });
  await expect(failing.json(new URL("https://example.com?api_key=secret"))).rejects.toThrow("Provider HTTP 403: example.com");
});

test("FRED metadata discovers release association through the documented endpoint", async () => {
  const http = fakeHttp([{ seriess: [{ id: "TEST", title: "Test", units: "Index", frequency_short: "M", seasonal_adjustment_short: "SA", last_updated: "2024-01-01T12:00:00Z", notes: "Copyright owner" }] }, { releases: [{ id: 10 }] }]);
  const metadata = await createFredProvider("test", http).fetchSeriesMetadata("TEST");
  expect(metadata.releaseId).toBe("10");
  expect(metadata.frequency).toBe("monthly");
  expect(http.urls[1]!.pathname).toBe("/fred/series/release");
});

test("FRED release dates paginate and never invent publication timestamps", async () => {
  const http = fakeHttp([{ count: 2, release_dates: [{ release_id: 1, release_name: "First", date: "2024-01-01" }] }, { count: 2, release_dates: [{ release_id: 2, release_name: "Second", date: "2024-02-01" }] }]);
  const provider = createFredProvider("test", http);
  const events = await provider.fetchReleaseEvents!("2024-01-01", "2024-02-01");
  expect(events.map((event) => event.releaseId)).toEqual(["1", "2"]);
  expect(events.every((event) => event.publishedAt === null)).toBe(true);
  expect(http.urls[1]!.searchParams.get("offset")).toBe("1");
});

test("FRED rejects truncated pagination instead of committing partial history", async () => {
  const http = fakeHttp([{ count: 1, observations: [] }]);
  await expect(createFredProvider("test", http).fetchObservations({ providerSeriesId: "TEST" })).rejects.toThrow("pagination stopped");
});
