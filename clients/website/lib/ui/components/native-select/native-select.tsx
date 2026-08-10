import { forwardRef } from "react";
import { NativeSelectProps } from "./type";
import { cn } from "../../util";
import { nativeSelectVariants } from "./variants";
import { ChevronDown } from "lucide-react";

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div className={cn(
        nativeSelectVariants({ variant, size }),
        className
      )}>
        <select
          ref={ref}
          className={cn(
            "h-full w-full",
            "appearance-none",
            "bg-transparent",
            "rounded-lg",
            "font-medium text-sm",
            "outline-none",
            "disabled:cursor-not-allowed",
            "pl-2",
            "disabled:opacity-50",
          )}
          {...props}
        />

        <ChevronDown
          className={cn(
            "pointer-events-none",
            "text-muted-foreground",
            "absolute",
            "right-2",
            "top-1/2",
            "-translate-y-1/2"
          )}
          size={16}
        />
      </div>
    )
});

NativeSelect.displayName = "NativeSelect";
