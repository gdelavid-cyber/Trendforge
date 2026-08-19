import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-[16px] border text-card-foreground shadow-glass-card transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-white/[0.03] backdrop-blur-[20px] border-white/[0.06] hover:border-[#00F0FF]/30 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_30px_rgba(0,240,255,0.15)]",
        interactive:
          "bg-white/[0.03] backdrop-blur-[20px] border-white/[0.06] hover:border-[#00F0FF]/40 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_30px_rgba(0,240,255,0.2)] cursor-pointer",
        gold:
          "bg-white/[0.03] backdrop-blur-[20px] border-[#FFD700]/30 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_30px_rgba(255,215,0,0.15)] hover:border-[#FFD700]/60 hover:-translate-y-1.5",
        cyan:
          "bg-white/[0.03] backdrop-blur-[20px] border-[#00F0FF]/30 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_30px_rgba(0,240,255,0.15)] hover:border-[#00F0FF]/60 hover:-translate-y-1.5",
        ghost:
          "border-transparent shadow-none bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-display font-bold text-lg leading-snug tracking-wider text-white",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-[#8892B0] font-sans leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 border-t border-white/[0.06] mt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, cardVariants, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }