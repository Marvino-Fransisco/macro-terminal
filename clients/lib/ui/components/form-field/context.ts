"use client";

import { createContext } from "react";
import { FormFieldContextValue } from "./type";

export const FormFieldContext = createContext<FormFieldContextValue | null>(null);
