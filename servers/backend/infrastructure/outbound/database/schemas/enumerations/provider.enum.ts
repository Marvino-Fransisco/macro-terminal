import { pgEnum } from "drizzle-orm/pg-core";
import { PROVIDERS } from "@/modules/macro";

export const providerEnum = pgEnum("macro_provider", PROVIDERS);
