import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-gray-500 selection:bg-blue-600 selection:text-white bg-white/80 backdrop-blur-sm border-gray-300 flex h-12 w-full min-w-0 rounded-xl border-2 px-4 py-3 text-base shadow-md transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:shadow-lg hover:border-gray-400",
        "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-xl",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }
