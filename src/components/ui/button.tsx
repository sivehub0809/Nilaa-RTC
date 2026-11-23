"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.94] active:brightness-95 select-none cursor-pointer touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "bg-surface text-foreground hover:bg-surface-hover border border-border shadow-sm",
        accent:
          "bg-accent text-accent-foreground font-semibold hover:bg-accent-hover shadow-cyan-glow",
        secondary:
          "bg-surface text-foreground hover:bg-surface-hover border border-border",
        outline:
          "border border-border bg-transparent hover:bg-surface hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        ghost:
          "hover:bg-surface hover:text-foreground text-muted-foreground",
        link:
          "text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-5 py-2.5 rounded-btn",
        sm: "h-9 px-3.5 py-1.5 rounded-btn text-xs",
        lg: "h-13 px-7 py-3 rounded-btn text-base font-medium",
        icon: "h-11 w-11 rounded-btn p-0 flex items-center justify-center",
        iconSm: "h-9 w-9 rounded-btn p-0 flex items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
