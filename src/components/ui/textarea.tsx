import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-gray-300 placeholder:text-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 aria-invalid:ring-red-500/20 aria-invalid:border-red-500 bg-white/80 backdrop-blur-sm flex field-sizing-content min-h-20 w-full rounded-xl border-2 px-4 py-3 text-base shadow-md transition-all duration-300 outline-none focus:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-lg hover:border-gray-400 resize-y",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
