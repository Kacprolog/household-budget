import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-slate-950 text-white shadow-sm shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md dark:bg-white dark:text-slate-950 dark:shadow-white/10 dark:hover:bg-slate-200",
        secondary: "bg-slate-100 text-slate-950 hover:-translate-y-0.5 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700",
        destructive: "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md",
        ghost: "hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
        outline: "border border-slate-200/80 bg-white/50 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950/30 dark:hover:bg-slate-900",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3",
        icon: "h-10 w-10",
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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
