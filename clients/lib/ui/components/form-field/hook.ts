"use client";

import { useContext } from "react";
import { FormFieldContext } from "./context";
import { FormFieldContextValue } from "./type";

export function useFormField(): FormFieldContextValue | null {
  return useContext(FormFieldContext);
}
