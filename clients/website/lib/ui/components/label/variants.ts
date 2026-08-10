import { cva } from "class-variance-authority";

export const labelVariants = cva(
  "text-sm font-medium leading-none",
  {
    variants: {
      variant: {
        default: "text-foreground",
        error: "text-destructive",
        muted: "text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);