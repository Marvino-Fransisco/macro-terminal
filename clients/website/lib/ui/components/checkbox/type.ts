import { VariantProps } from "class-variance-authority";
import { checkboxVariants } from "./variants";
import { InputHTMLAttributes } from "react";

export type CheckboxVariantProps = VariantProps<typeof checkboxVariants>;

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type">, CheckboxVariantProps { };
