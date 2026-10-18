import { NAME_MAX_LENGTH } from "../../constants/name.const";
import { InvalidNameError } from "../errors/name.error";

export type Name = string & { readonly __brand: "Name" };

export function createName(value: string): Name {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized.length > NAME_MAX_LENGTH) {
    throw new InvalidNameError(value);
  }
  return normalized as Name;
}
