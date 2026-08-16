import { cva } from "class-variance-authority";

export const formMessageVariants = cva(
  "text-sm",
  {
    variants: {
      variant: {
        error: "text-destructive",
        success: "text-success",
        warning: "text-warning",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  }
);
