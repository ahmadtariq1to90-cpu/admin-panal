import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-indigo-500",
        {
          "border-transparent bg-indigo-600 text-white hover:bg-indigo-700": variant === "default",
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80": variant === "secondary",
          "border-transparent bg-rose-500 text-white hover:bg-rose-600": variant === "destructive",
          "border-transparent bg-emerald-500 text-white hover:bg-emerald-600": variant === "success",
          "border-transparent bg-amber-500 text-white hover:bg-amber-600": variant === "warning",
          "text-slate-950 dark:text-slate-50": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
