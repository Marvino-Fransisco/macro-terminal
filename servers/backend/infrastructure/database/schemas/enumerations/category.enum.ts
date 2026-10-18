import { pgEnum } from "drizzle-orm/pg-core";
import { CATEGORIES } from "@/modules/macro";

export const categoryEnum = pgEnum("macro_category", CATEGORIES);
