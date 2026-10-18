import type { Country } from "../../../domain/entities/country.entity";

export type CountryCoverageResponse = Country & {
  coverageTier: number;
  indicatorCount: number;
}
