"use client";

import { useContext } from "react";
import { RadioGroupContext } from "./context";
import { RadioGroupContextValue } from "./type";

export const useRadioGroup = () => {
  const context: RadioGroupContextValue | null = useContext(RadioGroupContext);
  if (context === null) {
    throw new Error("useRadioGroup must be used within a RadioGroup");
  }

  return context;
};
