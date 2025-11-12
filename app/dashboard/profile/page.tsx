"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit, Save, X, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "react-hot-toast"
import {UserProfile} from "@/lib/types";
import {profileApi} from "@/lib/api-client";

const profileSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  old_password: z.string().optional(),
  password: z.string().optional(),
  confirm_password: z.string().optional(),
}).refine(
  (data) => {
    // If password is provided, old_password must be provided
    if (data.password && data.password.length > 0) {
      return data.old_password && data.old_password.length > 0
    }
    return true
  },
  {
    message: "Veuillez fournir votre ancien mot de passe pour le modifier",
    path: ["old_password"],
  }
).refine(
  (data) => {
    // If password is provided, it must be at least 6 characters
    if (data.password && data.password.length > 0) {
      return data.password.length >= 6
    }
    return true
  },
  {
    message: "Le mot de passe doit contenir au moins 6 caractères",
    path: ["password"],
  }
).refine(
  (data) => {
    // If password is provided, confirm_password must match
    if (data.password && data.password.length > 0) {
      return data.password === data.confirm_password
    }
    return true
  },
  {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm_password"],
  }
)

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      old_password: "",
      password: "",
      confirm_password: "",
    },
  })

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  const handleEdit = () => {
    setIsEditing(true)
    reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      old_password: "",
      password: "",
      confirm_password: "",
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      old_password: "",
      password: "",
      confirm_password: "",
    })
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      // Prepare update data
      const updateData: UserProfile = {
          bonus_available: user.bonus_available,
          date_joined: user.date_joined,
          id: user.id,
          is_active: user.is_active,
          is_block: user.is_block,
          is_delete: user.is_delete,
          is_staff: user.is_staff,
          is_superuser: user.is_superuser,
          is_supperuser: user.is_supperuser,
          last_login: user.last_login,
          otp: user.otp,
          otp_created_at: user.otp_created_at,
          referral_code: user.referral_code,
          referrer_code: user.referrer_code,
          username: user.username,
          first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone
      }

      await profileApi.update(updateData)

      // Update local user data with the response from the API
      updateUser({...user,last_name:data.last_name,email:data.email,first_name:data.first_name,phone:data.phone})

      // Only include password if it's being changed
      if (data.password && data.password.length > 0) {
         await profileApi.changePassword(data.password, data.confirm_password!, data.old_password!)
      }

      toast.success("Profil mis à jour avec succès!")
      setIsEditing(false)

      // Clear password fields
      reset({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        old_password: "",
        password: "",
        confirm_password: "",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      // Error is handled by api interceptor
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mon Profil</h1>
              <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles</p>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} className="rounded-xl">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              {isEditing
                ? "Modifiez vos informations et cliquez sur enregistrer"
                : "Vos informations de compte"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-xs sm:text-sm font-semibold">Prénom</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="first_name"
                        type="text"
                        placeholder="Votre prénom"
                        {...register("first_name")}
                        disabled={isLoading}
                        className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                      />
                      {errors.first_name && <p className="text-xs sm:text-sm text-destructive">{errors.first_name.message}</p>}
                    </>
                  ) : (
                    <div className="p-3 rounded-xl bg-muted/50 text-sm font-medium">
                      {user.first_name || "Non renseigné"}
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-xs sm:text-sm font-semibold">Nom</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="last_name"
                        type="text"
                        placeholder="Votre nom"
                        {...register("last_name")}
                        disabled={isLoading}
                        className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                      />
                      {errors.last_name && <p className="text-xs sm:text-sm text-destructive">{errors.last_name.message}</p>}
                    </>
                  ) : (
                    <div className="p-3 rounded-xl bg-muted/50 text-sm font-medium">
                      {user.last_name || "Non renseigné"}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">Email</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      {...register("email")}
                      disabled={isLoading}
                      className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                    />
                    {errors.email && <p className="text-xs sm:text-sm text-destructive">{errors.email.message}</p>}
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-muted/50 text-sm font-medium">
                    {user.email || "Non renseigné"}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold">Téléphone</Label>
                {isEditing ? (
                  <>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Votre numéro de téléphone"
                      {...register("phone")}
                      disabled={isLoading}
                      className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all rounded-xl"
                    />
                    {errors.phone && <p className="text-xs sm:text-sm text-destructive">{errors.phone.message}</p>}
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-muted/50 text-sm font-medium">
                    {user.phone || "Non renseigné"}
                  </div>
                )}
              </div>

              {/* Password fields - only show when editing */}
              {isEditing && (
                <>
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-semibold mb-4">Changer le mot de passe (optionnel)</h3>
                    <div className="space-y-4">
                      {/* Old Password */}
                      <div className="space-y-2">
                        <Label htmlFor="old_password" className="text-xs sm:text-sm font-semibold">Ancien mot de passe</Label>
                        <div className="relative">
                          <Input
                            id="old_password"
                            type={showOldPassword ? "text" : "password"}
                            placeholder="Votre ancien mot de passe"
                            {...register("old_password")}
                            disabled={isLoading}
                            className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all pr-10 rounded-xl"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent rounded-r-xl"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            tabIndex={-1}
                          >
                            {showOldPassword ? (
                              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {errors.old_password && <p className="text-xs sm:text-sm text-destructive">{errors.old_password.message}</p>}
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">Nouveau mot de passe</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Minimum 6 caractères"
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

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirm_password" className="text-xs sm:text-sm font-semibold">Confirmer le mot de passe</Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmez votre mot de passe"
                            {...register("confirm_password")}
                            disabled={isLoading}
                            className="h-11 sm:h-12 text-sm sm:text-base bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all pr-10 rounded-xl"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent rounded-r-xl"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {errors.confirm_password && <p className="text-xs sm:text-sm text-destructive">{errors.confirm_password.message}</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Action buttons when editing */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 rounded-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Enregistrement...</span>
                        <span className="sm:hidden">En cours...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    disabled={isLoading}
                    className="flex-1 h-11 sm:h-12 text-sm sm:text-base rounded-xl"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Annuler
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}