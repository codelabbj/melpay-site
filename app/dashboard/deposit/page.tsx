"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft,CircleCheck, Copy, Check} from "lucide-react"
import { DepositStepper } from "@/components/transaction/deposit-stepper"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {useSettings} from "@/lib/settings-context";

export default function DepositPage() {
  const router = useRouter()
  const { user } = useAuth()
    const {settings} = useSettings()
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5
  
  // Form data
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)
  
  // Confirmation dialog
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Transaction link dialog
  const [isTransactionLinkDialogOpen, setIsTransactionLinkDialogOpen] = useState(false)
  const [transactionLink, setTransactionLink] = useState<string>("")

  // Moov USSD dialog
  const [isMoovUSSDDialogOpen, setIsMoovUSSDDialogOpen] = useState(false)
  const [moovUSSDCode, setMoovUSSDCode] = useState<string>("")
  const [copiedUSSD, setCopiedUSSD] = useState(false)

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
      const response = await transactionApi.createDeposit({
        amount,
        phone_number: selectedPhone.phone,
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        source: "web"
      })

      if (response.transaction_link) {
        // Close confirmation dialog and show transaction link dialog
        setIsConfirmationOpen(false)
        setTransactionLink(response.transaction_link)
        setIsTransactionLinkDialogOpen(true)
      } else {
        // Check if Moov network and API is connected
        const isMoov = selectedNetwork?.name?.toLowerCase() === "moov"
          const isOrange = selectedNetwork?.name?.toLowerCase() === "orange"
        // const isMoovConnected = selectedNetwork?.deposit_api === "connect" && isMoov
          const isOrangeConnected = selectedNetwork?.deposit_api === "connect" && isOrange

        // Moov USSD flow temporarily disabled so it follows the standard deposit path
        if( isOrangeConnected && settings) {
            const fee = Math.ceil(amount * 0.01) // 1% fee
            const netAmount = amount - fee
            const merchantPhone = selectedNetwork?.country_code?.toUpperCase() === "BF" ? settings.bf_orange_marchand_phone : settings.orange_marchand_phone

            if (merchantPhone){
                const ussdCode = `#144#8*${merchantPhone}*${netAmount}#`
                // Always show the USSD dialog
                setIsMoovUSSDDialogOpen(true)
                setMoovUSSDCode(ussdCode)
                setIsConfirmationOpen(false)

                setTimeout(() => {
                    window.location.href = `tel:${ussdCode}`
                }, 500)
            }else{
                router.push("/dashboard")
            }

        } else {
          toast.success("Dépôt initié avec succès! final")
          router.push("/dashboard")
        }
      }
    } catch (error) {
      toast.error("Erreur lors de la création du dépôt")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmRedirect = () => {
    if (transactionLink) {
      window.open(transactionLink, '_blank')
      setIsTransactionLinkDialogOpen(false)
      toast.success("Dépôt initié avec succès!")
      router.push("/dashboard")
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
               amount >= selectedPlatform.minimun_deposit && 
               amount <= selectedPlatform.max_deposit
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
            type="deposit"
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
            withdriwalCode=""
            setWithdriwalCode={() => {}}
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            type="deposit"
            onNext={handleNext}
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Effectuer un dépôt</h1>
          </div>
        </div>

        {/* Progress Bar */}
        <DepositStepper 
          currentStep={currentStep} 
          totalSteps={totalSteps}
          type="deposit"
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
            isNextDisabled={!isStepValid()}
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
          }}
          type="deposit"
          platformName={selectedPlatform?.name || ""}
          networkName={selectedNetwork?.public_name || ""}
          isLoading={isSubmitting}
        />

        {/* Transaction Link Dialog */}
        <Dialog open={isTransactionLinkDialogOpen} onOpenChange={setIsTransactionLinkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <CircleCheck className="h-5 w-5 text-primary" />
                Finaliser le dépôt
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                  Pour terminer la transaction, veuillez cliquer sur confirmer.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                type="button"
                onClick={handleConfirmRedirect}
                className="w-full sm:w-auto order-1 sm:order-2 gap-2"
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Moov USSD Code Dialog intentionally disabled so Moov follows the standard deposit flow */}
      </div>
    </div>
  )
}