import { ReactNode } from "react";

interface ComponentCardProps {
    componentName: string;
    children: ReactNode;
}

export function ComponentCard({
    componentName,
    children
}: ComponentCardProps) {
    return (
        <div className="flex-col flex gap-1 p-4 border">
          <div>
            {componentName} 
          </div>
          <div className="flex gap-4">
            {children}
          </div>
        </div>
    )
}