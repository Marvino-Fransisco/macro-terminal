import type { MacroDataProvider } from "../ports/macro-data-provider.port";
import type { MacroRepository } from "../ports/macro-repository.port";
import type { Frequency } from "../../domain/value-objects/frequency.vo";
import type { Provider } from "../../domain/value-objects/provider.vo";
import type { Series } from "../../domain/entities/series.entity";
import type { Point } from "../../domain/value-objects/point.vo";
import { createPeriodDate } from "../../domain/value-objects/period-date.vo";

export function nextPollAt(frequency: Frequency, now: Date): Date {
  const hours: Record<Frequency, number> = { daily: 6, weekly: 12, monthly: 24, quarterly: 24, annual: 168, irregular: 6 };
  return new Date(now.getTime() + hours[frequency] * 3600_000);
}

export function normalizeObservations(points: Point[]): Point[] {
  const unique = new Map<string, Point>();
  for (const point of points) {
    createPeriodDate(point.periodDate);
    if (!Number.isFinite(point.value)) throw new Error("Cannot ingest a non-finite observation");
    const previous = unique.get(point.periodDate);
    if (previous && previous.value !== point.value) throw new Error(`Conflicting provider values for ${point.periodDate}`);
    unique.set(point.periodDate, point);
  }
  return [...unique.values()].sort((a, b) => a.periodDate.localeCompare(b.periodDate));
}

export function createIngestSeries(repository: MacroRepository, resolve: (provider: Provider) => MacroDataProvider, clock = () => new Date()) {
  return async (series: Series, range?: { from: string; to: string }) => {
    const runId = await repository.startRun(series.id);
    try {
      let from = range?.from;
      if (!range && series.frequency === "daily" && series.lastPolledAt) {
        const history = await repository.history({ countryId: series.countryId, indicatorId: series.indicatorId }, false);
        const latest = history?.series.id === series.id ? history.observations.at(-1) : undefined;
        if (latest) from = new Date(Date.parse(latest.periodDate) - 30 * 86400_000).toISOString().slice(0, 10);
      }
      const points = normalizeObservations(await resolve(series.provider).fetchObservations({
        providerSeriesId: series.providerSeriesId,
        ...(from ? { from } : {}), ...(range ? { to: range.to } : {}),
      }));
      const now = clock();
      const inserted = await repository.completeRun(runId, series, points, now, nextPollAt(series.frequency, now));
      return { rowsFetched: points.length, rowsInserted: inserted };
    } catch (error) {
      await repository.failRun(runId, series.id, error instanceof Error ? error.message : "Unknown ingestion error", new Date(clock().getTime() + 15 * 60_000));
      throw error;
    }
  };
}
