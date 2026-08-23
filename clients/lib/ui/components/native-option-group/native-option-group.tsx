import { forwardRef } from "react";
import { NativeOptionGroupProps } from "./type";
import { cn } from "../../util";

export const NativeOptionGroup = forwardRef<HTMLOptGroupElement, NativeOptionGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <optgroup
        ref={ref}
        className={cn(className)}
        {...props}
      />
    )
  }
);

NativeOptionGroup.displayName = "NativeOptionGroup";
