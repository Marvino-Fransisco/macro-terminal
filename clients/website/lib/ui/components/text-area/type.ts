import { TextareaHTMLAttributes } from "react";
import { VariantProps } from "class-variance-authority";
import { textareaVariants } from "./variants";

export type TextareaVariantProps = VariantProps<typeof textareaVariants>;

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    TextareaVariantProps {}