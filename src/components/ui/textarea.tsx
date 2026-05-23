import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "min-h-20 w-full rounded-md border border-slate-200/80 bg-white/80 px-3 py-2 text-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-400/25 dark:border-slate-800 dark:bg-slate-950/60 dark:focus:border-teal-400",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
