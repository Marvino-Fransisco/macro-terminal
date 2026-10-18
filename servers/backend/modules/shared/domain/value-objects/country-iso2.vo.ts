import { COUNTRY_ISO2_LENGTH } from "../../constants/country.const";
import { InvalidCountryIso2Error } from "../errors/country.error";

export type CountryIso2 = string & { readonly __brand: "CountryIso2" };

export function createCountryIso2(value: string): CountryIso2 {
  const normalized = value.trim().toUpperCase();
  if (normalized.length !== COUNTRY_ISO2_LENGTH || !/^[A-Z0-9]{2}$/.test(normalized)) {
    throw new InvalidCountryIso2Error(value);
  }
  return normalized as CountryIso2;
}
