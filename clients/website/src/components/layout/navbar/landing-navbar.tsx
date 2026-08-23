import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { HTMLAttributes } from "react";

type LandingNavbarProps = HTMLAttributes<HTMLDivElement>;

export function LandingNavbar({
  className
}: LandingNavbarProps) {
  return (
    <div className={cn("bg-surface mx-auto p-1 max-w-7xl rounded-full", className)}>
      <div className="flex flex-1 gap-2 items-center justify-end">
        <Link
            href="/pricing"
            className={buttonVariants({
              variant: "default",
              size: "lg",
              className: "text-surface-foreground font-semibold",
            })}
        >
          Pricing
        </Link>
        <Link
            href="/login"
            className={buttonVariants({
              variant: "default",
              size: "lg",
              className: "text-surface-foreground font-semibold",
            })}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className={cn(
            buttonVariants({
              variant: "secondary",
              size: "lg",
            }),
            "rounded-full font-semibold"
          )}
        >
          Join for free
        </Link>
      </div>
    </div>
  )
}
