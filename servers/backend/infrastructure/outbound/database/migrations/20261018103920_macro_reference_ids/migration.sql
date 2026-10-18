ALTER TABLE "macro_feature_jobs" DROP CONSTRAINT "macro_feature_jobs_country_iso3_countries_iso3_fkey";--> statement-breakpoint
ALTER TABLE "feature_observations" DROP CONSTRAINT "feature_observations_country_iso3_countries_iso3_fkey";--> statement-breakpoint
ALTER TABLE "series" DROP CONSTRAINT "series_indicator_code_indicators_code_fkey";--> statement-breakpoint
ALTER TABLE "series" DROP CONSTRAINT "series_country_iso3_countries_iso3_fkey";--> statement-breakpoint
ALTER TABLE "series" DROP CONSTRAINT "series_indicator_code_country_iso3_provider_unique";--> statement-breakpoint
ALTER TABLE "countries" DROP CONSTRAINT "countries_id_key";--> statement-breakpoint
ALTER TABLE "indicators" DROP CONSTRAINT "indicators_id_key";--> statement-breakpoint
ALTER TABLE "macro_feature_jobs" ADD COLUMN "country_id" uuid;--> statement-breakpoint
ALTER TABLE "feature_observations" ADD COLUMN "country_id" uuid;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "indicator_id" uuid;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "country_id" uuid;--> statement-breakpoint
UPDATE "macro_feature_jobs" SET "country_id" = "countries"."id" FROM "countries" WHERE "countries"."iso3" = "macro_feature_jobs"."country_iso3";--> statement-breakpoint
UPDATE "feature_observations" SET "country_id" = "countries"."id" FROM "countries" WHERE "countries"."iso3" = "feature_observations"."country_iso3";--> statement-breakpoint
UPDATE "series" SET "country_id" = "countries"."id" FROM "countries" WHERE "countries"."iso3" = "series"."country_iso3";--> statement-breakpoint
UPDATE "series" SET "indicator_id" = "indicators"."id" FROM "indicators" WHERE "indicators"."code" = "series"."indicator_code";--> statement-breakpoint
ALTER TABLE "series" ALTER COLUMN "indicator_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "series" ALTER COLUMN "country_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "macro_feature_jobs" DROP COLUMN "country_iso3";--> statement-breakpoint
ALTER TABLE "feature_observations" DROP COLUMN "country_iso3";--> statement-breakpoint
ALTER TABLE "series" DROP COLUMN "indicator_code";--> statement-breakpoint
ALTER TABLE "series" DROP COLUMN "country_iso3";--> statement-breakpoint
ALTER TABLE "feature_observations" ADD PRIMARY KEY ("country_id","feature_code","period_date");--> statement-breakpoint
ALTER TABLE "countries" DROP CONSTRAINT "countries_pkey";--> statement-breakpoint
ALTER TABLE "countries" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "macro_feature_jobs" ADD PRIMARY KEY ("country_id");--> statement-breakpoint
ALTER TABLE "indicators" DROP CONSTRAINT "indicators_pkey";--> statement-breakpoint
ALTER TABLE "indicators" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_indicator_id_country_id_provider_unique" UNIQUE("indicator_id","country_id","provider");--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_iso3_key" UNIQUE("iso3");--> statement-breakpoint
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_code_key" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "macro_feature_jobs" ADD CONSTRAINT "macro_feature_jobs_country_id_countries_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id");--> statement-breakpoint
ALTER TABLE "feature_observations" ADD CONSTRAINT "feature_observations_country_id_countries_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id");--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_indicator_id_indicators_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "indicators"("id");--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_country_id_countries_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id");
