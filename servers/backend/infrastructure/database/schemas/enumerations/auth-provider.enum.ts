import { pgEnum } from "drizzle-orm/pg-core";

export const authProviderEnum = pgEnum("auth_provider", ["google"]);
