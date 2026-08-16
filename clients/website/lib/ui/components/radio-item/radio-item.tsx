"use client";

import { forwardRef } from "react";
import { RadioItemProps } from "./type";
import { cn } from "../../util";
import { radioVariants } from "./variants";
import { useRadioGroup } from "../radio-group";
import { resolveFormFieldVariant, useFormField } from "../form-field";

export const RadioItem = forwardRef<HTMLInputElement, RadioItemProps>(
  ({ className, variant, ...props }, ref) => {
    const { name } = useRadioGroup();
    const formFieldContext = useFormField();
    const state = formFieldContext?.state;
    const resolvedVariant = variant ?? resolveFormFieldVariant(
      state,
      {
        error: "error",
      });

    return (
      <input
        type="radio"
        name={name}
        ref={ref}
        className={cn(
          radioVariants({ variant: resolvedVariant }),
          className,
        )}
        {...props}
      />
    )
  }
);

RadioItem.displayName = "RadioItem";
