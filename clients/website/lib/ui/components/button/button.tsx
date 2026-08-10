import { forwardRef } from "react";
import { cn } from "../../util";
import { ButtonProps } from "./type";
import { buttonVariants } from "./variants";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                buttonVariants({ variant, size }),
                className
            )}
            {...props}
        />
    )
});

Button.displayName = "Button";
