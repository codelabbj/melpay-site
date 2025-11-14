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
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { setupNotifications } from "@/lib/fcm-helper"
import Image from "next/image";
import logo from "@/public/logo.png"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Email ou téléphone requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Step 1: Authenticate user
      const response = await authApi.login(data.email_or_phone, data.password)
      login(response.access, response.refresh, response.data)
      
      // Step 2: Show success toast first
      toast.success("Connexion réussie!")
      
      // Step 3: Request notification permission (shows native browser prompt)
      try {
        const userId = response.data?.id
        
        // Add small delay to ensure page is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('[Login] Setting up notifications for user:', userId)
        const fcmToken = await setupNotifications(userId)
        
        if (fcmToken) {
          toast.success("Notifications activées!")
          console.log('[Login] FCM Token registered:', fcmToken.substring(0, 20) + '...')
        } else {
          console.log('[Login] No FCM token - permission might be denied or not granted')
        }
      } catch (fcmError) {
        // Non-critical error - don't block login
        console.error('[Login] Error setting up notifications:', fcmError)
      }
      
      // Step 4: Redirect to dashboard
      // Wait a bit more to ensure notification prompt completes if shown
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push("/dashboard")
    } catch (error) {
      // Error is handled by api interceptor
      console.error("Login error:", error)
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
                Gérez vos dépôts et retraits en toute simplicité
              </p>
            </div>

            {/* Form section */}
            <div className="p-6 sm:p-8 md:p-10">
              <div className="mb-6 sm:mb-8 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  Connexion
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Entrez vos identifiants pour accéder à votre compte
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email_or_phone" className="text-xs sm:text-sm font-semibold">
                    Email ou Téléphone
                  </Label>
                  <Input
                    id="email_or_phone"
                    type="text"
                    placeholder="exemple@email.com ou +225..."
                    {...register("email_or_phone")}
                    disabled={isLoading}
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                  />
                  {errors.email_or_phone && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.email_or_phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">
                    Mot de passe
                  </Label>
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
                  {errors.password && (
                    <p className="text-xs sm:text-sm text-destructive">
                      {errors.password.message}
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
                      <span className="hidden sm:inline">Connexion en cours...</span>
                      <span className="sm:hidden">Connexion...</span>
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>

              <div className="mt-6 sm:mt-8 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Pas encore de compte?{" "}
                  <Link
                    href="/signup"
                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                  >
                    Créer un compte
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
