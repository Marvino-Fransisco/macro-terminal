import { VariantProps } from "class-variance-authority";
import { formMessageVariants } from "./variant";
import { HTMLAttributes } from "react";

export type FormMessageVariantProps = VariantProps<typeof formMessageVariants>;

export interface FormMessageProps extends HTMLAttributes<HTMLParagraphElement>, FormMessageVariantProps { };
