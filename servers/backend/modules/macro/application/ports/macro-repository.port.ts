import type { CountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import type { Country } from "../../domain/entities/country.entity";
import type { FeatureObservation, FeatureObservationInput } from "../../domain/entities/feature-observation.entity";
import type { Indicator } from "../../domain/entities/indicator.entity";
import type { Observation } from "../../domain/entities/observation.entity";
import type { ReleaseEvent, ReleaseEventInput } from "../../domain/entities/release-event.entity";
import type { Series } from "../../domain/entities/series.entity";
import type { FeatureCode } from "../../domain/value-objects/feature-code.vo";
import type { IndicatorCode } from "../../domain/value-objects/indicator-code.vo";
import type { PeriodDate } from "../../domain/value-objects/period-date.vo";
import type { CoverageRowResponse } from "../dtos/responses/coverage-row.response";
import type { SeriesHistoryResponse } from "../dtos/responses/series-history.response";
import type { HistoryRequest } from "../dtos/requests/history.request";
import type { Point } from "../../domain/value-objects/point.vo";

export interface MacroRepository {
  coverage(publicOnly: boolean): Promise<CoverageRowResponse[]>;
  providerFailures(): Promise<{ provider: string; seriesId: string; consecutiveFailures: number }[]>;
  claimDue(now: Date, limit: number): Promise<Series[]>;
  findSeries(id: string): Promise<Series | undefined>;
  findCountry(code: CountryIso3): Promise<Country | undefined>;
  findIndicator(code: IndicatorCode): Promise<Indicator | undefined>;
  startRun(seriesId: string): Promise<string>;
  completeRun(runId: string, series: Series, points: Point[], now: Date, nextPollAt: Date): Promise<number>;
  failRun(runId: string, seriesId: string, error: string, nextPollAt: Date): Promise<void>;
  history(query: HistoryRequest, publicOnly: boolean): Promise<SeriesHistoryResponse | undefined>;
  vintages(seriesId: string): Promise<Observation[]>;
  countrySeries(countryId: string, publicOnly: boolean): Promise<Series[]>;
  countries(): Promise<Country[]>;
  indicators(category?: string): Promise<Indicator[]>;
  calendar(from: PeriodDate, to: PeriodDate, countryId?: string): Promise<ReleaseEvent[]>;
  saveReleases(events: ReleaseEventInput[]): Promise<void>;
  pendingFeatureJobs(limit: number): Promise<{ countryId: string; requestedAt: Date }[]>;
  saveFeatures(countryId: string, features: FeatureObservationInput[], requestedAt: Date): Promise<void>;
  features(countryId: string, code: FeatureCode, from?: PeriodDate, to?: PeriodDate): Promise<FeatureObservation[]>;
}
