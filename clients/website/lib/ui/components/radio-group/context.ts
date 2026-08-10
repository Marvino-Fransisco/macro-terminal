"use client";

import { createContext } from "react";
import { RadioGroupContextValue } from "./type";

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);
