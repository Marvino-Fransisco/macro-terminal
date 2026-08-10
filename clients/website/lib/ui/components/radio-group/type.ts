import { HTMLAttributes } from "react";

export interface RadioGroupContextValue {
  name: string;
}

export interface RadioGroupProps
  extends HTMLAttributes<HTMLDivElement> {
  name: string;
}
