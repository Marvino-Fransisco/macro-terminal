import { createCountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import type { MacroRepository } from "../../ports/macro-repository.port";
import type { GetSeriesRequest } from "../../ports/dtos/requests/get-series.request";
import type { MacroUseCase } from "../../ports/macro.port";
import { createFeatureCode } from "../../domain/value-objects/feature-code.vo";
import { createIndicatorCode } from "../../domain/value-objects/indicator-code.vo";
import { createPeriodDate, type PeriodDate } from "../../domain/value-objects/period-date.vo";
import { MacroValidationError } from "../../domain/errors/macro-validation.error";
import { revisions } from "../../domain/features/growth";
import { transform } from "../../domain/features/transforms";
import { FEATURE_DEFINITIONS } from "../../domain/features/definitions/definitions";
import { crossCountryFeatures } from "../../domain/features/cross-country/cross-country";

import { providerAttributions } from "../../constants/attribution";

export function parseRange(from?: string, to?: string): { from?: PeriodDate; to?: PeriodDate } {
  const range: { from?: PeriodDate; to?: PeriodDate } = {};
  if (from) range.from = createPeriodDate(from);
  if (to) range.to = createPeriodDate(to);
  if (range.from && range.to && range.from > range.to) throw new MacroValidationError("from must not exceed to");
  return range;
}

export function createGetMacro(repository: MacroRepository): MacroUseCase {
  async function getSeries(request: GetSeriesRequest) {
    const country = createCountryIso3(request.country);
    const indicator = createIndicatorCode(request.indicator);
    const range = parseRange(request.from, request.to);
    const asOf = request.asOf ? createPeriodDate(request.asOf) : undefined;
    const countryRecord = await repository.findCountry(country);
    if (!countryRecord) return undefined;
    if (FEATURE_DEFINITIONS.some((d) => d.code === indicator) && !request.feature) {
      if (asOf) throw new MacroValidationError("Point-in-time composites are not supported");
      const publicSeries = await repository.countrySeries({ countryId: countryRecord.id, publicOnly: true });
      const allowed = new Set(publicSeries.map((s) => s.id));
      const points = (await repository.features({ countryId: countryRecord.id, code: createFeatureCode(indicator), ...range }))
        .filter((p) => p.sourceSeriesIds.length > 0 && p.sourceSeriesIds.every((id) => allowed.has(id)));
      const used = new Set(points.flatMap((p) => p.sourceSeriesIds));
      const sources = publicSeries.filter((s) => used.has(s.id)).map((s) => ({ seriesId: s.id, provider: s.provider, providerSeriesId: s.providerSeriesId, unit: s.unit, methodology: s.methodology }));
      return points.length > 0 ? { country, indicator, feature: null, series: null, sources, observations: points, attributions: providerAttributions(sources.map((s) => s.provider), true) } : undefined;
    }
    const indicatorRecord = await repository.findIndicator(indicator);
    if (!indicatorRecord) return undefined;
    const history = await repository.history({ countryId: countryRecord.id, indicatorId: indicatorRecord.id, publicOnly: true, ...(asOf ? { asOf } : {}) });
    if (!history) return undefined;
    let observations = history.observations.map(({ periodDate, value }) => ({ periodDate, value }));
    if (request.feature === "revision") {
      const vintages = await repository.vintages(history.series.id);
      observations = revisions(vintages.filter((p) => !asOf || p.realtimeStart <= asOf));
    } else if (request.feature) {
      observations = transform(observations, history.series.frequency, request.feature);
    }
    observations = observations.filter((p) => (!range.from || p.periodDate >= range.from) && (!range.to || p.periodDate <= range.to));
    const { series } = history;
    return { country, indicator, feature: request.feature ?? null, series: { id: series.id, provider: series.provider, providerSeriesId: series.providerSeriesId, frequency: series.frequency, unit: request.feature ? "derived; see feature definition" : series.unit, seasonalAdjustment: series.seasonalAdjustment, methodology: series.methodology }, observations, attributions: providerAttributions([series.provider], Boolean(request.feature)) };
  }
  return {
    getSeries,
    async countries() {
      const [countries, coverage] = await Promise.all([repository.countries(), repository.coverage(true)]);
      return countries.map((country) => {
        const rows = coverage.filter((row) => row.countryIso3 === country.iso3 && row.periods > 0);
        return { ...country, coverageTier: rows.some((row) => row.frequency !== "annual") ? 1 : rows.length > 0 ? 2 : 0, indicatorCount: new Set(rows.map((row) => row.indicatorCode)).size };
      });
    },
    async indicators(category?: string) {
      return repository.indicators(category);
    },
    async overview(countryInput: string) {
      const country = createCountryIso3(countryInput);
      const countryRecord = await repository.findCountry(country);
      if (!countryRecord) return { country, indicators: [], attributions: [] };
      const series = await repository.countrySeries({ countryId: countryRecord.id, publicOnly: true });
      const indicatorIds = [...new Set(series.map((s) => s.indicatorId))];
      const today = createPeriodDate(new Date().toISOString().slice(0, 10));
      const horizon = createPeriodDate(new Date(Date.now() + 180 * 86400_000).toISOString().slice(0, 10));
      const releases = await repository.calendar({ from: today, to: horizon, countryId: countryRecord.id });
      const rows = [];
      for (const indicatorId of indicatorIds) {
        const history = await repository.history({ countryId: countryRecord.id, indicatorId, publicOnly: true });
        if (!history) continue;
        const latest = history.observations.at(-1)!;
        const previous = history.observations.at(-2);
        rows.push({ indicator: history.indicator.code, latest: { periodDate: latest.periodDate, value: latest.value }, previous: previous ? { periodDate: previous.periodDate, value: previous.value } : null, change: previous ? latest.value - previous.value : null, nextRelease: releases.find((release) => release.provider === history.series.provider && release.releaseId === history.series.providerReleaseId) ?? null, provider: history.series.provider, frequency: history.series.frequency, unit: history.series.unit, methodology: history.series.methodology });
      }
      return { country, indicators: rows, attributions: providerAttributions(rows.map((row) => row.provider), true) };
    },
    async compare(indicatorInput: string, countryInputs: string[], from?: string, to?: string) {
      const range = parseRange(from, to);
      const indicator = createIndicatorCode(indicatorInput);
      const countries = [...new Set(countryInputs.map(createCountryIso3))];
      if (countries.length < 2 || countries.length > 20) throw new MacroValidationError("Compare requires 2 to 20 distinct countries");
      const indicatorRecord = await repository.findIndicator(indicator);
      const countryRecords = await Promise.all(countries.map((country) => repository.findCountry(country)));
      if (!indicatorRecord || countryRecords.some((record) => !record)) return undefined;
      const histories = await Promise.all(countryRecords.map((record) => repository.history({ countryId: record!.id, indicatorId: indicatorRecord.id, publicOnly: true, ...range })));
      if (histories.some((h) => !h)) return undefined;
      const available = histories.map((h) => h!);
      const reference = available[0]!.series;
      if (available.some((h) => h.series.frequency !== reference.frequency || h.series.unit !== reference.unit || h.series.seasonalAdjustment !== reference.seasonalAdjustment)) {
        throw new MacroValidationError("Comparison requires matching frequency, unit and seasonal adjustment");
      }
      const indexed = available.map((h) => new Map(h.observations.map((p) => [p.periodDate, p.value])));
      const dates = [...indexed[0]!.keys()].filter((date) => indexed.every((values) => values.has(date))).sort();
      return { indicator, countries, crossSection: crossCountryFeatures(Object.fromEntries(available.map((h, index) => [countries[index]!, h.observations]))) ?? null, frequency: reference.frequency, unit: reference.unit, mixedProviders: new Set(available.map((h) => h.series.provider)).size > 1, sources: available.map((h, index) => ({ country: countries[index]!, provider: h.series.provider, seriesId: h.series.id, methodology: h.series.methodology })), observations: dates.map((periodDate) => ({ periodDate, values: Object.fromEntries(countries.map((country, index) => [country, indexed[index]!.get(periodDate)!])) })), attributions: providerAttributions(available.map((h) => h.series.provider), true) };
    },
    async calendar(from: string, to: string, country?: string) {
      parseRange(from, to);
      const countryRecord = country ? await repository.findCountry(createCountryIso3(country)) : undefined;
      if (country && !countryRecord) return { events: [], attributions: [] };
      const events = await repository.calendar({ from: createPeriodDate(from), to: createPeriodDate(to), ...(countryRecord ? { countryId: countryRecord.id } : {}) });
      return { events, attributions: providerAttributions(events.map((event) => event.provider)) };
    },
  };
}
