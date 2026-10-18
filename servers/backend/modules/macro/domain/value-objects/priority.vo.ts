import { InvalidPriorityError } from "../errors/invalid-priority.error";

export type Priority = number & { readonly __brand: "Priority" };

export function createPriority(value: number): Priority {
  if (!Number.isInteger(value) || value < 1) {
    throw new InvalidPriorityError(value);
  }
  return value as Priority;
}
