import { writeFile } from "node:fs/promises";
import { ENV } from "@/configs/env";
import { createSupabaseConnection } from "@/infrastructure/outbound/database/connections/supabase.connection";
import { countriesTable } from "@/infrastructure/outbound/database/schemas/country.schema";
import { indicatorsTable } from "@/infrastructure/outbound/database/schemas/indicator.schema";
import { seriesTable } from "@/infrastructure/outbound/database/schemas/series.schema";
import { createMacroRepository } from "@/infrastructure/outbound/database/repositories/macro/macro-repository.drizzle";
import { createFredProvider } from "@/infrastructure/outbound/macro-providers/fred/fred.provider";
import { createWorldBankProvider } from "@/infrastructure/outbound/macro-providers/worldbank/worldbank.provider";
import { createProviderRegistry } from "@/infrastructure/outbound/macro-providers/provider-registry";
import { INDICATORS } from "@/modules/macro/domain/entities/indicator.entity";
import { US_CATALOG } from "@/modules/macro/constants/us-catalog.const";
import { WORLD_BANK_CATALOG } from "@/modules/macro/constants/world-bank-catalog.const";
import { createIngestSeries } from "@/modules/macro/application/use-cases/ingest-series";
import { createBackfillSeries } from "@/modules/macro/application/use-cases/backfill-series";
import { createPeriodDate, createPriority } from "@/modules/macro";
import { createCountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import { isStale } from "@/modules/macro/domain/features/staleness";
import type { ProviderSeriesMetadataResponse } from "@/modules/macro/ports/dtos/responses/provider-series-metadata.response";

function requireIndicatorId(indicatorIds: Map<string, string>, code: string) {
  const id = indicatorIds.get(code);
  if (!id) throw new Error(`Run seed first: unknown indicator ${code}`);
  return id;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const worldbank = createWorldBankProvider(ENV.WORLD_BANK_API_URL);
  const fred = ENV.FRED_API_KEY ? createFredProvider(ENV.FRED_API_KEY, ENV.FRED_API_URL) : undefined;
  if (command === "validate-fred") {
    if (!fred) throw new Error("FRED_API_KEY is required");
    const results = [];
    for (const entry of US_CATALOG) {
      const metadata = await fred.fetchSeriesMetadata(entry.fredId);
      const points = await fred.fetchObservations({ providerSeriesId: entry.fredId });
      results.push({ ...entry, metadata, copyrightFlag: /copyright/i.test(metadata.notes), redistributable: false, rows: points.length, firstPeriod: points[0]?.periodDate, latestPeriod: points.at(-1)?.periodDate });
    }
    const path = args[0] ?? "fred-validation.json";
    await writeFile(path, JSON.stringify({ validatedAt: new Date(), series: results }, null, 2));
    console.info(`Validated ${results.length} FRED IDs; wrote ${path}. Redistribution remains denied pending review.`);
    return;
  }
  if (command === "validate-worldbank") {
    const results = [];
    for (const [code, id] of WORLD_BANK_CATALOG) results.push({ code, metadata: await worldbank.fetchSeriesMetadata(id) });
    await writeFile(args[0] ?? "worldbank-validation.json", JSON.stringify({ validatedAt: new Date(), indicators: results }, null, 2));
    console.info(`Validated ${results.length} World Bank IDs`);
    return;
  }
  const db = await createSupabaseConnection();
  try {
    const repository = createMacroRepository(db);
    if (command === "seed") {
      const countries = await worldbank.fetchCountries();
      await db.transaction(async (tx) => {
        for (const country of countries) await tx.insert(countriesTable).values(country).onConflictDoUpdate({ target: countriesTable.iso3, set: { ...country, updatedAt: new Date() } });
        for (const indicator of INDICATORS) await tx.insert(indicatorsTable).values(indicator).onConflictDoNothing();
      });
      console.info(`Seeded ${countries.length} countries/aggregates and ${INDICATORS.length} indicators`);
      return;
    }
    if (command === "seed-fred") {
      if (!fred) throw new Error("FRED_API_KEY is required");
      const usa = await repository.findCountry(createCountryIso3("USA"));
      if (!usa) throw new Error("Run seed first");
      const indicatorIds = new Map((await repository.indicators()).map((indicator) => [indicator.code, indicator.id]));
      const validated: { code: string; metadata: ProviderSeriesMetadataResponse }[] = [];
      for (const entry of US_CATALOG) validated.push({ code: entry.code, metadata: await fred.fetchSeriesMetadata(entry.fredId) });
      await db.transaction(async (tx) => {
        for (const { code, metadata } of validated) {
          await tx.insert(seriesTable).values({ indicatorId: requireIndicatorId(indicatorIds, code), countryId: usa.id, provider: "fred", providerSeriesId: metadata.id, frequency: metadata.frequency, unit: metadata.unit, seasonalAdjustment: metadata.seasonalAdjustment, providerLastUpdatedAt: metadata.lastUpdated, providerReleaseId: metadata.releaseId, methodology: metadata.notes, redistributable: false }).onConflictDoNothing();
        }
      });
      console.info(`Seeded ${validated.length} metadata-validated FRED series; redistribution denied`);
      return;
    }
    if (command === "seed-worldbank") {
      const countries = await repository.countries();
      if (countries.length === 0) throw new Error("Run seed first");
      const indicatorIds = new Map((await repository.indicators()).map((indicator) => [indicator.code, indicator.id]));
      const validated: { code: string; id: string; unit: string; metadata: ProviderSeriesMetadataResponse }[] = [];
      for (const [code, id, , unit] of WORLD_BANK_CATALOG) validated.push({ code, id, unit, metadata: await worldbank.fetchSeriesMetadata(id) });
      await db.transaction(async (tx) => {
        for (const country of countries) {
          for (const entry of validated) await tx.insert(seriesTable).values({ indicatorId: requireIndicatorId(indicatorIds, entry.code), countryId: country.id, provider: "worldbank", providerSeriesId: `${country.iso3}:${entry.id}`, priority: createPriority(2), frequency: "annual", unit: entry.unit, seasonalAdjustment: "nsa", methodology: entry.metadata.notes, redistributable: false }).onConflictDoNothing();
        }
      });
      console.info(`Seeded ${countries.length * validated.length} World Bank series; redistribution denied`);
      return;
    }
    if (command === "backfill") {
      const [seriesId, from, to] = args;
      if (!seriesId || !from || !to) throw new Error("Usage: macro backfill SERIES_UUID FROM TO");
      const resolve = createProviderRegistry({ worldbank, ...(fred ? { fred } : {}) });
      console.info(await createBackfillSeries(repository, createIngestSeries(repository, resolve))(seriesId, from, to));
      return;
    }
    if (command === "calendar") {
      if (!fred?.fetchReleaseEvents) throw new Error("FRED_API_KEY is required");
      const [from, to] = args;
      if (!from || !to) throw new Error("Usage: macro calendar FROM TO");
      createPeriodDate(from);
      createPeriodDate(to);
      if (from > to) throw new Error("Invalid date range");
      const events = await fred.fetchReleaseEvents(from, to);
      await repository.saveReleases(events);
      console.info(`Stored ${events.length} FRED release events`);
      return;
    }
    if (command === "coverage") {
      const rows = await repository.coverage(false);
      const countries = await repository.countries();
      console.info(JSON.stringify({ countries: countries.map((country) => ({ ...country, series: rows.filter((row) => row.countryIso3 === country.iso3).map((row) => ({ ...row, stale: isStale(row.latestPeriod, row.frequency, new Date()) })) })), repeatedFailures: await repository.providerFailures() }, null, 2));
      return;
    }
    throw new Error("Commands: seed, validate-fred, seed-fred, validate-worldbank, seed-worldbank, backfill, calendar, coverage");
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
