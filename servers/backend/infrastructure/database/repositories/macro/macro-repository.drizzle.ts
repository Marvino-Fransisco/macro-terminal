import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { Database } from "../../connections/supabase.connection";
import { getConnection } from "../../unit-of-work/unit-of-work.drizzle";
import { countriesTable } from "../../schemas/country.schema";
import { featureJobsTable } from "../../schemas/feature-job.schema";
import { featureObservationsTable } from "../../schemas/feature-observation.schema";
import { indicatorsTable } from "../../schemas/indicator.schema";
import { ingestionRunsTable } from "../../schemas/ingestion-run.schema";
import { observationsTable } from "../../schemas/observation.schema";
import { releaseEventsTable } from "../../schemas/release-event.schema";
import { seriesTable } from "../../schemas/series.schema";
import type { MacroRepository } from "@/modules/macro/ports/macro-repository.port";
import { SameDayRevisionError } from "@/modules/macro/domain/errors/same-day-revision.error";
import { createPeriodDate } from "@/modules/macro/domain/value-objects/period-date.vo";

export function createMacroRepository(db: Database): MacroRepository {
  const connection = () => getConnection(db);

  return {
    async coverage(publicOnly) {
      return connection()
        .select({
          countryIso3: countriesTable.iso3,
          indicatorCode: indicatorsTable.code,
          provider: seriesTable.provider,
          frequency: seriesTable.frequency,
          latestPeriod: sql<
            string | null
          >`max(${observationsTable.periodDate})::text`,
          periods: sql<number>`count(distinct ${observationsTable.periodDate})::int`,
        })
        .from(seriesTable)
        .innerJoin(countriesTable, eq(countriesTable.id, seriesTable.countryId))
        .innerJoin(
          indicatorsTable,
          eq(indicatorsTable.id, seriesTable.indicatorId),
        )
        .leftJoin(
          observationsTable,
          eq(observationsTable.seriesId, seriesTable.id),
        )
        .where(
          and(
            eq(seriesTable.isActive, true),
            publicOnly ? eq(seriesTable.redistributable, true) : undefined,
          ),
        )
        .groupBy(seriesTable.id, countriesTable.id, indicatorsTable.id);
    },

    async providerFailures() {
      const result = await connection().execute(sql`with recent as (
        select r.series_id, s.provider, r.status,
          row_number() over (partition by r.series_id order by r.started_at desc) as position
        from ingestion_runs r join series s on s.id = r.series_id
      ) select provider, series_id as "seriesId", count(*)::int as "consecutiveFailures"
        from recent where position <= 3
        group by provider, series_id having count(*) = 3 and bool_and(status = 'failed')`);
      return result.map((r) => ({
        provider: String(r.provider),
        seriesId: String(r.seriesId),
        consecutiveFailures: Number(r.consecutiveFailures),
      }));
    },

    async claimDue({ now, limit }) {
      return connection().transaction(async (tx) => {
        const due = await tx
          .select()
          .from(seriesTable)
          .where(
            and(
              eq(seriesTable.isActive, true),
              lte(seriesTable.nextPollAt, now),
            ),
          )
          .orderBy(asc(seriesTable.nextPollAt))
          .limit(limit)
          .for("update", { skipLocked: true });
        if (due.length === 0) return [];
        await tx
          .update(seriesTable)
          .set({
            nextPollAt: new Date(now.getTime() + 30 * 60_000),
            updatedAt: now,
          })
          .where(
            inArray(
              seriesTable.id,
              due.map((s) => s.id),
            ),
          );
        return due;
      });
    },

    async findSeries(id) {
      const [series] = await connection()
        .select()
        .from(seriesTable)
        .where(eq(seriesTable.id, id));
      return series;
    },

    async findCountry(code) {
      const [country] = await connection()
        .select()
        .from(countriesTable)
        .where(eq(countriesTable.iso3, code));
      return country;
    },

    async findIndicator(code) {
      const [indicator] = await connection()
        .select()
        .from(indicatorsTable)
        .where(eq(indicatorsTable.code, code));
      return indicator;
    },

    async startRun(seriesId) {
      const [run] = await connection()
        .insert(ingestionRunsTable)
        .values({ seriesId })
        .returning();
      if (!run) throw new Error("Failed to create ingestion run");
      return run.id;
    },

    async completeRun({ runId, series, points, now, nextPollAt }) {
      return connection().transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${series.id}))`,
        );
        const latest = await tx
          .selectDistinctOn([observationsTable.periodDate])
          .from(observationsTable)
          .where(eq(observationsTable.seriesId, series.id))
          .orderBy(
            observationsTable.periodDate,
            desc(observationsTable.realtimeStart),
          );
        const byPeriod = new Map(latest.map((p) => [p.periodDate, p]));
        const realtimeStart = createPeriodDate(now.toISOString().slice(0, 10));
        const changed = points
          .filter((p) => {
            const previous = byPeriod.get(p.periodDate);
            if (previous?.value === p.value) return false;
            if (previous && previous.realtimeStart >= realtimeStart)
              throw new SameDayRevisionError(series.id, p.periodDate);
            return true;
          })
          .map((p) => ({ ...p, seriesId: series.id, realtimeStart }));
        for (let i = 0; i < changed.length; i += 1000) {
          await tx.insert(observationsTable).values(changed.slice(i, i + 1000));
        }
        if (series.providerReleaseId) {
          const [release] = await tx
            .select()
            .from(releaseEventsTable)
            .where(
              and(
                eq(releaseEventsTable.provider, series.provider),
                eq(releaseEventsTable.releaseId, series.providerReleaseId),
                gte(releaseEventsTable.scheduledDate, realtimeStart),
              ),
            )
            .orderBy(asc(releaseEventsTable.scheduledDate))
            .limit(1);
          if (release) {
            const releasePoll =
              release.scheduledDate === realtimeStart
                ? new Date(now.getTime() + 3600_000)
                : new Date(`${release.scheduledDate}T00:00:00Z`);
            if (releasePoll < nextPollAt) nextPollAt = releasePoll;
          }
        }
        await tx
          .update(seriesTable)
          .set({ lastPolledAt: now, nextPollAt, updatedAt: now })
          .where(eq(seriesTable.id, series.id));
        await tx
          .update(ingestionRunsTable)
          .set({
            status: "succeeded",
            finishedAt: now,
            rowsFetched: points.length,
            rowsInserted: changed.length,
          })
          .where(eq(ingestionRunsTable.id, runId));
        if (changed.length > 0) {
          await tx
            .insert(featureJobsTable)
            .values({ countryId: series.countryId, requestedAt: now })
            .onConflictDoUpdate({
              target: featureJobsTable.countryId,
              set: {
                requestedAt: sql`greatest(${featureJobsTable.requestedAt} + interval '1 millisecond', ${now.toISOString()}::timestamptz)`,
              },
            });
        }
        return changed.length;
      });
    },

    async failRun({ runId, seriesId, error, nextPollAt }) {
      await connection().transaction(async (tx) => {
        await tx
          .update(ingestionRunsTable)
          .set({ status: "failed", finishedAt: new Date(), error })
          .where(eq(ingestionRunsTable.id, runId));
        await tx
          .update(seriesTable)
          .set({ nextPollAt, updatedAt: new Date() })
          .where(eq(seriesTable.id, seriesId));
      });
    },

    async history({ publicOnly, ...query }) {
      const candidates = await connection()
        .select({ series: seriesTable, indicator: indicatorsTable })
        .from(seriesTable)
        .innerJoin(
          indicatorsTable,
          eq(indicatorsTable.id, seriesTable.indicatorId),
        )
        .where(
          and(
            eq(seriesTable.countryId, query.countryId),
            eq(seriesTable.indicatorId, query.indicatorId),
            eq(seriesTable.isActive, true),
            publicOnly ? eq(seriesTable.redistributable, true) : undefined,
          ),
        )
        .orderBy(asc(seriesTable.priority), asc(seriesTable.id));
      for (const { series, indicator } of candidates) {
        const observations = await connection()
          .selectDistinctOn([observationsTable.periodDate])
          .from(observationsTable)
          .where(
            and(
              eq(observationsTable.seriesId, series.id),
              query.from
                ? gte(observationsTable.periodDate, query.from)
                : undefined,
              query.to
                ? lte(observationsTable.periodDate, query.to)
                : undefined,
              query.asOf
                ? lte(observationsTable.realtimeStart, query.asOf)
                : undefined,
            ),
          )
          .orderBy(
            observationsTable.periodDate,
            desc(observationsTable.realtimeStart),
          );
        if (observations.length > 0) return { series, indicator, observations };
      }
      return undefined;
    },

    async vintages(seriesId) {
      return connection()
        .select()
        .from(observationsTable)
        .where(eq(observationsTable.seriesId, seriesId))
        .orderBy(
          observationsTable.periodDate,
          asc(observationsTable.realtimeStart),
        );
    },

    async countrySeries({ countryId, publicOnly }) {
      return connection()
        .select()
        .from(seriesTable)
        .where(
          and(
            eq(seriesTable.countryId, countryId),
            eq(seriesTable.isActive, true),
            publicOnly ? eq(seriesTable.redistributable, true) : undefined,
          ),
        )
        .orderBy(asc(seriesTable.priority), asc(seriesTable.id));
    },

    async countries() {
      return connection()
        .select()
        .from(countriesTable)
        .orderBy(asc(countriesTable.name));
    },

    async indicators(category) {
      const all = await connection()
        .select()
        .from(indicatorsTable)
        .orderBy(asc(indicatorsTable.code));
      return category ? all.filter((i) => i.category === category) : all;
    },

    async calendar({ from, to, countryId }) {
      return connection()
        .select()
        .from(releaseEventsTable)
        .where(
          and(
            gte(releaseEventsTable.scheduledDate, from),
            lte(releaseEventsTable.scheduledDate, to),
            countryId
              ? sql`exists (select 1 from ${seriesTable} where ${seriesTable.provider} = ${releaseEventsTable.provider} and ${seriesTable.providerReleaseId} = ${releaseEventsTable.releaseId} and ${seriesTable.countryId} = ${countryId} and ${seriesTable.isActive} and ${seriesTable.redistributable})`
              : undefined,
          ),
        )
        .orderBy(asc(releaseEventsTable.scheduledDate));
    },

    async saveReleases(events) {
      for (let i = 0; i < events.length; i += 1000) {
        await connection().transaction(async (tx) => {
          const inserted = await tx
            .insert(releaseEventsTable)
            .values(events.slice(i, i + 1000))
            .onConflictDoNothing()
            .returning();
          const today = new Date().toISOString().slice(0, 10);
          for (const release of inserted) {
            if (release.scheduledDate < today) continue;
            const scheduled = new Date(
              Math.max(Date.now(), Date.parse(release.scheduledDate)),
            );
            await tx
              .update(seriesTable)
              .set({ nextPollAt: scheduled, updatedAt: new Date() })
              .where(
                and(
                  eq(seriesTable.provider, release.provider),
                  eq(seriesTable.providerReleaseId, release.releaseId),
                  gte(seriesTable.nextPollAt, scheduled),
                ),
              );
          }
        });
      }
    },

    async pendingFeatureJobs(limit) {
      return connection()
        .select()
        .from(featureJobsTable)
        .orderBy(asc(featureJobsTable.requestedAt))
        .limit(limit);
    },

    async saveFeatures({ countryId, features, requestedAt }) {
      await connection().transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${`features:${countryId}`}))`,
        );
        const [job] = await tx
          .select()
          .from(featureJobsTable)
          .where(eq(featureJobsTable.countryId, countryId))
          .for("update");
        if (!job || job.requestedAt.getTime() !== requestedAt.getTime()) return;
        const existing = await tx
          .select({
            id: featureObservationsTable.id,
            featureCode: featureObservationsTable.featureCode,
            periodDate: featureObservationsTable.periodDate,
          })
          .from(featureObservationsTable)
          .where(eq(featureObservationsTable.countryId, countryId));
        const incoming = new Set(
          features.map(
            (feature) => `${feature.featureCode}:${feature.periodDate}`,
          ),
        );
        const obsolete = existing
          .filter(
            (feature) =>
              !incoming.has(`${feature.featureCode}:${feature.periodDate}`),
          )
          .map((feature) => feature.id);
        const updatedAt = new Date();
        for (let i = 0; i < features.length; i += 1000) {
          await tx
            .insert(featureObservationsTable)
            .values(features.slice(i, i + 1000))
            .onConflictDoUpdate({
              target: [
                featureObservationsTable.countryId,
                featureObservationsTable.featureCode,
                featureObservationsTable.periodDate,
              ],
              set: {
                value: sql`excluded.value`,
                sourceSeriesIds: sql`excluded.source_series_ids`,
                computedAt: sql`excluded.computed_at`,
                updatedAt,
              },
            });
        }
        for (let i = 0; i < obsolete.length; i += 1000) {
          await tx
            .delete(featureObservationsTable)
            .where(
              inArray(featureObservationsTable.id, obsolete.slice(i, i + 1000)),
            );
        }
        await tx
          .delete(featureJobsTable)
          .where(
            and(
              eq(featureJobsTable.countryId, countryId),
              lte(featureJobsTable.requestedAt, requestedAt),
            ),
          );
      });
    },

    async features({ countryId, code, from, to }) {
      return connection()
        .select()
        .from(featureObservationsTable)
        .where(
          and(
            eq(featureObservationsTable.countryId, countryId),
            eq(featureObservationsTable.featureCode, code),
            from ? gte(featureObservationsTable.periodDate, from) : undefined,
            to ? lte(featureObservationsTable.periodDate, to) : undefined,
          ),
        )
        .orderBy(asc(featureObservationsTable.periodDate));
    },
  };
}
