import { VariantProps } from "class-variance-authority";
import { nativeSelectVariants } from "./variants";
import { SelectHTMLAttributes } from "react";

export type NativeSelectVariantProps = VariantProps<typeof nativeSelectVariants>;

export interface NativeSelectProps extends 
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">, NativeSelectVariantProps {};