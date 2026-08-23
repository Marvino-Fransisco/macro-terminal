import { VariantProps } from "class-variance-authority";
import { radioVariants } from "./variants";
import { InputHTMLAttributes } from "react";

export type RadioItemVariantProps = VariantProps<typeof radioVariants>;

export interface RadioItemProps extends
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">, RadioItemVariantProps { };
