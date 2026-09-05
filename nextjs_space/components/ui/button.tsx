import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/core/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-xs font-bold uppercase tracking-wider font-display transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:w-4 [&_svg]:h-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#00F0FF] to-[#0088CC] text-black shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)]",
        gold:
          "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)]",
        outline:
          "border border-[#00F0FF] bg-transparent text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]",
        ghost:
          "text-[#8892B0] hover:text-[#00F0FF] hover:bg-[#00F0FF]/10 hover:scale-[1.02]",
        secondary:
          "bg-white/5 border border-white/10 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]",
        destructive:
          "bg-[#FF6B9D] text-white shadow-[0_0_20px_rgba(255,107,157,0.3)] hover:bg-[#FF6B9D]/90 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,107,157,0.6)]",
        link:
          "text-[#00F0FF] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-7 py-3",
        sm: "h-9 px-4 text-[11px]",
        lg: "h-12 px-8 text-sm",
        icon: "h-10 w-10 p-0 rounded-full",
        "icon-sm": "h-8 w-8 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        <Slottable>{loading && asChild ? null : children}</Slottable>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }