import type { ComputeFeaturesUseCase } from "../../ports/compute-features.port";
import type { FeatureObservationInput } from "../../domain/entities/feature-observation.entity";
import type { Series } from "../../domain/entities/series.entity";
import { createFeatureCode } from "../../domain/value-objects/feature-code.vo";
import type { Point } from "../../domain/value-objects/point.vo";
import type { SeriesHistoryModel } from "../../ports/dtos/models/series-history.model";
import type { MacroRepository } from "../../ports/macro-repository.port";
import { FEATURE_DEFINITIONS } from "../../domain/features/definitions/definitions";
import { usdBillions } from "../../domain/features/composites";
import { transform } from "../../domain/features/transforms";

export function computeCountryFeatures(countryId: string, histories: SeriesHistoryModel[], now: Date): FeatureObservationInput[] {
  const available = new Map<string, { points: Point[]; sources: string[] }>();
  const metadata = new Map<string, Series>();
  const result: FeatureObservationInput[] = [];
  const add = (code: string, points: Point[], sources: string[]) => {
    available.set(code, { points, sources });
    result.push(...points.map((point) => ({ ...point, countryId, featureCode: createFeatureCode(code), sourceSeriesIds: sources, computedAt: now })));
  };
  for (const { series, indicator, observations } of histories) {
    available.set(indicator.code, { points: observations, sources: [series.id] });
    metadata.set(indicator.code, series);
    const names = ["yoy", "diff_1", "ma_3", "ma_12", "zscore_120", "percentile"];
    if (series.frequency === "monthly") names.push("mom", "ann_3m", "ann_6m");
    if (series.frequency === "quarterly") names.push("qoq", "qoq_ann");
    for (const name of names) add(`${indicator.code}:${name}`, transform(observations, series.frequency, name), [series.id]);
  }
  for (const definition of FEATURE_DEFINITIONS) {
    if (available.has(definition.code)) continue;
    if (definition.inputs.some((code) => !available.has(code))) continue;
    if (Object.entries(definition.frequencies ?? {}).some(([code, frequency]) => metadata.get(code)?.frequency !== frequency)) continue;
    const inputs: Record<string, Point[]> = {};
    const sources = new Set<string>();
    for (const code of definition.inputs) {
      const input = available.get(code)!;
      for (const source of input.sources) sources.add(source);
      inputs[code] = definition.code === "NET_LIQUIDITY" ? usdBillions(input.points, metadata.get(code)!.unit) : input.points;
    }
    if (definition.code === "OUTPUT_GAP" && metadata.get("GDP_REAL")?.unit !== metadata.get("GDP_POTENTIAL")?.unit) {
      throw new Error("Output gap requires matching real GDP and potential GDP units/base years");
    }
    add(definition.code, definition.compute(inputs), [...sources].sort());
  }
  return result;
}

export function createComputeFeatures(repository: MacroRepository): ComputeFeaturesUseCase {
  return async (countryId, requestedAt) => {
    const series = await repository.countrySeries({ countryId, publicOnly: false });
    const histories: SeriesHistoryModel[] = [];
    for (const indicatorId of new Set(series.map((s) => s.indicatorId))) {
      const history = await repository.history({ countryId, indicatorId, publicOnly: false });
      if (history) histories.push(history);
    }
    const features = computeCountryFeatures(countryId, histories, new Date());
    await repository.saveFeatures({ countryId, features, requestedAt });
    return features.length;
  };
}
