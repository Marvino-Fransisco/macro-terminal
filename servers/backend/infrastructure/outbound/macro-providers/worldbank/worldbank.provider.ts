import type { MacroDataProvider } from "@/modules/macro/ports/macro-data-provider.port";
import type { CountryInput } from "@/modules/macro/domain/entities/country.entity";
import { createCountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import { createCountryIso2 } from "@/modules/shared/domain/value-objects/country-iso2.vo";
import { createName } from "@/modules/shared/domain/value-objects/name.vo";
import {
  createPoint,
  type Point,
} from "@/modules/macro/domain/value-objects/point.vo";
import {
  createProviderHttpClient,
  parseProviderNumber,
  type ProviderHttpClient,
} from "../http-client";
import { worldBankCountryResponseSchema } from "./dtos/responses/worldbank-country.response";
import { worldBankEnvelopeResponseSchema } from "./dtos/responses/worldbank-envelope.response";
import { worldBankIndicatorResponseSchema } from "./dtos/responses/worldbank-indicator.response";
import { worldBankObservationResponseSchema, type WorldBankObservationResponse } from "./dtos/responses/worldbank-observation.response";

export function createWorldBankProvider(
  baseUrl: string,
  http: ProviderHttpClient = createProviderHttpClient(),
): MacroDataProvider & { fetchCountries(): Promise<CountryInput[]> } {
  async function pages(
    path: string,
    params: Record<string, string> = {},
  ): Promise<unknown[]> {
    const results: unknown[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      let url: URL;

      try {
        url = new URL(`${baseUrl}/${path}`);
      } catch {
        throw new Error("Invalid World Bank request path");
      }

      url.search = new URLSearchParams({
        format: "json",
        per_page: "20000",
        ...params,
        page: String(page),
      }).toString();

      const [meta, rows] = worldBankEnvelopeResponseSchema.parse(await http.json(url));
      totalPages = meta.pages;
      results.push(...(rows ?? []));
      page++;
    }

    return results;
  }

  const cache = new Map<
    string,
    { expires: number; data: Promise<WorldBankObservationResponse[]> }
  >();

  return {
    async fetchCountries() {
      return (await pages("country")).map((row) => {
        const country = worldBankCountryResponseSchema.parse(row);

        return {
          iso3: createCountryIso3(country.id),
          iso2: createCountryIso2(country.iso2Code),
          name: createName(country.name),
          currency: null,
          region: country.region.value,
          isAggregate: country.region.id === "NA",
        };
      });
    },

    async fetchSeriesMetadata(id) {
      const code = id.includes(":") ? id.split(":")[1]! : id;
      const [raw] = await pages(`indicator/${encodeURIComponent(code)}`);

      const metadata = worldBankIndicatorResponseSchema.parse(raw);
      if (metadata.id !== code)
        throw new Error(`World Bank metadata missing for ${code}`);

      return {
        id,
        title: metadata.name,
        unit: metadata.unit || "provider-defined",
        frequency: "annual",
        seasonalAdjustment: "nsa",
        notes: metadata.sourceNote ?? "",
        lastUpdated: null,
        releaseId: null,
      };
    },

    async fetchObservations(request): Promise<Point[]> {
      const [country, indicator, extra] = request.providerSeriesId.split(":");
      if (!country || !indicator || extra || !/^[A-Z]{3}$/.test(country))
        throw new Error("World Bank series id must be ISO3:indicator");

      const range = `${request.from?.slice(0, 4) ?? "1960"}:${request.to?.slice(0, 4) ?? new Date().getUTCFullYear()}`;
      const key = `${indicator}:${range}`;

      let cached = cache.get(key);
      if (!cached || cached.expires <= Date.now()) {
        const data = pages(
          `country/all/indicator/${encodeURIComponent(indicator)}`,
          { date: range },
        ).then((rows) => rows.map((row) => worldBankObservationResponseSchema.parse(row)));
        cached = { expires: Date.now() + 3600_000, data };
        cache.set(key, cached);
        void data.catch(() => cache.delete(key));
      }

      const rows = await cached.data;
      const result: Point[] = [];

      for (const row of rows) {
        if (row.countryiso3code !== country) continue;
        if (!/^\d{4}$/.test(row.date))
          throw new Error("World Bank returned a non-annual period");

        const value = parseProviderNumber(row.value);
        const periodDate = `${row.date}-01-01`;
        if (
          value !== undefined &&
          (!request.from || periodDate >= request.from) &&
          (!request.to || periodDate <= request.to)
        )
          result.push(createPoint(periodDate, value));
      }

      return result.sort((a, b) => a.periodDate.localeCompare(b.periodDate));
    },
  };
}
