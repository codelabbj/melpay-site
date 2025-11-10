"use client"

import { cn } from "@/lib/utils"

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  type?: "deposit" | "withdrawal"
  className?: string
}

export function TransactionProgressBar({ currentStep, totalSteps, type, className }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  // Define gradient colors for each type - variations of the same color
  const getGradientStyle = () => {
    if (type === "deposit") {
      // Green gradient for deposits (variations of #059669)
      return {
        background: 'linear-gradient(to right, #059669, #047857)'
      }
    } else if (type === "withdrawal") {
      // Blue gradient (variations of the same hue)
      return {
        background: 'linear-gradient(to right, hsl(221.2 83.2% 53.3%), hsl(221.2 83.2% 43.3%))'
      }
    }
    // Default gradient
    return {
      background: 'linear-gradient(to right, #059669, #047857)'
    }
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span className="font-medium">Étape {currentStep} sur {totalSteps}</span>
        <span className="font-semibold">{Math.round(progress)}%</span>
      </div>
      <div className="relative w-full h-2 bg-secondary/60 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${progress}%`,
            ...getGradientStyle()
          }}
        />
      </div>
    </div>
  )
}
