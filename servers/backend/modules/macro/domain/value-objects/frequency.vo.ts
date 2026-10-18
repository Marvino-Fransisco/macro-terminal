import { FREQUENCIES } from "../../constants/frequency.const";
import { InvalidFrequencyError } from "../errors/invalid-frequency.error";

export type Frequency = typeof FREQUENCIES[number];

export function createFrequency(value: string): Frequency {
  if (!FREQUENCIES.includes(value as Frequency)) {
    throw new InvalidFrequencyError(value);
  }
  return value as Frequency;
}
