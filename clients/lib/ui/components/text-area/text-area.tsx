"use client";

import { forwardRef } from "react";
import { TextareaProps } from "./type";
import { textareaVariants } from "./variants";
import { cn } from "../../util";
import { resolveFormFieldVariant, useFormField } from "../form-field";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    const formFieldContext = useFormField();
    const state = formFieldContext?.state;
    const resolvedVariant = variant ?? resolveFormFieldVariant(
      state,
      {
        error: "error",
      });

    return (
      <textarea
        ref={ref}
        aria-invalid={state === "error"}
        className={cn(
          textareaVariants({ variant: resolvedVariant }),
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
