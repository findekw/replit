import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-[10px] border border-[#94A3B8] bg-transparent px-3 py-2 text-base shadow-none placeholder:text-slate-500 focus-visible:outline-none focus-visible:border-[#667EEA] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-[#0f172a]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
