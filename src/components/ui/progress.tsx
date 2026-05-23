import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <ProgressPrimitive.Root className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-slate-800", className)}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-teal-600 transition-all duration-500 dark:bg-teal-400"
        style={{ transform: `translateX(-${100 - Math.min(Math.max(value, 0), 100)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
