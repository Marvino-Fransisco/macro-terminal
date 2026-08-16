import { cva } from "class-variance-authority";

export const checkboxVariants = cva(
  [
    "size-4.5",
    "appearance-none",
    "grid",
    "place-content-center",

    "rounded-sm",
    "border",
    "border-primary",
    "bg-transparent",

    "transition-colors",

    "before:content-['']",
    "before:size-[0.65em]",
    "before:scale-0",
    "before:bg-primary-foreground",
    "before:[clip-path:polygon(14%_44%,0_65%,50%_100%,100%_16%,80%_0%,43%_62%)]",

    "checked:bg-primary",
    "checked:border-primary",
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
        ],
        error: [
          "border-destructive",
          "checked:border-destructive",
          "focus-visible:ring-destructive"
        ],
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
