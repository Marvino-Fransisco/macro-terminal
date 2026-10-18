import z from "zod";
import type { ProviderSeriesMetadataResponse } from "@/modules/macro/ports/dtos/responses/provider-series-metadata.response";
import type { MacroDataProvider } from "@/modules/macro/ports/macro-data-provider.port";
import type { ReleaseEventInput } from "@/modules/macro/domain/entities/release-event.entity";
import { createPeriodDate, createPoint, type Frequency, type Point } from "@/modules/macro";
import { createProviderHttpClient, parseProviderNumber, type ProviderHttpClient } from "../http-client";

const pageSchema = z.object({ count: z.number().int().nonnegative(), observations: z.array(z.object({ date: z.string(), value: z.string() })) });
const metadataSchema = z.object({ seriess: z.array(z.object({ id: z.string(), title: z.string(), units: z.string(), frequency_short: z.string(), seasonal_adjustment_short: z.string(), notes: z.string().optional(), last_updated: z.string() })) });
const releasesSchema = z.object({ count: z.number().int().nonnegative(), release_dates: z.array(z.object({ release_id: z.number(), release_name: z.string(), date: z.string() })) });
const seriesReleaseSchema = z.object({ releases: z.array(z.object({ id: z.number().int() })) });
const frequencies: Record<string, Frequency> = { D: "daily", W: "weekly", BW: "weekly", M: "monthly", Q: "quarterly", A: "annual" };

export function createFredProvider(apiKey: string, http: ProviderHttpClient = createProviderHttpClient()): MacroDataProvider {
  if (!apiKey.trim()) throw new Error("FRED_API_KEY is required for FRED ingestion");
  function url(path: string, params: Record<string, string>): URL {
    try {
      const result = new URL(`https://api.stlouisfed.org/fred/${path}`);
      result.search = new URLSearchParams({ ...params, api_key: apiKey, file_type: "json" }).toString();
      return result;
    } catch {
      throw new Error("Invalid FRED request path");
    }
  }
  return {
    async fetchObservations(request): Promise<Point[]> {
      const points: Point[] = [];
      let offset = 0;
      let count = Infinity;
      while (offset < count) {
        const params: Record<string, string> = { series_id: request.providerSeriesId, limit: "100000", offset: String(offset), sort_order: "asc" };
        if (request.from) params.observation_start = request.from;
        if (request.to) params.observation_end = request.to;
        if (request.firstRelease) params.output_type = "4";
        const page = pageSchema.parse(await http.json(url("series/observations", params)));
        count = page.count;
        if (page.observations.length === 0 && offset < count) throw new Error("FRED pagination stopped before count");
        for (const observation of page.observations) {
          const value = parseProviderNumber(observation.value);
          if (value !== undefined) points.push(createPoint(observation.date, value));
        }
        offset += page.observations.length;
      }
      return points;
    },
    async fetchSeriesMetadata(id): Promise<ProviderSeriesMetadataResponse> {
      const data = metadataSchema.parse(await http.json(url("series", { series_id: id })));
      const metadata = data.seriess[0];
      if (!metadata || metadata.id !== id) throw new Error(`FRED metadata missing for ${id}`);
      const updated = new Date(metadata.last_updated);
      const release = seriesReleaseSchema.parse(await http.json(url("series/release", { series_id: id }))).releases[0];
      return {
        id, title: metadata.title, unit: metadata.units,
        frequency: frequencies[metadata.frequency_short] ?? "irregular",
        seasonalAdjustment: metadata.seasonal_adjustment_short === "SA" ? "sa" : metadata.seasonal_adjustment_short === "SAAR" ? "saar" : metadata.seasonal_adjustment_short === "NSA" ? "nsa" : "unknown",
        notes: metadata.notes ?? "", lastUpdated: Number.isFinite(updated.getTime()) ? updated : null,
        releaseId: release ? String(release.id) : null,
      };
    },
    async fetchReleaseEvents(from, to): Promise<ReleaseEventInput[]> {
      const events: ReleaseEventInput[] = [];
      let offset = 0;
      let count = Infinity;
      while (offset < count) {
        const page = releasesSchema.parse(await http.json(url("releases/dates", { realtime_start: from, realtime_end: to, include_release_dates_with_no_data: "true", limit: "1000", offset: String(offset) })));
        count = page.count;
        if (page.release_dates.length === 0 && offset < count) throw new Error("FRED release pagination stopped before count");
        for (const release of page.release_dates) {
          events.push({ provider: "fred", releaseId: String(release.release_id), releaseName: release.release_name, scheduledDate: createPeriodDate(release.date), publishedAt: null });
        }
        offset += page.release_dates.length;
      }
      return events;
    },
  };
}
