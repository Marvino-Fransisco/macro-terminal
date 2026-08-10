import { VariantProps } from "class-variance-authority";
import { InputHTMLAttributes } from "react";
import { inputVariants } from "./variants";

export type InputVariantProps = VariantProps<typeof inputVariants>;

export interface InputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">, InputVariantProps {};
