import { cva } from "class-variance-authority";

export const formFieldVariants = cva(
  ["flex"],
  {
    variants: {
      layout: {
        vertical: ["flex-col gap-2"],
        horizontal: ["flex-row gap-4 items-center"],
        noLabel: [],
      },
    },
    defaultVariants: {
      layout: "vertical",
    },
  },
)
