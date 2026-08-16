import { cva } from "class-variance-authority";

export const radioVariants = cva(
  [
    "size-4.5",
    "appearance-none",
    "grid",
    "place-content-center",

    "border",
    "rounded-full",
    "bg-transparent",

    "transition-colors",

    "before:content-['']",
    "before:bg-primary",
    "before:rounded-full",
    "before:size-2.5",
    "before:scale-0",
    "before:transition-transform",

    "checked:before:scale-100",

    "focus-visible:outline-none",
    "focus-visible:ring-1",

    "disabled:cursor-not-allowed",
    "disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        default: [
          "focus-visible:ring-ring",
          "border-primary"
        ],
        error: [
          "focus-visible:ring-destructive",
          "border-destructive"
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    }
  }
);
