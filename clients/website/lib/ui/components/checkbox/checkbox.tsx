import { forwardRef } from "react";
import { CheckboxProps } from "./type";
import { cn } from "../../util";
import { checkboxVariants } from "./variants";

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          checkboxVariants({ variant }),
          className
        )}
        {...props}
      />
    )
  }
);

Checkbox.displayName = "Checkbox";
