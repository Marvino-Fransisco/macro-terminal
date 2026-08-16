"use client";

import { forwardRef } from "react";
import { CheckboxProps } from "./type";
import { cn } from "../../util";
import { checkboxVariants } from "./variants";
import { resolveFormFieldVariant, useFormField } from "../form-field";

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, ...props }, ref) => {
    const formFieldContext = useFormField();
    const state = formFieldContext?.state;
    const resolvedVariant = variant ?? resolveFormFieldVariant(
      state,
      {
        error: "error",
      });

    return (
      <input
        ref={ref}
        aria-invalid={state === "error"}
        type="checkbox"
        className={cn(
          checkboxVariants({ variant: resolvedVariant }),
          className
        )}
        {...props}
      />
    )
  }
);

Checkbox.displayName = "Checkbox";
