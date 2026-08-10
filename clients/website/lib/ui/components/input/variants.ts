import { cva } from "class-variance-authority";

export const inputVariants = cva(
    [
        "flex w-full",
        "rounded-lg",
        "border",
        "bg-background",
        "text-sm",
        "outline-none",
        "transition-colors",
        "placeholder:text-muted-foreground",
        "focus-visible:ring-1",
        "focus-visible:ring-ring",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
    ],
    {
        variants: {
            variant: {
                default: [
                    "border-input",
                    "focus-visible:border-ring",
                ],
                error: [
                    "border-destructive",
                    "focus-visible:border-destructive",
                    "focus-visible:ring-destructive",
                ],
            },
            size: {
                sm: "h-8 px-2",
                md: "h-9 px-2",
                lg: "h-10 px-2",
            }
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        }
    }
)
