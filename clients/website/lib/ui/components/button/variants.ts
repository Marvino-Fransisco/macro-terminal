import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    [
        "inline-flex items-center justify-center",
        "whitespace-nowrap",
        "rounded-lg",
        "text-sm font-medium",
        "transition-colors",
        "outline-none",
        "focus-visible:ring-1",
        "focus-visible:ring-ring",
        "disabled:cursor-not-allowed",
    ],
    {
        variants:  {
            variant: {
                solid: [
                    "bg-primary",
                    "text-primary-foreground",
                    "hover:bg-primary/90"  
                ],
                outline: [
                    "border border-input",
                    "bg-background",
                    "text-foreground",
                    "hover:bg-accent",
                    "hover:text-accent-foreground",
                ],
                ghost: [
                    "bg-transparent",
                    "hover:bg-accent",
                    "hover:text-accent-foreground",
                ],
                destructive: [
                    "bg-destructive",
                    "text-destructive-foreground",
                    "hover:bg-destructive/90",
                ],
            },
            size: {
                sm: "h-5 px-3.5",
                md: "h-6 px-3.5",
                lg: "h-7 px-3.5",
                xl: "h-8 px-3.5",
            }
        },
        defaultVariants: {
            variant: "solid",
            size: "md"
        }
    }
)