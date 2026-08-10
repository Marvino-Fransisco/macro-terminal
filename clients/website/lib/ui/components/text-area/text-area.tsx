import { forwardRef } from "react";
import { TextareaProps } from "./type";
import { textareaVariants } from "./variants";
import { cn } from "../../util";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          textareaVariants({ variant }),
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
