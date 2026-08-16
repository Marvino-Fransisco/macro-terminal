import { HTMLAttributes } from "react";
import { cn } from "../../../lib/ui/util";

interface ComponentCardProps extends HTMLAttributes<HTMLDivElement> {
    componentName: string;
}

export function ComponentCard({
  componentName,
  children,
  className,
  ...props
}: ComponentCardProps) {
    return (
        <div className="flex-col flex gap-1 p-4 border">
          <div>
            {componentName}
          </div>
          <div className={cn("flex gap-4", className)} {...props}>
            {children}
          </div>
        </div>
    )
}
