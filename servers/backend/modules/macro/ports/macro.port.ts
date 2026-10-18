import type { Indicator } from "../domain/entities/indicator.entity";
import type { CalendarResponse } from "./dtos/responses/calendar.response";
import type { CompareResponse } from "./dtos/responses/compare.response";
import type { CountryCoverageResponse } from "./dtos/responses/country-coverage.response";
import type { GetSeriesRequest } from "./dtos/requests/get-series.request";
import type { GetSeriesResponse } from "./dtos/responses/get-series.response";
import type { OverviewResponse } from "./dtos/responses/overview.response";

export interface MacroUseCase {
  getSeries(request: GetSeriesRequest): Promise<GetSeriesResponse | undefined>;
  countries(): Promise<CountryCoverageResponse[]>;
  indicators(category?: string): Promise<Indicator[]>;
  overview(country: string): Promise<OverviewResponse>;
  compare(indicator: string, countries: string[], from?: string, to?: string): Promise<CompareResponse | undefined>;
  calendar(from: string, to: string, country?: string): Promise<CalendarResponse>;
}
