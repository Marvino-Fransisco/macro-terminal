"use client";

import { forwardRef } from "react";
import { FormMessageProps } from "./type";
import { cn } from "../../util";
import { formMessageVariants } from "./variant";
import { useFormField } from "../form-field";

export const FormMessage = forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, variant, ...props }, ref) => {
    const formFieldContext = useFormField();
    const state = formFieldContext?.state;
    const resolvedVariant = variant ?? (state === "error" ? "error" : undefined);

    return (
      <p
        ref={ref}
        className={cn(
          formMessageVariants({ variant: resolvedVariant }),
          className
        )}
        {...props}
      />
    )
  }
);

FormMessage.displayName = "FormMessage";
