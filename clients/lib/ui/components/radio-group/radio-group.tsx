"use client";

import { forwardRef } from "react";
import { RadioGroupProps } from "./type";
import { RadioGroupContext } from "./context";

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ name, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ name }}>
        <div ref={ref} role="radiogroup" {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = "RadioGroup";
