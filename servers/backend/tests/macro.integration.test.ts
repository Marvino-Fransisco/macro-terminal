import { afterAll, beforeAll, expect, test } from "bun:test";
import postgres from "postgres";
import z from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { createMacroRepository } from "@/infrastructure/database/repositories/macro/macro-repository.drizzle";
import { createDrizzleUnitOfWork, getConnection } from "@/infrastructure/database/unit-of-work/unit-of-work.drizzle";
import { countriesTable } from "@/infrastructure/database/schemas/country.schema";
import { featureJobsTable } from "@/infrastructure/database/schemas/feature-job.schema";
import { featureObservationsTable } from "@/infrastructure/database/schemas/feature-observation.schema";
import { indicatorsTable } from "@/infrastructure/database/schemas/indicator.schema";
import { ingestionRunsTable } from "@/infrastructure/database/schemas/ingestion-run.schema";
import { seriesTable } from "@/infrastructure/database/schemas/series.schema";
import type { Database } from "@/infrastructure/database/connections/supabase.connection";
import type { Series } from "@/modules/macro/domain/entities/series.entity";
import type { Entity } from "@/modules/shared/domain/entities/entity";
import { createCountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import { createCountryIso2 } from "@/modules/shared/domain/value-objects/country-iso2.vo";
import { createName } from "@/modules/shared/domain/value-objects/name.vo";
import { createFeatureCode, createIndicatorCode, createPeriodDate, createPoint, createPriority } from "@/modules/macro";
import type { MacroRepository } from "@/modules/macro/application/ports/macro-repository.port";
import { createIngestSeries } from "@/modules/macro/application/use-cases/ingest-series";
import { createGetMacro } from "@/modules/macro/application/use-cases/get-macro";
import { createMacroRoutes } from "@/api/http/macro.routes";
import { createComputeFeatures } from "@/modules/macro/application/use-cases/compute-features";

const url = process.env.TEST_DATABASE_URL;
let client: ReturnType<typeof postgres>;
let db: Database;
const integration = test.skipIf(!url);

beforeAll(() => {
  if (!url) return;
  client = postgres(url, { prepare: false });
  db = drizzle({ client });
});
afterAll(async () => { if (client) await client.end(); });

async function scenario(run: (repository: MacroRepository, series: Series) => Promise<void>) {
  const rollback = new Error("test rollback");
  try {
    await createDrizzleUnitOfWork(db).run(async () => {
      const tx = getConnection(db);
      const [country] = await tx.insert(countriesTable).values({ iso3: createCountryIso3("TST"), iso2: createCountryIso2("TS"), name: createName("Test"), region: "Test", isAggregate: false }).returning();
      const [indicator] = await tx.insert(indicatorsTable).values({ code: createIndicatorCode("TEST_INDEX"), name: createName("Test Index"), category: "growth", unit: "Index", frequency: "monthly", seasonalAdjustment: "sa", description: "Test" }).returning();
      if (!country || !indicator) throw new Error("Missing fixture");
      const [series] = await tx.insert(seriesTable).values({ countryId: country.id, indicatorId: indicator.id, provider: "fred", providerSeriesId: "TEST", frequency: "monthly", unit: "Index", seasonalAdjustment: "sa", nextPollAt: new Date("2020-01-01") }).returning();
      if (!series) throw new Error("Missing fixture");
      await run(createMacroRepository(db), series);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

integration("append-only revisions, idempotency, point-in-time reads and same-day conflict rollback", async () => {
  await scenario(async (repository, series) => {
    let value = 100;
    let now = new Date("2024-02-01T12:00:00Z");
    const ingest = createIngestSeries(repository, () => ({ async fetchObservations() { return [{ periodDate: createPeriodDate("2024-01-01"), value }]; }, async fetchSeriesMetadata() { throw new Error("unused"); } }), () => now);
    expect((await ingest(series)).rowsInserted).toBe(1);
    expect((await ingest(series)).rowsInserted).toBe(0);
    now = new Date("2024-02-02T12:00:00Z");
    value = 102;
    expect((await ingest(series)).rowsInserted).toBe(1);
    expect((await repository.vintages(series.id)).length).toBe(2);
    expect((await repository.history({ countryId: series.countryId, indicatorId: series.indicatorId, asOf: createPeriodDate("2024-02-01") }, false))!.observations[0]!.value).toBe(100);
    expect((await repository.history({ countryId: series.countryId, indicatorId: series.indicatorId }, false))!.observations[0]!.value).toBe(102);
    value = 103;
    await expect(ingest(series)).rejects.toThrow("Conflicting same-day revision");
    expect((await repository.vintages(series.id)).length).toBe(2);
    const failures = await getConnection(db).select().from(ingestionRunsTable).where(eq(ingestionRunsTable.seriesId, series.id));
    expect(failures.filter((r) => r.status === "failed").length).toBe(1);
  });
});

integration("routes fail closed, validate input and preserve transform warmup outside requested range", async () => {
  await scenario(async (repository, series) => {
    const points = Array.from({ length: 13 }, (_, i) => createPoint(new Date(Date.UTC(2020, i, 1)).toISOString().slice(0, 10), i === 12 ? 110 : 100));
    const run = await repository.startRun(series.id);
    await repository.completeRun(run, series, points, new Date("2022-01-01"), new Date("2022-02-01"));
    const app = createMacroRoutes(createGetMacro(repository));
    const request = (path: string) => app.handle(new Request(`http://localhost/macro${path}`));
    expect((await request("/series/TST/TEST_INDEX")).status).toBe(404);
    await getConnection(db).update(seriesTable).set({ redistributable: true }).where(eq(seriesTable.id, series.id));
    const response = await request("/series/TST/TEST_INDEX?from=2021-01-01&feature=yoy");
    expect(response.status).toBe(200);
    const result = z.object({ observations: z.array(z.object({ value: z.number() })) }).parse(await response.json());
    expect(result.observations.length).toBe(1);
    expect(result.observations[0]!.value).toBeCloseTo(10);
    expect((await request("/series/TST/TEST_INDEX?from=bad")).status).toBe(400);
    expect((await request("/series/TST/TEST_INDEX?from=2022-01-01&to=2020-01-01")).status).toBe(400);
    expect((await request("/series/TST/TEST_INDEX?feature=bad")).status).toBe(400);
    expect((await request("/compare?indicator=TEST_INDEX&countries=TST")).status).toBe(400);
    expect((await request("/calendar?from=2024-01-01&to=2024-02-01&country=TST")).status).toBe(200);
    const overview = z.object({ indicators: z.array(z.object({ change: z.number() })) }).parse(await (await request("/overview/TST")).json());
    expect(overview.indicators[0]!.change).toBe(10);
    const countries = z.array(z.object({ iso3: z.string(), coverageTier: z.number() })).parse(await (await request("/countries")).json());
    expect(countries.find((c) => c.iso3 === "TST")!.coverageTier).toBe(1);
  });
});

integration("provider priority falls back only when preferred series has no data", async () => {
  await scenario(async (repository, preferred) => {
    const series = preferred;
    const [fallback] = await getConnection(db).insert(seriesTable).values({ countryId: series.countryId, indicatorId: series.indicatorId, provider: "worldbank", providerSeriesId: "TST:TEST", priority: createPriority(2), frequency: "monthly", unit: "Index", seasonalAdjustment: "sa", redistributable: true }).returning();
    if (!fallback) throw new Error("Missing fallback");
    const run = await repository.startRun(fallback.id);
    await repository.completeRun(run, fallback, [createPoint("2024-01-01", 2)], new Date("2024-02-01"), new Date("2024-03-01"));
    expect((await repository.history({ countryId: series.countryId, indicatorId: series.indicatorId }, false))!.series.id).toBe(fallback.id);
    const preferredRun = await repository.startRun(preferred.id);
    await repository.completeRun(preferredRun, preferred, [createPoint("2024-01-01", 1)], new Date("2024-02-01"), new Date("2024-03-01"));
    expect((await repository.history({ countryId: series.countryId, indicatorId: series.indicatorId }, false))!.series.id).toBe(preferred.id);
    expect((await repository.history({ countryId: series.countryId, indicatorId: series.indicatorId }, true))!.series.id).toBe(fallback.id);
  });
});

integration("feature jobs persist recomputation, reject stale job results and enforce source permissions", async () => {
  await scenario(async (repository, series) => {
    const run = await repository.startRun(series.id);
    await repository.completeRun(run, series, [createPoint("2024-01-01", 1), createPoint("2024-02-01", 2)], new Date("2024-03-01"), new Date("2024-04-01"));
    const job = (await repository.pendingFeatureJobs(1000)).find((pending) => pending.countryId === series.countryId);
    if (!job) throw new Error("Missing job");
    expect(await createComputeFeatures(repository)(series.countryId, job.requestedAt)).toBeGreaterThan(0);
    expect((await repository.pendingFeatureJobs(1000)).filter((pending) => pending.countryId === series.countryId).length).toBe(0);
    const saved = await repository.features(series.countryId, createFeatureCode("TEST_INDEX:yoy"));
    expect(saved.length).toBe(0);
    const nextToken = new Date("2024-03-02");
    await getConnection(db).insert(featureJobsTable).values({ countryId: series.countryId, requestedAt: nextToken });
    await repository.saveFeatures(series.countryId, [], job.requestedAt);
    expect((await repository.pendingFeatureJobs(1000)).filter((pending) => pending.countryId === series.countryId).length).toBe(1);
    const feature = { countryId: series.countryId, featureCode: createFeatureCode("SPREAD_10Y_2Y"), periodDate: createPeriodDate("2024-01-01"), value: 1, sourceSeriesIds: [series.id], computedAt: new Date() };
    await repository.saveFeatures(series.countryId, [feature], nextToken);
    const useCases = createGetMacro(repository);
    expect(await useCases.getSeries({ country: "TST", indicator: "SPREAD_10Y_2Y" })).toBeUndefined();
    await getConnection(db).update(seriesTable).set({ redistributable: true }).where(eq(seriesTable.id, series.id));
    expect((await useCases.getSeries({ country: "TST", indicator: "SPREAD_10Y_2Y" }))!.observations.length).toBe(1);
    await repository.saveFeatures(series.countryId, [], nextToken);
    expect((await repository.features(series.countryId, createFeatureCode("SPREAD_10Y_2Y"))).length).toBe(1);
  });
});

integration("due-series leasing and repeated failure reporting", async () => {
  await scenario(async (repository, series) => {
    expect((await repository.claimDue(new Date("2024-01-01"), 10)).some((s) => s.id === series.id)).toBe(true);
    expect((await repository.claimDue(new Date("2024-01-01"), 10)).length).toBe(0);
    for (let i = 0; i < 3; i++) {
      const run = await repository.startRun(series.id);
      await repository.failRun(run, series.id, "Provider unavailable", new Date("2024-02-01"));
    }
    expect((await repository.providerFailures())[0]!.consecutiveFailures).toBe(3);
    expect((await repository.coverage(false)).find((row) => row.countryIso3 === "TST" && row.indicatorCode === "TEST_INDEX")!.periods).toBe(0);
  });
});

integration("release mapping filters calendars, updates overview and accelerates polling", async () => {
  await scenario(async (repository, series) => {
    const releaseId = "test-release";
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
    const [mapped] = await getConnection(db).update(seriesTable).set({ providerReleaseId: releaseId, nextPollAt: new Date(Date.now() + 30 * 86400_000) }).where(eq(seriesTable.id, series.id)).returning();
    if (!mapped) throw new Error("Missing mapped series");
    const event = { provider: "fred" as const, releaseId, releaseName: "Test release", scheduledDate: createPeriodDate(tomorrow), publishedAt: null };
    await repository.saveReleases([event]);
    await repository.saveReleases([event]);
    expect((await repository.findSeries(series.id))!.nextPollAt.toISOString().slice(0, 10)).toBe(tomorrow);
    expect((await repository.calendar(createPeriodDate(today), createPeriodDate(tomorrow))).filter((r) => r.releaseId === releaseId).length).toBe(1);
    expect((await repository.calendar(createPeriodDate(today), createPeriodDate(tomorrow), series.countryId)).length).toBe(0);
    await getConnection(db).update(seriesTable).set({ redistributable: true }).where(eq(seriesTable.id, series.id));
    expect((await repository.calendar(createPeriodDate(today), createPeriodDate(tomorrow), series.countryId)).length).toBe(1);
    expect((await repository.calendar(createPeriodDate(today), createPeriodDate(tomorrow), crypto.randomUUID())).length).toBe(0);
    const run = await repository.startRun(series.id);
    const now = new Date(`${tomorrow}T12:00:00Z`);
    await repository.completeRun(run, mapped, [createPoint(today, 1)], now, new Date(now.getTime() + 24 * 3600_000));
    expect((await repository.findSeries(series.id))!.nextPollAt.getTime()).toBe(now.getTime() + 3600_000);
    const overview = await createGetMacro(repository).overview("TST");
    expect(overview.indicators[0]!.nextRelease?.releaseId).toBe(releaseId);
  });
});

integration("comparison aligns common periods, flags mixed providers and rejects incompatible units", async () => {
  await scenario(async (repository, series) => {
    const [otherCountry] = await getConnection(db).insert(countriesTable).values({ iso3: createCountryIso3("TSU"), iso2: createCountryIso2("TU"), name: createName("Other test"), region: "Test", isAggregate: false }).returning();
    const [other] = await getConnection(db).insert(seriesTable).values({ countryId: otherCountry!.id, indicatorId: series.indicatorId, provider: "worldbank", providerSeriesId: "TSU:TEST", frequency: "monthly", unit: "Index", seasonalAdjustment: "sa", redistributable: true }).returning();
    if (!other) throw new Error("Missing comparison series");
    await getConnection(db).update(seriesTable).set({ redistributable: true }).where(eq(seriesTable.id, series.id));
    for (const input of [series, other]) {
      const run = await repository.startRun(input.id);
      await repository.completeRun(run, input, [createPoint("2024-01-01", input.id === series.id ? 1 : 2)], new Date("2024-02-01"), new Date("2024-03-01"));
    }
    const macro = createGetMacro(repository);
    const result = await macro.compare("TEST_INDEX", ["TST", "TSU"]);
    expect(result!.mixedProviders).toBe(true);
    expect(result!.observations[0]!.values).toEqual({ TST: 1, TSU: 2 });
    expect(result!.crossSection!.countries.map((c) => c.rank)).toEqual([2, 1]);
    expect(result!.attributions.map((a) => a.provider)).toEqual(["fred", "worldbank"]);
    await getConnection(db).update(seriesTable).set({ unit: "USD" }).where(eq(seriesTable.id, other.id));
    await expect(macro.compare("TEST_INDEX", ["TST", "TSU"])).rejects.toThrow("matching frequency, unit");
  });
});

function assertEntityMetadata(entity: Entity) {
  expect(entity.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(entity.createdAt).toBeInstanceOf(Date);
  expect(entity.updatedAt).toBeInstanceOf(Date);
  expect(Number.isFinite(entity.createdAt.getTime())).toBe(true);
  expect(Number.isFinite(entity.updatedAt.getTime())).toBe(true);
  expect(entity.deletedAt).toBeNull();
}

integration("all macro entities persist shared metadata without changing revision identity", async () => {
  await scenario(async (repository, series) => {
    const now = new Date("2024-03-01");
    const points = [createPoint("2024-01-01", 1)];
    const run = await repository.startRun(series.id);
    await repository.completeRun(run, series, points, now, now);
    const country = (await repository.countries()).find((row) => row.iso3 === "TST")!;
    const indicator = (await repository.indicators()).find((row) => row.code === "TEST_INDEX")!;
    const storedSeries = (await repository.findSeries(series.id))!;
    const observation = (await repository.vintages(series.id))[0]!;
    await repository.saveReleases([{ provider: "fred", releaseId: "metadata-test", releaseName: "Metadata", scheduledDate: createPeriodDate("2024-04-01"), publishedAt: null }]);
    const release = (await repository.calendar(createPeriodDate("2024-04-01"), createPeriodDate("2024-04-01"))).find((row) => row.releaseId === "metadata-test")!;
    const job = (await repository.pendingFeatureJobs(1000)).find((row) => row.countryId === series.countryId)!;
    await repository.saveFeatures(series.countryId, [{ countryId: series.countryId, featureCode: createFeatureCode("TEST_FEATURE"), periodDate: createPeriodDate("2024-01-01"), value: 1, sourceSeriesIds: [series.id], computedAt: now }], job.requestedAt);
    const feature = (await repository.features(series.countryId, createFeatureCode("TEST_FEATURE")))[0]!;
    for (const entity of [country, indicator, storedSeries, observation, release, feature]) assertEntityMetadata(entity);
    expect(storedSeries.updatedAt.getTime()).toBe(now.getTime());
    const repeatRun = await repository.startRun(series.id);
    expect(await repository.completeRun(repeatRun, series, points, now, now)).toBe(0);
    expect((await repository.vintages(series.id))[0]!.id).toBe(observation.id);
  });
});

integration("feature recomputation preserves entity identity and creation time while removing obsolete rows", async () => {
  await scenario(async (repository, series) => {
    const firstToken = new Date("2024-03-01");
    await getConnection(db).insert(featureJobsTable).values({ countryId: series.countryId, requestedAt: firstToken });
    const feature = { countryId: series.countryId, featureCode: createFeatureCode("RETAINED"), periodDate: createPeriodDate("2024-01-01"), value: 1, sourceSeriesIds: [series.id], computedAt: firstToken };
    await repository.saveFeatures(series.countryId, [feature, { ...feature, featureCode: createFeatureCode("OBSOLETE") }], firstToken);
    const original = (await repository.features(series.countryId, createFeatureCode("RETAINED")))[0]!;
    await getConnection(db).update(featureObservationsTable).set({ updatedAt: new Date("2000-01-01") }).where(eq(featureObservationsTable.id, original.id));
    const nextToken = new Date("2024-03-02");
    await getConnection(db).insert(featureJobsTable).values({ countryId: series.countryId, requestedAt: nextToken });
    await repository.saveFeatures(series.countryId, [{ ...feature, value: 2, computedAt: nextToken }], nextToken);
    const updated = (await repository.features(series.countryId, createFeatureCode("RETAINED")))[0]!;
    expect(updated.id).toBe(original.id);
    expect(updated.createdAt.getTime()).toBe(original.createdAt.getTime());
    expect(updated.updatedAt.getTime()).toBeGreaterThan(new Date("2000-01-01").getTime());
    expect(updated.value).toBe(2);
    expect((await repository.features(series.countryId, createFeatureCode("OBSOLETE"))).length).toBe(0);
  });
});

integration("same-millisecond ingestions advance feature job tokens monotonically", async () => {
  await scenario(async (repository, series) => {
    const now = new Date("2024-03-01");
    const firstRun = await repository.startRun(series.id);
    await repository.completeRun(firstRun, series, [createPoint("2024-01-01", 1)], now, now);
    const firstJob = (await repository.pendingFeatureJobs(1000)).find((job) => job.countryId === series.countryId)!;
    const secondRun = await repository.startRun(series.id);
    await repository.completeRun(secondRun, series, [createPoint("2024-02-01", 2)], now, now);
    const secondJob = (await repository.pendingFeatureJobs(1000)).find((job) => job.countryId === series.countryId)!;
    expect(secondJob.requestedAt.getTime()).toBeGreaterThan(firstJob.requestedAt.getTime());
    await repository.saveFeatures(series.countryId, [], firstJob.requestedAt);
    expect((await repository.pendingFeatureJobs(1000)).some((job) => job.countryId === series.countryId)).toBe(true);
  });
});
