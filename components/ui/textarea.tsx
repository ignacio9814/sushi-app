import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={`flex min-h-[80px] w-full rounded-xl border border-[#d9c9a3] bg-[#F9F7F2] px-3 py-2 text-sm text-[#1A1A1A] ring-offset-[#F9F7F2] placeholder:text-[#8a8174] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
