"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { phoneApi, userAppIdApi, networkApi, platformApi } from "@/lib/api-client"
import type {UserPhone, UserAppId, Network, Platform, BetId} from "@/lib/types"
import { toast } from "react-hot-toast"
import { Loader2, Phone, Plus, Trash2, Edit, Smartphone, ArrowLeft } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const phoneSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  network: z.number().min(1, "Réseau requis"),
})

const appIdSchema = z.object({
  user_app_id: z.string().min(1, "ID de pari requis"),
  app: z.string().min(1, "Plateforme requise"),
})

type PhoneFormData = z.infer<typeof phoneSchema>
type AppIdFormData = z.infer<typeof appIdSchema>

export default function PhonesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userPhones, setUserPhones] = useState<UserPhone[]>([])
  const [userAppIds, setUserAppIds] = useState<UserAppId[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [isAppIdDialogOpen, setIsAppIdDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPhone, setEditingPhone] = useState<UserPhone | null>(null)
  const [editingAppId, setEditingAppId] = useState<UserAppId | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "phone" | "appId"; id: number } | null>(null)
    const [betId, setBetId] = useState<BetId | null>(null)

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  })

  const appIdForm = useForm<AppIdFormData>({
    resolver: zodResolver(appIdSchema),
  })

  useEffect(() => {
    loadData()
  }, [])

  // Refetch data when the page gains focus to ensure fresh data
  useEffect(() => {
    const handleFocus = () => {
      loadData()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [phonesData, networksData, platformsData] = await Promise.all([
        phoneApi.getAll(),
        networkApi.getAll(),
        platformApi.getAll(),
      ])
      setUserPhones(phonesData)
      setNetworks(networksData)
      setPlatforms(platformsData)

      // Load all app IDs for all platforms
      const allAppIds: UserAppId[] = []
      for (const platform of platformsData) {
        try {
          const appIds = await userAppIdApi.getByPlatform(platform.id.toString())
          allAppIds.push(...appIds)
        } catch (error) {
          console.error(`Failed to load app IDs for platform ${platform.id}:`, error)
        }
      }
      setUserAppIds(allAppIds)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setIsSubmitting(true)
    try {
      if (editingPhone) {
        await phoneApi.update(editingPhone.id, data.phone, data.network)
        toast.success("Numéro modifié avec succès!")
      } else {
        await phoneApi.create(data.phone, data.network)
        toast.success("Numéro ajouté avec succès!")
      }
      setIsPhoneDialogOpen(false)
      phoneForm.reset()
      setEditingPhone(null)
      loadData()
    } catch (error) {
      console.error("Phone operation error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAppIdSubmit = async (data: AppIdFormData) => {
    setIsSubmitting(true)
    try {
      if (editingAppId) {
        await userAppIdApi.update(editingAppId.id, data.user_app_id, data.app)
        toast.success("ID de pari modifié avec succès!")
      } else {
        await userAppIdApi.create(data.user_app_id, data.app)
        toast.success("ID de pari ajouté avec succès!")
      }
      setIsAppIdDialogOpen(false)
      appIdForm.reset()
      setEditingAppId(null)
      loadData()
    } catch (error) {
      console.error("App ID operation error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === "phone") {
        await phoneApi.delete(deleteTarget.id)
        toast.success("Numéro supprimé avec succès!")
      } else {
        await userAppIdApi.delete(deleteTarget.id)
        toast.success("ID de pari supprimé avec succès!")
      }
      setDeleteTarget(null)
      loadData()
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const openEditPhoneDialog = (phone: UserPhone) => {
    setEditingPhone(phone)
    phoneForm.reset({
      phone: phone.phone,
      network: phone.network,
    })
    setIsPhoneDialogOpen(true)
  }

  const openEditAppIdDialog = (appId: UserAppId) => {
    setEditingAppId(appId)
    appIdForm.reset({
      user_app_id: appId.user_app_id,
      app: appId.app_name?.toString(),
    })
    setIsAppIdDialogOpen(true)
  }

  const closePhoneDialog = () => {
    setIsPhoneDialogOpen(false)
    setEditingPhone(null)
    phoneForm.reset()
  }

  const closeAppIdDialog = () => {
    setIsAppIdDialogOpen(false)
    setEditingAppId(null)
    appIdForm.reset()
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
                Mes numéros et IDs
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                Gérez vos numéros de téléphone et IDs de pari
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="phones" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full grid grid-cols-2 h-11 sm:h-12 bg-muted/50">
          <TabsTrigger value="phones" className="text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Phone className="h-4 w-4 mr-2 hidden sm:inline" />
            Numéros
          </TabsTrigger>
          <TabsTrigger value="appIds" className="text-xs sm:text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Smartphone className="h-4 w-4 mr-2 hidden sm:inline" />
            IDs de pari
          </TabsTrigger>
        </TabsList>

        {/* Phone Numbers Tab */}
        <TabsContent value="phones" className="space-y-4">
          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 space-y-0 pb-4 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center justify-between w-full gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg">Numéros de téléphone</CardTitle>
                          <CardDescription className="text-xs sm:text-sm hidden sm:block">
                              Gérez vos numéros de téléphone mobile
                          </CardDescription>
                      </div>
                  </div>

                  <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                      <DialogTrigger asChild>
                          <Button
                              onClick={() => setEditingPhone(null)}
                              size="sm"
                              className="w-auto shadow-sm hover:shadow-md transition-shadow"
                          >
                              <Plus className=" h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm hidden sm:block">Ajouter un numéro</span>
                              <span className="text-xs sm:text-sm block sm:hidden">Ajouter</span>
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] sm:w-full max-w-md">
                          <DialogHeader>
                              <DialogTitle className="text-lg sm:text-xl">{editingPhone ? "Modifier le numéro" : "Ajouter un numéro"}</DialogTitle>
                              <DialogDescription className="text-sm">
                                  {editingPhone
                                      ? "Modifiez les informations de votre numéro"
                                      : "Ajoutez un nouveau numéro de téléphone"}
                              </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
                              <div className="space-y-2">
                                  <Label htmlFor="phone">Numéro de téléphone</Label>
                                  <Input
                                      id="phone"
                                      type="tel"
                                      placeholder="+225 01 02 03 04 05"
                                      {...phoneForm.register("phone")}
                                      disabled={isSubmitting}
                                  />
                                  {phoneForm.formState.errors.phone && (
                                      <p className="text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>
                                  )}
                              </div>

                              <div className="space-y-2">
                                  <Label htmlFor="network">Réseau mobile</Label>
                                  <Select
                                      onValueChange={(value) => phoneForm.setValue("network", Number.parseInt(value))}
                                      defaultValue={editingPhone?.network.toString()}
                                      disabled={isSubmitting}
                                  >
                                      <SelectTrigger>
                                          <SelectValue placeholder="Sélectionnez un réseau" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {networks.map((network) => (
                                              <SelectItem key={network.id} value={network.id.toString()}>
                                                  {network.name}
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                                  {phoneForm.formState.errors.network && (
                                      <p className="text-sm text-destructive">{phoneForm.formState.errors.network.message}</p>
                                  )}
                              </div>

                              <div className="flex gap-3">
                                  <Button
                                      type="button"
                                      variant="outline"
                                      onClick={closePhoneDialog}
                                      className="flex-1 bg-transparent"
                                  >
                                      Annuler
                                  </Button>
                                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                                      {isSubmitting ? (
                                          <>
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              Enregistrement...
                                          </>
                                      ) : editingPhone ? (
                                          "Modifier"
                                      ) : (
                                          "Ajouter"
                                      )}
                                  </Button>
                              </div>
                          </form>
                      </DialogContent>
                  </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  </div>
                </div>
              ) : userPhones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
                    <Smartphone className="h-12 w-12 sm:h-14 sm:w-14 text-primary" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold mb-1">Aucun numéro enregistré</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Ajoutez votre premier numéro pour commencer
                  </p>
                </div>
              ) : (
                 <div>
                     <div className="space-y-3 sm:hidden">
                         {userPhones.map((phone) => (
                             <Card key={phone.id} className="border-2 hover:shadow-md transition-shadow">
                                 <CardContent className="p-4">
                                     <div className="space-y-3">
                                         <div className="flex items-start gap-3">
                                             <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                                 <Phone className="h-4 w-4 text-primary" />
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                 <p className="text-xs text-muted-foreground mb-1">Numéro de téléphone</p>
                                                 <p className="font-semibold text-sm truncate">{phone.phone}</p>
                                             </div>
                                         </div>
                                         <div className="flex items-center gap-2 pl-11">
                                             <p className="text-xs text-muted-foreground">Réseau:</p>
                                             <Badge variant="secondary" className="text-xs">
                                                 {networks.find((n) => n.id === phone.network)?.name || "Inconnu"}
                                             </Badge>
                                         </div>
                                         <div className="flex justify-start gap-2 pt-3 border-t">
                                             <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => openEditPhoneDialog(phone)}
                                                 className="hover:bg-primary/10 hover:text-primary"
                                             >
                                                 <Edit className="h-4 w-4 mr-1.5" />
                                                 <span className="text-xs">Modifier</span>
                                             </Button>
                                             <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => setDeleteTarget({ type: "phone", id: phone.id })}
                                                 className="hover:bg-destructive/10 hover:text-destructive"
                                             >
                                                 <Trash2 className="h-4 w-4 mr-1.5" />
                                                 <span className="text-xs">Supprimer</span>
                                             </Button>
                                         </div>
                                     </div>
                                 </CardContent>
                             </Card>
                         ))}
                     </div>
                     {userPhones.length > 0 && (
                         <div className="hidden sm:block rounded-xl border-2 overflow-hidden shadow-sm">
                             <Table>
                                 <TableHeader>
                                     <TableRow className="bg-muted/50">
                                         <TableHead className="font-semibold">Numéro de téléphone</TableHead>
                                         <TableHead className="font-semibold">Réseau</TableHead>
                                         <TableHead className="text-right font-semibold">Actions</TableHead>
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {userPhones.map((phone) => (
                                         <TableRow key={phone.id} className="hover:bg-muted/30">
                                             <TableCell className="font-semibold">{phone.phone}</TableCell>
                                             <TableCell>
                                                 <Badge variant="secondary" className="font-medium">
                                                     {networks.find((n) => n.id === phone.network)?.name || "Inconnu"}
                                                 </Badge>
                                             </TableCell>
                                             <TableCell className="text-right">
                                                 <div className="flex justify-end gap-2">
                                                     <Button
                                                         variant="ghost"
                                                         size="icon"
                                                         onClick={() => openEditPhoneDialog(phone)}
                                                         className="hover:bg-primary/10 hover:text-primary"
                                                     >
                                                         <Edit className="h-4 w-4" />
                                                     </Button>
                                                     <Button
                                                         variant="ghost"
                                                         size="icon"
                                                         onClick={() => setDeleteTarget({ type: "phone", id: phone.id })}
                                                         className="hover:bg-destructive/10 hover:text-destructive"
                                                     >
                                                         <Trash2 className="h-4 w-4" />
                                                     </Button>
                                                 </div>
                                             </TableCell>
                                         </TableRow>
                                     ))}
                                 </TableBody>
                             </Table>
                         </div>
                     )}
                 </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* App IDs Tab */}
        <TabsContent value="appIds" className="space-y-4">
          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 space-y-0 pb-4 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center justify-between w-full gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg">IDs de pari</CardTitle>
                          <CardDescription className="text-xs sm:text-sm hidden sm:block">
                              Gérez vos identifiants de plateformes de pari
                          </CardDescription>
                      </div>
                  </div>

                  <Dialog open={isAppIdDialogOpen} onOpenChange={setIsAppIdDialogOpen}>
                      <DialogTrigger asChild>
                          <Button
                              onClick={() => setEditingAppId(null)}
                              size="sm"
                              className="w-auto shadow-sm hover:shadow-md transition-shadow"
                          >
                              <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm hidden sm:block">Ajouter un ID</span>
                              <span className="text-xs sm:text-sm block sm:hidden">Ajouter</span>
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] sm:w-full max-w-md">
                          <DialogHeader>
                              <DialogTitle className="text-lg sm:text-xl">{editingAppId ? "Modifier l'ID" : "Ajouter un ID"}</DialogTitle>
                              <DialogDescription className="text-sm">
                                  {editingAppId ? "Modifiez votre ID de pari" : "Ajoutez un nouvel ID de pari"}
                              </DialogDescription>
                          </DialogHeader>
                          {betId ?
                              betId.CurrencyId === "XOF" ?
                              (
                                  <div className="space-y-4">
                                      <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
                                          <div className="flex items-center gap-2 mb-3">
                                              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                                              <h3 className="font-bold text-base">ID de pari trouvé</h3>
                                          </div>

                                          <div className="space-y-2 text-sm">
                                              <div className="flex items-center justify-between py-2 border-b border-border/50">
                                                  <span className="text-muted-foreground font-medium">ID de pari:</span>
                                                  <span className="font-bold">{betId.UserId}</span>
                                              </div>
                                              <div className="flex items-center justify-between py-2 border-b border-border/50">
                                                  <span className="text-muted-foreground font-medium">Nom d'utilisateur:</span>
                                                  <span className="font-bold">{betId.Name}</span>
                                              </div>
                                              <div className="flex items-center justify-between py-2">
                                                  <span className="text-muted-foreground font-medium">Devise:</span>
                                                  <Badge variant="default">{betId.CurrencyId}</Badge>
                                              </div>
                                          </div>
                                      </div>

                                      <div className="flex gap-3">
                                          <Button
                                              type="button"
                                              variant="default"
                                              className="flex-1"
                                              onClick={() => {
                                                  // Handle confirm action
                                                  toast.success("ID de pari confirmé!")
                                                  setBetId(null)
                                                  setIsAppIdDialogOpen(false)
                                              }}
                                          >
                                              Confirmer
                                          </Button>
                                          <Button
                                              type="button"
                                              variant="outline"
                                              className="flex-1"
                                              onClick={() => {
                                                  setBetId(null)
                                                  toast.error("Action annulée")
                                              }}
                                          >
                                              Annuler
                                          </Button>
                                      </div>
                                  </div>
                              ):(
                                  <div className="space-y-4">
                                      <div className="rounded-lg border-2 border-destructive/20 bg-destructive/5 p-4">
                                          <div className="flex items-start gap-3">
                                              <div className="p-2 rounded-full bg-destructive/10 shrink-0">
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                      <circle cx="12" cy="12" r="10"></circle>
                                                      <line x1="12" y1="8" x2="12" y2="12"></line>
                                                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                  </svg>
                                              </div>
                                              <div className="flex-1">
                                                  <h3 className="font-bold text-base mb-1">Devise non supportée</h3>
                                                  <p className="text-sm text-muted-foreground">
                                                      La devise <Badge variant="outline" className="mx-1">{betId.CurrencyId}</Badge> n'est pas prise en charge.
                                                      Seule la devise <Badge variant="default" className="mx-1">XOF</Badge> est acceptée.
                                                  </p>
                                              </div>
                                          </div>
                                      </div>

                                      <Button
                                          type="button"
                                          variant="outline"
                                          className="w-full"
                                          onClick={() => {
                                              setBetId(null)
                                              toast.error("Action annulée")
                                          }}
                                      >
                                          Annuler
                                      </Button>
                                  </div>
                              )
                              : (
                                <form onSubmit={appIdForm.handleSubmit(handleAppIdSubmit)} className="space-y-4">
                                  <div className="space-y-2">
                                      <Label htmlFor="app">Plateforme de pari</Label>
                                      <Select
                                          onValueChange={(value) => appIdForm.setValue("app", value)}
                                          defaultValue={editingAppId?.app_name?.toString()}
                                          disabled={isSubmitting}
                                      >
                                          <SelectTrigger>
                                              <SelectValue placeholder="Sélectionnez une plateforme" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {platforms.map((platform) => (
                                                  <SelectItem key={platform.id} value={platform.id.toString()}>
                                                      {platform.name}
                                                  </SelectItem>
                                              ))}
                                          </SelectContent>
                                      </Select>
                                      {appIdForm.formState.errors.app && (
                                          <p className="text-sm text-destructive">{appIdForm.formState.errors.app.message}</p>
                                      )}
                                  </div>

                                  <div className="space-y-2">
                                      <Label htmlFor="user_app_id">ID de pari</Label>
                                      <Input
                                          id="user_app_id"
                                          type="text"
                                          placeholder="Votre ID sur la plateforme"
                                          {...appIdForm.register("user_app_id")}
                                          disabled={isSubmitting}
                                      />
                                      {appIdForm.formState.errors.user_app_id && (
                                          <p className="text-sm text-destructive">{appIdForm.formState.errors.user_app_id.message}</p>
                                      )}
                                  </div>

                                  <div className="flex gap-3">
                                      <Button
                                          type="button"
                                          variant="outline"
                                          onClick={closeAppIdDialog}
                                          className="flex-1 bg-transparent"
                                      >
                                          Annuler
                                      </Button>
                                      <Button type="submit" disabled={isSubmitting} className="flex-1">
                                          {isSubmitting ? (
                                              <>
                                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                  Enregistrement...
                                              </>
                                          ) : editingAppId ? (
                                              "Modifier"
                                          ) : (
                                              "Ajouter"
                                          )}
                                      </Button>
                                  </div>
                              </form>
                              )}
                      </DialogContent>
                  </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  </div>
                </div>
              ) : userAppIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
                    <Smartphone className="h-12 w-12 sm:h-14 sm:w-14 text-primary" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold mb-1">Aucun ID enregistré</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Ajoutez votre premier ID pour commencer
                  </p>
                </div>
              ) : (
                  <div>
                      <div className="space-y-3 sm:hidden">
                          {userAppIds.map((appId, index) => (
                              <Card key={`appId-mobile-${appId.id}-${appId.app_name || 'unknown'}-${index}`} className="border-2 hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                      <div className="space-y-3">
                                          <div className="flex items-start gap-3">
                                              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                                  <Smartphone className="h-4 w-4 text-primary" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                  <p className="text-xs text-muted-foreground mb-1">ID de pari</p>
                                                  <p className="font-semibold text-sm truncate">{appId.user_app_id}</p>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-2 pl-11">
                                              <p className="text-xs text-muted-foreground">Plateforme:</p>
                                              <Badge variant="secondary" className="text-xs">
                                                  {platforms.find((p) => p.id === appId.app_name)?.name || "Inconnu"}
                                              </Badge>
                                          </div>
                                          <div className="flex justify-start gap-2 pt-3 border-t">
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => openEditAppIdDialog(appId)}
                                                  className="hover:bg-primary/10 hover:text-primary"
                                              >
                                                  <Edit className="h-4 w-4 mr-1.5" />
                                                  <span className="text-xs">Modifier</span>
                                              </Button>
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setDeleteTarget({ type: "appId", id: appId.id })}
                                                  className="hover:bg-destructive/10 hover:text-destructive"
                                              >
                                                  <Trash2 className="h-4 w-4 mr-1.5" />
                                                  <span className="text-xs">Supprimer</span>
                                              </Button>
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>
                          ))}
                      </div>
                      {userAppIds.length > 0 && (
                          <div className="hidden sm:block rounded-xl border-2 overflow-hidden shadow-sm">
                              <Table>
                                  <TableHeader>
                                      <TableRow className="bg-muted/50">
                                          <TableHead className="font-semibold">ID de pari</TableHead>
                                          <TableHead className="font-semibold">Plateforme</TableHead>
                                          <TableHead className="text-right font-semibold">Actions</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {userAppIds.map((appId, index) => (
                                          <TableRow key={`appId-table-${appId.id}-${appId.app_name || 'unknown'}-${index}`} className="hover:bg-muted/30">
                                              <TableCell className="font-semibold">{appId.user_app_id}</TableCell>
                                              <TableCell>
                                                  <Badge variant="secondary" className="font-medium">
                                                      {platforms.find((p) => p.id === appId.app_name)?.name || "Inconnu"}
                                                  </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                  <div className="flex justify-end gap-2">
                                                      <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          onClick={() => openEditAppIdDialog(appId)}
                                                          className="hover:bg-primary/10 hover:text-primary"
                                                      >
                                                          <Edit className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          onClick={() => setDeleteTarget({ type: "appId", id: appId.id })}
                                                          className="hover:bg-destructive/10 hover:text-destructive"
                                                      >
                                                          <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                  </div>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </div>
                      )}
                  </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement{" "}
              {deleteTarget?.type === "phone" ? "ce numéro" : "cet ID"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
