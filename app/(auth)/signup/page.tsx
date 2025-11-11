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
import { useSettings } from "@/lib/settings-context"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import logo from "@/public/logo.png"

const getSignupSchema = (referralBonusEnabled: boolean) => {
  const baseSchema = {
    first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    re_password: z.string().min(6, "Confirmation requise"),
  }

  if (referralBonusEnabled) {
    return z
      .object({
        ...baseSchema,
        referral_code: z.string().optional(),
      })
      .refine((data) => data.password === data.re_password, {
        message: "Les mots de passe ne correspondent pas",
        path: ["re_password"],
      })
  }

  return z.object(baseSchema).refine((data) => data.password === data.re_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["re_password"],
  })
}

export default function SignupPage() {
  const router = useRouter()
  const { settings } = useSettings()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showRePassword, setShowRePassword] = useState(false)

  const referralBonusEnabled = settings?.referral_bonus || false
  const signupSchema = getSignupSchema(referralBonusEnabled)
  type SignupFormData = z.infer<typeof signupSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      await authApi.register(data)
      toast.success("Compte créé avec succès! Veuillez vous connecter.")
      router.push("/login")
    } catch (error) {
      // Error is handled by api interceptor
      console.error("Signup error:", error)
    } finally {
      setIsLoading(false)
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
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          {/* Card with logo and form */}
          <div className="bg-background/95 backdrop-blur-xl border-2 border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
            {/* Logo section at top of card */}
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent pt-6 sm:pt-8 pb-5 sm:pb-6 px-6 sm:px-8 text-center border-b border-border/50">
              <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl"></div>
                  <Image
                    src={logo}
                    alt="MELPAY logo"
                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ring-4 ring-primary/20 shadow-lg"
                  />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1.5 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                MELPAY
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Rejoignez-nous et gérez vos transactions facilement
              </p>
            </div>

            {/* Form section */}
            <div className="p-5 sm:p-6 md:p-8">
              <div className="mb-5 sm:mb-6 text-center">
                <h2 className="text-xl sm:text-2xl font-bold mb-1.5">
                  Créer un compte
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Remplissez le formulaire pour créer votre compte
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-xs sm:text-sm font-semibold">Prénom</Label>
                  <Input 
                    id="first_name" 
                    type="text" 
                    placeholder="Jean" 
                    {...register("first_name")} 
                    disabled={isLoading} 
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                  />
                  {errors.first_name && <p className="text-xs sm:text-sm text-destructive">{errors.first_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-xs sm:text-sm font-semibold">Nom</Label>
                  <Input 
                    id="last_name" 
                    type="text" 
                    placeholder="Dupont" 
                    {...register("last_name")} 
                    disabled={isLoading} 
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                  />
                  {errors.last_name && <p className="text-xs sm:text-sm text-destructive">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  {...register("email")}
                  disabled={isLoading}
                  className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                />
                {errors.email && <p className="text-xs sm:text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+225 01 02 03 04 05"
                  {...register("phone")}
                  disabled={isLoading}
                  className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                />
                {errors.phone && <p className="text-xs sm:text-sm text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all pr-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent rounded-r-xl"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && <p className="text-xs sm:text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="re_password" className="text-xs sm:text-sm font-semibold">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="re_password"
                    type={showRePassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("re_password")}
                    disabled={isLoading}
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all pr-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent rounded-r-xl"
                    onClick={() => setShowRePassword(!showRePassword)}
                    tabIndex={-1}
                  >
                    {showRePassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.re_password && <p className="text-xs sm:text-sm text-destructive">{errors.re_password.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">Création en cours...</span>
                    <span className="sm:hidden">Création...</span>
                  </>
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>

            <div className="mt-5 sm:mt-6 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Vous avez déjà un compte?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                >
                  Se connecter
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
