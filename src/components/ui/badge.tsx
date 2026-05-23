import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-medium dark:border-slate-800",
        "bg-white/50 text-slate-700 shadow-sm backdrop-blur dark:bg-slate-950/50 dark:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}
