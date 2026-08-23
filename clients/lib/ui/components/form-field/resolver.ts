import { FormFieldState } from "./type";

export function resolveFormFieldVariant<T>(
  state: FormFieldState | undefined,
  mapping: Partial<Record<FormFieldState, T>>,
): T | undefined {
  return state ? mapping[state] : undefined;
}
