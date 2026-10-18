import { boolean, char, snakeCase, text, varchar } from "drizzle-orm/pg-core";
import { NAME_MAX_LENGTH } from "@/modules/shared/constants/name.const";
import type { CountryIso2 } from "@/modules/shared/domain/value-objects/country-iso2.vo";
import type { CountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import type { Currency } from "@/modules/shared/domain/value-objects/currency.vo";
import type { Name } from "@/modules/shared/domain/value-objects/name.vo";
import { entity } from "./entity.schema";

export const countriesTable = snakeCase.table("countries", {
  ...entity,
  iso3: char({ length: 3 }).$type<CountryIso3>().notNull().unique(),
  iso2: text().$type<CountryIso2>().notNull(),
  name: varchar({ length: NAME_MAX_LENGTH }).$type<Name>().notNull(),
  currency: char({ length: 3 }).$type<Currency>(),
  region: text().notNull(),
  isAggregate: boolean().notNull().default(false),
});

export type SelectCountriesTable = typeof countriesTable.$inferSelect;
