ALTER TABLE "countries" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "countries" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "feature_observations" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "feature_observations" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "feature_observations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "feature_observations" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "indicators" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "release_events" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "release_events" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "release_events" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_id_key" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "feature_observations" ADD CONSTRAINT "feature_observations_id_key" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "indicators" ADD CONSTRAINT "indicators_id_key" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_id_key" UNIQUE("id");