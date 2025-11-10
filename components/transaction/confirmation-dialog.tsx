"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle } from "lucide-react"
import { toast } from "react-hot-toast"

interface TransactionData {
  amount: number
  phone_number: string
  app: string
  user_app_id: string
  network: number
  withdriwal_code?: string
}

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  transactionData: TransactionData
  type: "deposit" | "withdrawal"
  platformName: string
  networkName: string
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  transactionData,
  type,
  platformName,
  networkName,
  isLoading = false
}: ConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      toast.success(
        type === "deposit" 
          ? "Dépôt initié avec succès!" 
          : "Retrait initié avec succès!"
      )
      onClose()
    } catch (error) {
      toast.error("Une erreur est survenue lors de la transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-2">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Confirmer {type === "deposit" ? "le dépôt" : "le retrait"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Vérifiez attentivement les détails de votre transaction avant de confirmer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Highlight */}
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Montant de la transaction</p>
              <p className="text-3xl font-bold text-primary">
                {transactionData.amount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                  minimumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>

          {/* Transaction Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Détails de la transaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                <span className="text-sm font-medium text-muted-foreground">Type</span>
                <Badge variant={type === "deposit" ? "default" : "secondary"} className="text-xs">
                  {type === "deposit" ? "Dépôt" : "Retrait"}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2.5">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-muted-foreground">Plateforme</span>
                  <span className="font-semibold text-sm">{platformName}</span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-muted-foreground">ID de pari</span>
                  <span className="font-semibold text-sm truncate max-w-[200px]">
                    {transactionData.user_app_id}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-muted-foreground">Réseau</span>
                  <span className="font-semibold text-sm">{networkName}</span>
                </div>

                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-muted-foreground">Numéro</span>
                  <span className="font-semibold text-sm">{transactionData.phone_number}</span>
                </div>

                {type === "withdrawal" && transactionData.withdriwal_code && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center py-1.5 bg-muted/50 rounded-md px-3 -mx-2">
                      <span className="text-sm text-muted-foreground font-medium">Code de retrait</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {transactionData.withdriwal_code}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || isLoading}
            className="flex-1 sm:flex-1"
            size="default"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              "Confirmer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
