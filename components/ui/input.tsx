import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-none border border-[#d9c9a3] bg-[#F9F7F2] px-3 py-2 text-sm text-[#1A1A1A] ring-offset-[#F9F7F2] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#8a8174] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
