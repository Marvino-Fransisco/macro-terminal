"use client";

import { forwardRef } from "react";
import { InputProps } from "./type";
import { cn } from "../../util";
import { inputVariants } from "./variants";
import { resolveFormFieldVariant, useFormField } from "../form-field";

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, variant, size, ...props }, ref) => {
        const formFieldContext = useFormField();
        const state = formFieldContext?.state;
        const resolvedVariant = variant ?? resolveFormFieldVariant(
        state,
        {
            error: "error",
            success: "success",
        });

        return (
            <input
                ref={ref}
                aria-invalid={state === "error"}
                className={cn(
                    inputVariants({ variant: resolvedVariant, size }),
                    className
                )}
                {...props}
            />
        )
});

Input.displayName = "Input";
