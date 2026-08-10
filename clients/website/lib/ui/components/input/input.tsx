import { forwardRef } from "react";
import { InputProps } from "./type";
import { cn } from "../../util";
import { inputVariants } from "./variants";

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    inputVariants({ variant, size }),
                    className
                )}
                {...props}
            />
        )
});

Input.displayName = "Input";
