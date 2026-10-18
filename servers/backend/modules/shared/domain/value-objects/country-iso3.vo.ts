import { COUNTRY_ISO3_LENGTH } from "../../constants/country.const";
import { InvalidCountryIso3Error } from "../errors/country.error";

export type CountryIso3 = string & { readonly __brand: "CountryIso3" };

export function createCountryIso3(value: string): CountryIso3 {
  const normalized = value.trim().toUpperCase();
  if (normalized.length !== COUNTRY_ISO3_LENGTH || !/^[A-Z]{3}$/.test(normalized)) {
    throw new InvalidCountryIso3Error(value);
  }
  return normalized as CountryIso3;
}
