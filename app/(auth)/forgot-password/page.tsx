"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import Image from "next/image"
import logo from "@/public/logo.png"

// Schema for email input
const emailSchema = z.object({
  email: z.string().email("Email invalide"),
})

// Schema for OTP input
const otpSchema = z.object({
  otp: z.string().min(4, "Le code OTP doit contenir 4 chiffres").max(4, "Le code OTP doit contenir 4 chiffres"),
})

// Schema for password reset
const passwordSchema = z.object({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  password_confirm: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
}).refine(data => data.password === data.password_confirm, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password_confirm"],
})

type EmailFormData = z.infer<typeof emailSchema>
type OtpFormData = z.infer<typeof otpSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

type ForgotPasswordStep = "email" | "otp" | "password"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<ForgotPasswordStep>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")

  // Email form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  // OTP form
  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  })

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  // Step 1: Request OTP with email
  const onEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true)
    try {
      // Call API to request OTP
      await authApi.requestOtp(data.email)
      setEmail(data.email)
      toast.success("Code OTP envoyé à votre email!")
      setStep("otp")
    } catch (error) {
      console.error("Error requesting OTP:", error)
      toast.error("Erreur lors de l'envoi du code OTP")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify OTP (storing OTP for later use)
  const onOtpSubmit = async (data: OtpFormData) => {
    setIsLoading(true)
    try {
      // Store OTP for password reset step
      setOtp(data.otp)
      toast.success("Code OTP accepté!")
      setStep("password")
    } catch (error) {
      console.error("Error verifying OTP:", error)
      toast.error("Code OTP invalide ou expiré")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Reset password
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    try {
      // Call API to reset password
      await authApi.resetPassword(otp, data.password, data.password_confirm)
      toast.success("Mot de passe réinitialisé avec succès!")
      router.push("/login")
    } catch (error) {
      console.error("Error resetting password:", error)
      toast.error("Erreur lors de la réinitialisation du mot de passe")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === "email") {
      router.push("/login")
    } else if (step === "otp") {
      setStep("email")
    } else {
      setStep("otp")
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Full page gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary/60">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30"></div>
      </div>

      {/* Animated background elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Centered card container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md sm:max-w-lg">
          {/* Card with logo and form */}
          <div className="bg-background/95 backdrop-blur-xl border-2 border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
            {/* Logo section at top of card */}
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent pt-8 sm:pt-10 pb-6 sm:pb-8 px-6 sm:px-8 text-center border-b border-border/50">
              <div className="inline-flex items-center justify-center mb-4 sm:mb-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl"></div>
                  <Image
                    src={logo}
                    alt="FASTXOF logo"
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-4 ring-primary/20 shadow-lg"
                  />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                FASTXOF
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Réinitialisez votre mot de passe en toute sécurité
              </p>
            </div>

            {/* Form section */}
            <div className="p-6 sm:p-8 md:p-10">
              {/* Back button - only show if not on email step */}
              {step !== "email" && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-primary hover:text-primary/80 font-semibold mb-6 transition-colors"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </button>
              )}

              {/* STEP 1: Email Input */}
              {step === "email" && (
                <>
                  <div className="mb-6 sm:mb-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                      Mot de passe oublié?
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Entrez votre email pour recevoir un code de vérification
                    </p>
                  </div>

                  <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5 sm:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">
                        Adresse Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="exemple@email.com"
                        {...registerEmail("email")}
                        disabled={isLoading}
                        className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                      />
                      {emailErrors.email && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {emailErrors.email.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          <span className="hidden sm:inline">Envoi en cours...</span>
                          <span className="sm:hidden">Envoi...</span>
                        </>
                      ) : (
                        "Envoyer le code"
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 sm:mt-8 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Vous avez un compte?{" "}
                      <Link
                        href="/login"
                        className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                      >
                        Se connecter
                      </Link>
                    </p>
                  </div>
                </>
              )}

              {/* STEP 2: OTP Input */}
              {step === "otp" && (
                <>
                  <div className="mb-6 sm:mb-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                      Vérifiez votre email
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Entrez le code à 6 chiffres envoyé à <br />
                      <span className="font-semibold text-foreground">{email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-5 sm:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-xs sm:text-sm font-semibold">
                        Code OTP
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        inputMode="numeric"
                        {...registerOtp("otp")}
                        disabled={isLoading}
                        className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl text-center tracking-widest font-semibold"
                      />
                      {otpErrors.otp && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {otpErrors.otp.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          <span className="hidden sm:inline">Vérification...</span>
                          <span className="sm:hidden">Vérif...</span>
                        </>
                      ) : (
                        "Vérifier"
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 sm:mt-8 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Vous n'avez pas reçu le code?{" "}
                      <button
                        onClick={() => setStep("email")}
                        disabled={isLoading}
                        className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors disabled:opacity-50"
                      >
                        Renvoyer
                      </button>
                    </p>
                  </div>
                </>
              )}

              {/* STEP 3: Password Reset */}
              {step === "password" && (
                <>
                  <div className="mb-6 sm:mb-8 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                      Nouveau mot de passe
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Entrez votre nouveau mot de passe
                    </p>
                  </div>

                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5 sm:space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">
                        Nouveau mot de passe
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...registerPassword("password")}
                        disabled={isLoading}
                        className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                      />
                      {passwordErrors.password && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {passwordErrors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirm" className="text-xs sm:text-sm font-semibold">
                        Confirmer le mot de passe
                      </Label>
                      <Input
                        id="password_confirm"
                        type="password"
                        placeholder="••••••••"
                        {...registerPassword("password_confirm")}
                        disabled={isLoading}
                        className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                      />
                      {passwordErrors.password_confirm && (
                        <p className="text-xs sm:text-sm text-destructive">
                          {passwordErrors.password_confirm.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          <span className="hidden sm:inline">Réinitialisation...</span>
                          <span className="sm:hidden">Réinit...</span>
                        </>
                      ) : (
                        "Réinitialiser"
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}