import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectNativeProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const SelectNative = React.forwardRef<HTMLSelectElement, SelectNativeProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&>option]:bg-background [&>option]:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
SelectNative.displayName = "SelectNative"

export { SelectNative }
