import { VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";
import { formFieldVariants } from "./variants";

export type FormFieldState =
  "success" |
  "error" |
  "warning" |
  "info";

export type FormFieldVariantProps = VariantProps<typeof formFieldVariants>;

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement>, FormFieldVariantProps {
  state?: FormFieldState;
};

export interface FormFieldContextValue {
  state?: FormFieldState;
}
