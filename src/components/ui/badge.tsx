import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: 
          "text-foreground border-border",
        success:
          "border-transparent bg-success/15 text-success border border-success/30",
        warning:
          "border-transparent bg-warning/15 text-warning-foreground border border-warning/30",
        muted:
          "border-transparent bg-muted text-muted-foreground",
        gold:
          "border-transparent gradient-gold text-secondary-foreground shadow-sm",
        active:
          "border-transparent bg-primary/15 text-primary border border-primary/30",
        overdue:
          "border-transparent bg-destructive/15 text-destructive border border-destructive/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
