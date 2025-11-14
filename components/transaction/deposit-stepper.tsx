"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface DepositStepperProps {
  currentStep: number
  totalSteps: number
  type?: "deposit" | "withdrawal"
  className?: string
}

const stepLabels = [
  "Plateforme",
  "ID de pari",
  "Réseau",
  "Téléphone",
  "Montant",
]

export function DepositStepper({ currentStep, totalSteps, type = "deposit", className }: DepositStepperProps) {
  const steps = stepLabels.slice(0, totalSteps)

  return (
    <div className={cn("flex items-center w-full", className)}>
      {steps.map((label, index) => {
        const step = index + 1
        const isCompleted = currentStep > step
        const isCurrent = currentStep === step

        return (
          <div key={label} className="flex items-center w-full">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-300",
                  isCompleted
                    ? type === "deposit" ? "bg-deposit text-foreground" : "bg-withdrawal text-foreground"
                    : isCurrent
                    ? type === "deposit" ? "bg-deposit/60 text-foreground-muted" : "bg-withdrawal/60 text-foreground-muted"
                    : "bg-muted text-foreground-muted"
                )}
              >
                {isCompleted ? <Check size={24} /> : step}
              </div>
              <p className={cn(
                "mt-2 text-sm text-center truncate",
                isCurrent ? "font-semibold text-primary" : "text-muted-foreground ",
              )}>
                {label}
              </p>
            </div>

            {step < totalSteps && (
              <div className={cn(
                "flex-1 h-1 mx-4 transition-colors duration-300",
                isCompleted ? (type === "deposit" ? "bg-deposit" : "bg-withdrawal") : "bg-muted"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
