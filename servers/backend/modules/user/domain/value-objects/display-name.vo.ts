import { InvalidDisplayNameError } from "../errors/display-name.error";
import { MAX_DISPLAY_NAME_LENGTH, MIN_DISPLAY_NAME_LENGTH } from "../../constants/display-name.const";

export type DisplayName = string & {
  readonly __brand: "DisplayName";
};

export function createDisplayName(value: string): DisplayName {
  const normalized = value.trim();

  if (normalized.length < MIN_DISPLAY_NAME_LENGTH || normalized.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new InvalidDisplayNameError();
  }

  return normalized as DisplayName;
}
