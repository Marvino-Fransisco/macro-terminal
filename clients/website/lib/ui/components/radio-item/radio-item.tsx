"use client";

import { forwardRef } from "react";
import { RadioItemProps } from "./type";
import { cn } from "../../util";
import { radioVariants } from "./variants";
import { useRadioGroup } from "../radio-group";

export const RadioItem = forwardRef<HTMLInputElement, RadioItemProps>(
  ({ className, variant, ...props }, ref) => {
    const { name } = useRadioGroup();

    return (
      <input
        type="radio"
        name={name}
        ref={ref}
        className={cn(
          radioVariants({ variant }),
          className,
        )}
        {...props}
      />
    )
  }
);

RadioItem.displayName = "RadioItem";
