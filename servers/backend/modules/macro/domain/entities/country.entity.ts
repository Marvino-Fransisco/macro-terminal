import type { Entity } from "@/modules/shared/domain/entities/entity";
import type { Name } from "@/modules/shared/domain/value-objects/name.vo";
import type { CountryIso3 } from "@/modules/shared/domain/value-objects/country-iso3.vo";
import type { CountryIso2 } from "@/modules/shared/domain/value-objects/country-iso2.vo";
import type { Currency } from "@/modules/shared/domain/value-objects/currency.vo";

export type Country = Entity & {
  iso3: CountryIso3;
  iso2: CountryIso2;
  name: Name;
  currency: Currency | null;
  region: string;
  isAggregate: boolean;
}

export type CountryInput = Omit<Country, keyof Entity>;
