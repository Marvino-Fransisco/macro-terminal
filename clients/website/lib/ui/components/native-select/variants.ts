import { cva } from "class-variance-authority";

export const nativeSelectVariants = cva(
  [
    "relative",
    "w-full",
    "border",
    "rounded-lg",
    "bg-background",
    "transition-colors",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-input",
          "has-[:focus-visible]:border-ring",
          "has-[:focus-visible]:ring-1",
          "has-[:focus-visible]:ring-ring",
        ],
        error: [
          "border-destructive",
          "has-[:focus-visible]:border-destructive",
          "has-[:focus-visible]:ring-1",
          "has-[:focus-visible]:ring-destructive",
        ],
      },

      size: {
        sm: "h-7",
        md: "h-8",
        lg: "h-9",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);