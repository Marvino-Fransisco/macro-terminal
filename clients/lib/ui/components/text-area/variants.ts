import { cva } from "class-variance-authority";

export const textareaVariants = cva(
  [
    "w-full",
    "min-h-24",
    "resize-y",
    "rounded-lg",
    "border",
    "bg-background",
    "px-3",
    "py-2",
    "text-sm",
    "font-normal",
    "leading-5",
    "outline-none",
    "transition-colors",
    "placeholder:text-muted-foreground",
    "focus:ring-1",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-input",
          "focus:border-ring",
          "focus:ring-ring/20",
        ],
        error: [
          "border-destructive",
          "focus:border-destructive",
          "focus:ring-destructive/20",
        ],
      },
    },

    defaultVariants: {
      variant: "default",
    },
  }
);