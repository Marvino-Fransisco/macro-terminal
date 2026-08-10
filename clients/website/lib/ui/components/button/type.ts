import { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./variants";
import { ButtonHTMLAttributes } from "react";

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {};

