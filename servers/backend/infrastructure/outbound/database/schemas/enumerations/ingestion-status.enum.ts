import { pgEnum } from "drizzle-orm/pg-core";
import { INGESTION_STATUSES } from "@/modules/macro";

export const ingestionStatusEnum = pgEnum("ingestion_status", INGESTION_STATUSES);
