import { pgEnum } from "drizzle-orm/pg-core";
import { FREQUENCIES } from "@/modules/macro";

export const frequencyEnum = pgEnum("macro_frequency", FREQUENCIES);
