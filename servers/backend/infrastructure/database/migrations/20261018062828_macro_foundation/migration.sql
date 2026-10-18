CREATE TYPE "ingestion_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "macro_adjustment" AS ENUM('sa', 'nsa', 'saar', 'unknown');--> statement-breakpoint
CREATE TYPE "macro_category" AS ENUM('growth', 'labor', 'inflation', 'rates', 'credit', 'housing', 'external', 'fiscal', 'energy', 'cycle', 'population');--> statement-breakpoint
CREATE TYPE "macro_frequency" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'irregular');--> statement-breakpoint
CREATE TYPE "macro_provider" AS ENUM('fred', 'worldbank', 'bls', 'bea', 'treasury', 'census', 'eia', 'imf', 'oecd', 'bis', 'ecb', 'eurostat');--> statement-breakpoint
CREATE TABLE "countries" (
	"iso3" char(3) PRIMARY KEY,
	"iso2" text NOT NULL,
	"name" text NOT NULL,
	"currency" char(3),
	"region" text NOT NULL,
	"is_aggregate" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "macro_feature_jobs" (
	"country_iso3" char(3) PRIMARY KEY,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_observations" (
	"country_iso3" char(3),
	"feature_code" text,
	"period_date" date,
	"value" double precision NOT NULL,
	"source_series_ids" jsonb NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_observations_pkey" PRIMARY KEY("country_iso3","feature_code","period_date")
);
--> statement-breakpoint
CREATE TABLE "indicators" (
	"code" text PRIMARY KEY,
	"name" text NOT NULL,
	"category" "macro_category" NOT NULL,
	"unit" text NOT NULL,
	"frequency" "macro_frequency" NOT NULL,
	"seasonal_adjustment" "macro_adjustment" NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"series_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "ingestion_status" DEFAULT 'running'::"ingestion_status" NOT NULL,
	"rows_fetched" integer DEFAULT 0 NOT NULL,
	"rows_inserted" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"series_id" uuid,
	"period_date" date,
	"value" double precision NOT NULL,
	"realtime_start" date,
	CONSTRAINT "observations_pkey" PRIMARY KEY("series_id","period_date","realtime_start"),
	CONSTRAINT "observations_finite_value" CHECK ("value" > '-Infinity'::float8 AND "value" < 'Infinity'::float8)
);
--> statement-breakpoint
CREATE TABLE "release_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"provider" "macro_provider" NOT NULL,
	"release_id" text NOT NULL,
	"release_name" text NOT NULL,
	"scheduled_date" date NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "release_events_provider_release_id_scheduled_date_unique" UNIQUE("provider","release_id","scheduled_date")
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"indicator_code" text NOT NULL,
	"country_iso3" char(3) NOT NULL,
	"provider" "macro_provider" NOT NULL,
	"provider_series_id" text NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"frequency" "macro_frequency" NOT NULL,
	"unit" text NOT NULL,
	"seasonal_adjustment" "macro_adjustment" NOT NULL,
	"redistributable" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_polled_at" timestamp with time zone,
	"next_poll_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider_last_updated_at" timestamp with time zone,
	"methodology" text DEFAULT '' NOT NULL,
	CONSTRAINT "series_provider_provider_series_id_unique" UNIQUE("provider","provider_series_id"),
	CONSTRAINT "series_indicator_code_country_iso3_provider_unique" UNIQUE("indicator_code","country_iso3","provider"),
	CONSTRAINT "series_positive_priority" CHECK ("priority" > 0)
);
--> statement-breakpoint
CREATE INDEX "ingestion_runs_series_started_idx" ON "ingestion_runs" ("series_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "observations_latest_idx" ON "observations" ("series_id","period_date" DESC NULLS LAST,"realtime_start" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "series_due_idx" ON "series" ("is_active","next_poll_at");--> statement-breakpoint
ALTER TABLE "macro_feature_jobs" ADD CONSTRAINT "macro_feature_jobs_country_iso3_countries_iso3_fkey" FOREIGN KEY ("country_iso3") REFERENCES "countries"("iso3");--> statement-breakpoint
ALTER TABLE "feature_observations" ADD CONSTRAINT "feature_observations_country_iso3_countries_iso3_fkey" FOREIGN KEY ("country_iso3") REFERENCES "countries"("iso3");--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_series_id_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id");--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_series_id_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id");--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_indicator_code_indicators_code_fkey" FOREIGN KEY ("indicator_code") REFERENCES "indicators"("code");--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_country_iso3_countries_iso3_fkey" FOREIGN KEY ("country_iso3") REFERENCES "countries"("iso3");