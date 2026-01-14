import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-gentle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-soft hover:shadow-elevated",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl",
        outline: "border-2 border-primary/20 bg-background hover:bg-primary-soft hover:border-primary/40 rounded-2xl",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted rounded-2xl",
        ghost: "hover:bg-primary-soft hover:text-primary rounded-2xl",
        link: "text-primary underline-offset-4 hover:underline",
        // Ampara-specific variants
        serenity: "bg-serenity-100 text-serenity-600 hover:bg-serenity-200 rounded-3xl shadow-soft",
        warmth: "bg-warmth-100 text-foreground hover:bg-warmth-200 rounded-3xl border border-border",
        sos: "bg-coral text-white hover:bg-coral/90 rounded-3xl shadow-elevated font-semibold",
        cta: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-3xl shadow-elevated font-semibold text-base",
        chip: "bg-primary-soft text-primary hover:bg-serenity-200 rounded-full text-sm font-normal px-4",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 py-2",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-5 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9",
        "icon-lg": "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
