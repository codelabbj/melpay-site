"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { StepNavigation } from "@/components/transaction/step-navigation"
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { PlatformStep } from "@/components/transaction/steps/platform-step"
import { BetIdStep } from "@/components/transaction/steps/bet-id-step"
import { NetworkStep } from "@/components/transaction/steps/network-step"
import { PhoneStep } from "@/components/transaction/steps/phone-step"
import { AmountStep } from "@/components/transaction/steps/amount-step"
import { transactionApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { toast } from "react-hot-toast"
import { DepositStepper } from "@/components/transaction/deposit-stepper"
import { TransactionSummaryDialog } from "@/components/transaction/transaction-summary-dialog"
import type { Transaction } from "@/lib/types"

export default function WithdrawalPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5
  
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null)
  const [isTransactionSummaryOpen, setIsTransactionSummaryOpen] = useState(false)
  
  // Form data
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)
  const [withdriwalCode, setWithdriwalCode] = useState("")
  
  // Confirmation dialog
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check for pending transactions on mount
  useEffect(() => {
    if (user) {
      const checkPendingTransaction = async () => {
        try {
          const lastTrans = await transactionApi.getLastTransaction()
          if (lastTrans && (lastTrans.status === 'pending' || lastTrans.status === 'init_payment')) {
            setLastTransaction(lastTrans)
            setIsTransactionSummaryOpen(true)
          }
        } catch (error) {
          console.error("Erreur lors de la vérification des transactions en attente:", error)
        }
      }
      checkPendingTransaction()
    }
  }, [user])

  const hasPendingTransaction = !!(lastTransaction && (lastTransaction.status === 'pending' || lastTransaction.status === 'init_payment'))

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsConfirmationOpen(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConfirmTransaction = async () => {
    if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
      toast.error("Données manquantes pour la transaction")
      return
    }

    setIsSubmitting(true)
    try {
      await transactionApi.createWithdrawal({
        amount,
        phone_number: selectedPhone.phone,
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        withdriwal_code: withdriwalCode,
        source: "web"
      })
      
      toast.success("Retrait initié avec succès!")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Erreur lors de la création du retrait")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelTransaction = async (reference: string) => {
    await transactionApi.cancelTransaction(reference)
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  const handleFinalizeTransaction = async (reference: string) => {
    try {
      const finalizedTransaction = await transactionApi.finalizeTransaction(reference)
      console.log("Transaction finalisée:", finalizedTransaction)
      setIsTransactionSummaryOpen(false)
      toast.success("Action finalisée avec succès")
      router.push("/dashboard")
    } catch (error) {
      throw error
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== null
      case 2:
        return selectedBetId !== null
      case 3:
        return selectedNetwork !== null
      case 4:
        return selectedPhone !== null
      case 5:
        return amount > 0 && selectedPlatform && 
               withdriwalCode.length >= 4 &&
               amount >= selectedPlatform.minimun_with && 
               amount <= selectedPlatform.max_win
      default:
        return false
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PlatformStep
            selectedPlatform={selectedPlatform}
            onSelect={(platform)=>{
                setSelectedPlatform(platform);
                setTimeout(()=>{setCurrentStep(currentStep + 1)}, 1000)
            }}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <BetIdStep
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            onSelect={(betId)=>{
                setSelectedBetId(betId);
                setTimeout(()=>{setCurrentStep(currentStep + 1)}, 1000)
            }}
            onNext={handleNext}
          />
        )
      case 3:
        return (
          <NetworkStep
            selectedNetwork={selectedNetwork}
            onSelect={(network)=>{
                setSelectedNetwork(network)
                setTimeout(()=>{setCurrentStep(currentStep + 1)}, 1000)
            }}
            type="withdrawal"
          />
        )
      case 4:
        return (
          <PhoneStep
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            onSelect={(phone)=>{
                setSelectedPhone(phone)
                setTimeout(()=>{setCurrentStep(currentStep + 1)}, 1000)
            }}
            onNext={handleNext}
          />
        )
      case 5:
    return (
          <AmountStep
            amount={amount}
            setAmount={setAmount}
            withdriwalCode={withdriwalCode}
            setWithdriwalCode={setWithdriwalCode}
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            type="withdrawal"
            onNext={handleNext}
            hasPending={hasPendingTransaction}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Effectuer un retrait</h1>
          </div>
        </div>

        {/* Progress Bar */}
        <DepositStepper
          currentStep={currentStep} 
          totalSteps={totalSteps}
          type="withdrawal"
        />

        {/* Current Step */}
        <div className="min-h-[300px] sm:min-h-[400px]">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        {currentStep < 5 && (
          <StepNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onPrevious={handlePrevious}
            onNext={handleNext}
            isNextDisabled={!isStepValid() || hasPendingTransaction}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleConfirmTransaction}
          transactionData={{
            amount,
            phone_number: selectedPhone?.phone || "",
            app: selectedPlatform?.id || "",
            user_app_id: selectedBetId?.user_app_id || "",
            network: selectedNetwork?.id || 0,
            withdriwal_code: withdriwalCode,
          }}
          type="withdrawal"
          platformName={selectedPlatform?.name || ""}
          networkName={selectedNetwork?.public_name || ""}
          isLoading={isSubmitting}
        />
        <TransactionSummaryDialog
          isOpen={isTransactionSummaryOpen}
          onClose={() => {
            setIsTransactionSummaryOpen(false)
          }}
          transaction={lastTransaction}
          onCancel={handleCancelTransaction}
          onFinalize={handleFinalizeTransaction}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  )
}