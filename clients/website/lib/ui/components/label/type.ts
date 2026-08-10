import { LabelHTMLAttributes } from "react";
import { VariantProps } from "class-variance-authority";
import { labelVariants } from "./variants";

export type LabelVariantProps = VariantProps<typeof labelVariants>;

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement>, LabelVariantProps {}