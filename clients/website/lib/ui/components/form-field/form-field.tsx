"use client";

import { forwardRef } from "react";
import { FormFieldProps } from "./type";
import { cn } from "../../util";
import { formFieldVariants } from "./variants";
import { FormFieldContext } from "./context";

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, className, state, layout, ...props }, ref) => {
    return (
      <FormFieldContext.Provider value={{ state }}>
        <div
          ref={ref}
          className={cn(
            formFieldVariants({ layout }),
            className
          )}
          {...props}
        >
          {children}
        </div>
      </FormFieldContext.Provider>
    );
  }
);

FormField.displayName = "FormField";
