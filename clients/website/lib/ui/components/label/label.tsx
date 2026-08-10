import { forwardRef } from "react";
import { LabelProps } from "./type";
import { labelVariants } from "./variants";
import { cn } from "../../util";

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(labelVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Label.displayName = "Label";
