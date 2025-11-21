"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"

interface AmountStepProps {
  amount: number
  setAmount: (amount: number) => void
  withdriwalCode: string
  setWithdriwalCode: (code: string) => void
  selectedPlatform: Platform | null
  selectedBetId: UserAppId | null
  selectedNetwork: Network | null
  selectedPhone: UserPhone | null
  type: "deposit" | "withdrawal"
  onNext: () => void
}

export function AmountStep({
  amount,
  setAmount,
  withdriwalCode,
  setWithdriwalCode,
  selectedPlatform,
  selectedBetId,
  selectedNetwork,
  selectedPhone,
  type,
  onNext
}: AmountStepProps) {
  const [errors, setErrors] = useState<{ amount?: string; withdriwalCode?: string }>({})

  const validateAmount = (value: number) => {
    if (!selectedPlatform) return "Plateforme non sélectionnée"
    if (value <= 0) return "Le montant doit être supérieur à 0"
    
    const minAmount = type === "deposit" ? selectedPlatform.minimun_deposit : selectedPlatform.minimun_with
    const maxAmount = type === "deposit" ? selectedPlatform.max_deposit : selectedPlatform.max_win
    
    if (value < minAmount) return `Le montant minimum est ${minAmount.toLocaleString()} FCFA`
    if (value > maxAmount) return `Le montant maximum est ${maxAmount.toLocaleString()} FCFA`
    
    return null
  }

  const validateWithdriwalCode = (code: string) => {
    if (type === "withdrawal" && code.length < 4) {
      return "Le code de retrait doit contenir au moins 4 caractères"
    }
    return null
  }

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setAmount(numValue)
    
    const error = validateAmount(numValue)
    setErrors(prev => ({ ...prev, amount: error || undefined }))
  }

  const handleWithdriwalCodeChange = (value: string) => {
    setWithdriwalCode(value)
    
    const error = validateWithdriwalCode(value)
    setErrors(prev => ({ ...prev, withdriwalCode: error || undefined }))
  }

  const isFormValid = () => {
    const amountError = validateAmount(amount)
    const withdriwalCodeError = type === "withdrawal" ? validateWithdriwalCode(withdriwalCode) : null
    
    return !amountError && !withdriwalCodeError && 
           selectedPlatform && selectedBetId && selectedNetwork && selectedPhone
  }

  if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Veuillez compléter les étapes précédentes</p>
        </CardContent>
      </Card>
    )
  }

  const minAmount = type === "deposit" ? selectedPlatform.minimun_deposit : selectedPlatform.minimun_with
  const maxAmount = type === "deposit" ? selectedPlatform.max_deposit : selectedPlatform.max_win

  return (
    <div className="space-y-4">
      {/* Transaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé de la transaction</CardTitle>
          <CardDescription>
            Vérifiez les informations de votre {type === "deposit" ? "dépôt" : "retrait"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
              <span className="text-sm font-medium text-muted-foreground">Type de transaction</span>
              <Badge variant={type === "deposit" ? "default" : "secondary"} className="text-xs">
                {type === "deposit" ? "Dépôt" : "Retrait"}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2.5">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Plateforme</span>
              <span className="font-semibold text-sm">{selectedPlatform.name}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">ID de pari</span>
              <span className="font-semibold text-sm truncate max-w-[200px]">{selectedBetId.user_app_id}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Réseau</span>
              <span className="font-semibold text-sm">{selectedNetwork.public_name}</span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Numéro</span>
              <span className="font-semibold text-sm">{selectedPhone.phone}</span>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Network Message */}
        {selectedNetwork && (() => {
            const message = type === "deposit"
                ? selectedNetwork.deposit_message
                : selectedNetwork.withdrawal_message

            if (!message || message.trim() === "") return null

            return (
                <Card className="overflow-hidden border-primary/20 bg-primary/5">
                    <CardContent className="p-4 sm:p-6">
                        <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap break-words">
                            {message}
                        </p>
                    </CardContent>
                </Card>
            )
        })()}


        {/* Amount Input */}
      <Card>
        <CardHeader>
          <CardTitle>Montant de la transaction</CardTitle>
          <CardDescription>
            Entrez un montant entre {minAmount.toLocaleString()} et {maxAmount.toLocaleString()} FCFA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">Montant (FCFA)</Label>
              <Input
                id="amount"
                type="number"
                value={amount || ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className={`text-lg h-12 ${errors.amount ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.amount && (
                <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="h-4 w-4" /> {errors.amount}
                </p>
              )}
            </div>

            {amount > 0 && !errors.amount && (
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Montant à {type === "deposit" ? "déposer" : "retirer"}</p>
                    <p className="text-2xl font-bold text-primary">
                      {amount.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "XOF",
                        minimumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {type === "deposit" ? (
                      <ArrowDownToLine className="h-6 w-6 text-primary" />
                    ) : (
                      <ArrowUpFromLine className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Amount limits info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Min:</span>
                <Badge variant="outline" className="text-xs">
                  {minAmount.toLocaleString()} FCFA
                </Badge>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Max:</span>
                <Badge variant="outline" className="text-xs">
                  {maxAmount.toLocaleString()} FCFA
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Code (only for withdrawals) */}
      {type === "withdrawal" && (
        <Card>
          <CardHeader>
            <CardTitle>Code de retrait</CardTitle>
            <CardDescription>
              Entrez le code de retrait fourni par {selectedPlatform.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="withdriwalCode" className="text-sm font-medium">Code de retrait</Label>
              <Input
                id="withdriwalCode"
                type="text"
                value={withdriwalCode}
                onChange={(e) => handleWithdriwalCodeChange(e.target.value)}
                placeholder="Entrez le code"
                className={`text-base h-12 ${errors.withdriwalCode ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {errors.withdriwalCode && (
                <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
                  <AlertCircle className="h-4 w-4" /> {errors.withdriwalCode}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          size="lg"
          className="min-w-[140px]"
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}
