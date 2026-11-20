"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import { authApi, phoneApi } from "@/lib/api-client"
import type { UserPhone, Network } from "@/lib/types"
import { toast } from "react-hot-toast"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const COUNTRIES = [
    { code: "223", name: "Mali (+223)" },
    { code: "225", name: "Côte d'Ivoire (+225)" },
    { code: "226", name: "Burkina Faso (+226)" },
    { code: "221", name: "Sénégal (+221)" },
    { code: "229", name: "Bénin (+229)" },
]

const otpBrand = () =>
  typeof window !== "undefined" && window.location.hostname.includes("fastxof")
    ? "FastXOF"
    : "Melpay"

// Format phone number: remove non-digits, keep max 8
const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '').slice(0, 8)
}

// Helper to extract error messages from API responses
const getErrorMessage = (error: any): string => {
  if (error.response?.data) {
    const data = error.response.data
    if (typeof data === 'object') {
      if (typeof data.details === "string" && data.details) return data.details
      if (typeof data.error === "string" && data.error) return data.error
      const errors: string[] = []
      Object.values(data).forEach(value => {
        if (Array.isArray(value)) {
          errors.push(...value)
        } else if (typeof value === 'string') {
          errors.push(value)
        }
      })
      if (errors.length > 0) {
        return errors.join(' ')
      }
    }
    if (typeof data === 'string') {
      return data
    }
  }
  return "Erreur"
}

interface PhoneStepProps {
  selectedNetwork: Network | null
  selectedPhone: UserPhone | null
  onSelect: (phone: UserPhone) => void
  onNext: () => void
}

export function PhoneStep({ selectedNetwork, selectedPhone, onSelect }: PhoneStepProps) {
  const [phones, setPhones] = useState<UserPhone[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPhone, setEditingPhone] = useState<UserPhone | null>(null)
  const [newPhone, setNewPhone] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string>("223")
  const [selectedEditCountry, setSelectedEditCountry] = useState<string>("223")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletePhone, setDeletePhone] = useState<UserPhone | null>(null)
  const [otpStep, setOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [editOtpStep, setEditOtpStep] = useState(false)
  const [editOtpCode, setEditOtpCode] = useState("")

  useEffect(() => {
    if (selectedNetwork) {
      fetchPhones()
    }
  }, [selectedNetwork])

  const fetchPhones = async () => {
    if (!selectedNetwork) return
    
    setIsLoading(true)
    try {
      const data = await phoneApi.getAll()
      // Filter phones by selected network
      const networkPhones = data.filter(phone => phone.network === selectedNetwork.id)
      setPhones(networkPhones)
    } catch (error) {
      toast.error("Erreur lors du chargement des numéros de téléphone")
    } finally {
      setIsLoading(false)
    }
  }

  const resetAddDialog = () => {
    setNewPhone("")
    setOtpStep(false)
    setOtpCode("")
    setIsAddDialogOpen(false)
  }

  const resetEditDialog = () => {
    setNewPhone("")
    setEditingPhone(null)
    setEditOtpStep(false)
    setEditOtpCode("")
    setIsEditDialogOpen(false)
  }

  const handleAddPhone = async () => {
    if (!newPhone.trim() || !selectedNetwork) return

    const cleanedPhone = formatPhoneNumber(newPhone)

    if (!/^\d+$/.test(cleanedPhone) || cleanedPhone.length < 6 || cleanedPhone.length > 8) {
      toast.error("Veuillez entrer un numéro de téléphone valide (6 à 8 chiffres)")
      return
    }

    setIsSubmitting(true)
    try {
      if (!otpStep) {
        await authApi.sendPhoneOtp({
          phone: cleanedPhone,
          phone_indicative: selectedCountry,
          purpose: "user_phone",
          brand: otpBrand(),
        })
        setOtpStep(true)
        setOtpCode("")
        toast.success(`Code SMS envoyé au +${selectedCountry} ${cleanedPhone}`)
        return
      }

      if (otpCode.replace(/\D/g, "").length !== 6) {
        toast.error("Entrez le code à 6 chiffres reçu par SMS")
        return
      }

      const verifyResult = await authApi.verifyPhoneOtp({
        phone: cleanedPhone,
        phone_indicative: selectedCountry,
        code: otpCode.replace(/\D/g, ""),
        purpose: "user_phone",
      })
      const token = verifyResult.phone_verification_token
      if (!token) {
        toast.error("Vérification échouée. Réessayez.")
        return
      }

      const phone = selectedCountry + cleanedPhone
      const newPhoneData = await phoneApi.create(phone, selectedNetwork.id, token)
      setPhones(prev => [...prev, newPhoneData])
      resetAddDialog()
      toast.success("Numéro de téléphone ajouté avec succès")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPhone = async () => {
    if (!newPhone.trim() || !editingPhone || !selectedNetwork) return

    const cleanedPhone = formatPhoneNumber(newPhone)

    if (!/^\d+$/.test(cleanedPhone) || cleanedPhone.length < 6 || cleanedPhone.length > 8) {
      toast.error("Veuillez entrer un numéro de téléphone valide (6 à 8 chiffres)")
      return
    }

    const phone = selectedEditCountry + cleanedPhone
    const phoneChanged = String(editingPhone.phone) !== String(phone)

    setIsSubmitting(true)
    try {
      let token: string | undefined
      if (phoneChanged) {
        if (!editOtpStep) {
          await authApi.sendPhoneOtp({
            phone: cleanedPhone,
            phone_indicative: selectedEditCountry,
            purpose: "user_phone",
            brand: otpBrand(),
          })
          setEditOtpStep(true)
          setEditOtpCode("")
          toast.success(`Code SMS envoyé au +${selectedEditCountry} ${cleanedPhone}`)
          return
        }

        if (editOtpCode.replace(/\D/g, "").length !== 6) {
          toast.error("Entrez le code à 6 chiffres reçu par SMS")
          return
        }

        const verifyResult = await authApi.verifyPhoneOtp({
          phone: cleanedPhone,
          phone_indicative: selectedEditCountry,
          code: editOtpCode.replace(/\D/g, ""),
          purpose: "user_phone",
        })
        token = verifyResult.phone_verification_token
        if (!token) {
          toast.error("Vérification échouée. Réessayez.")
          return
        }
      }

      const updatedPhone = await phoneApi.update(
        editingPhone.id,
        phone,
        selectedNetwork.id,
        token,
      )
      setPhones(prev => prev.map(p =>
        p.id === editingPhone.id ? updatedPhone : p
      ))
      resetEditDialog()
      toast.success("Numéro de téléphone modifié avec succès")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (phone:UserPhone)=>{
      setDeletePhone(phone)
      setIsDeleteDialogOpen(true)
  }

  const handleDeletePhone = async () => {
    if (!deletePhone) return
    
    try {
        setIsDeleting(true)
      await phoneApi.delete(deletePhone.id)
        setIsDeleting(false)
      setPhones(prev => prev.filter(p => p.id !== deletePhone.id))
      if (selectedPhone?.id === deletePhone.id) {
        onSelect(null as any)
      }
      toast.success("Numéro de téléphone supprimé avec succès")
    } catch (error) {
      toast.error("Erreur lors de la suppression du numéro de téléphone")
    }
    setIsDeleteDialogOpen(false)
  }

  const openEditDialog = (phone: UserPhone) => {
    setEditingPhone(phone)
    const country = phone.phone.slice(0, 3)
    setSelectedEditCountry(COUNTRIES.some((c) => c.code === country) ? country : "223")
    setNewPhone(phone.phone.slice(3))
    setEditOtpStep(false)
    setEditOtpCode("")
    setIsEditDialogOpen(true)
  }

  if (!selectedNetwork) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Veuillez d'abord sélectionner un réseau</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Choisir un numéro de téléphone</CardTitle>
          <CardDescription>
            Sélectionnez ou ajoutez un numéro {selectedNetwork.public_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {phones.map((phone) => (
                <Card
                  key={phone.id}
                  className={`group cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedPhone?.id === phone.id
                      ? "ring-2 ring-primary bg-primary/5 shadow-md"
                      : "hover:bg-muted/50 hover:border-primary/50"
                  }`}
                  onClick={() => onSelect(phone)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                          +{phone.phone.slice(0,3)} {phone.phone.slice(3)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Ajouté le {new Date(phone.created_at).toLocaleDateString("fr-FR")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(phone)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(phone)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {phones.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium mb-2">Aucun numéro de téléphone trouvé</p>
                  <p className="text-sm text-muted-foreground/70 mb-6">
                    Ajoutez votre premier numéro {selectedNetwork.public_name} pour continuer
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un numéro
                  </Button>
                </div>
              )}

              {phones.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(true)}
                  className="w-full hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un autre numéro
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Phone Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            setNewPhone("")
            setOtpStep(false)
            setOtpCode("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un numéro de téléphone</DialogTitle>
            <DialogDescription>
              {otpStep
                ? "Entrez le code SMS reçu pour vérifier ce numéro"
                : "Sélectionnez votre pays et entrez votre numéro de téléphone"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="country">Pays</Label>
              <Select
                value={selectedCountry}
                onValueChange={(value) => {
                  setSelectedCountry(value)
                  setOtpStep(false)
                  setOtpCode("")
                }}
                disabled={otpStep}
              >
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                        {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                value={newPhone}
                onChange={(e) => {
                  setNewPhone(formatPhoneNumber(e.target.value))
                  setOtpStep(false)
                  setOtpCode("")
                }}
                placeholder={selectedNetwork?.placeholder ?? "Ex: 012345678"}
                maxLength={8}
                disabled={otpStep}
              />
              {selectedNetwork?.indication && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedNetwork.indication}
                </p>
              )}
            </div>
            {otpStep && (
              <div className="space-y-2">
                <Label htmlFor="otp">Code SMS (6 chiffres)</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={async () => {
                    const cleanedPhone = formatPhoneNumber(newPhone)
                    setIsSubmitting(true)
                    try {
                      await authApi.sendPhoneOtp({
                        phone: cleanedPhone,
                        phone_indicative: selectedCountry,
                        purpose: "user_phone",
                        brand: otpBrand(),
                      })
                      toast.success("Code SMS renvoyé")
                    } catch (error) {
                      toast.error(getErrorMessage(error))
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                >
                  Renvoyer le code
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetAddDialog}>
              Annuler
            </Button>
            <Button onClick={handleAddPhone} disabled={!newPhone.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {otpStep ? "Vérification..." : "Envoi..."}
                </>
              ) : otpStep ? (
                "Vérifier et ajouter"
              ) : (
                "Recevoir un code SMS"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phone Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) resetEditDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le numéro de téléphone</DialogTitle>
            <DialogDescription>
              {editOtpStep
                ? "Entrez le code SMS reçu pour vérifier ce numéro"
                : "Sélectionnez votre pays et modifiez votre numéro de téléphone"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCountry">Pays</Label>
              <Select
                value={selectedEditCountry}
                onValueChange={(value) => {
                  setSelectedEditCountry(value)
                  setEditOtpStep(false)
                  setEditOtpCode("")
                }}
                disabled={editOtpStep}
              >
                <SelectTrigger id="editCountry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                        {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editPhone">Numéro de téléphone</Label>
              <Input
                id="editPhone"
                value={newPhone}
                onChange={(e) => {
                  setNewPhone(formatPhoneNumber(e.target.value))
                  setEditOtpStep(false)
                  setEditOtpCode("")
                }}
                placeholder={selectedNetwork?.placeholder ?? "Ex: 0712345678"}
                maxLength={8}
                disabled={editOtpStep}
              />
              {selectedNetwork?.indication && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedNetwork.indication}
                </p>
              )}
            </div>
            {editOtpStep && (
              <div className="space-y-2">
                <Label htmlFor="editOtp">Code SMS (6 chiffres)</Label>
                <Input
                  id="editOtp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={editOtpCode}
                  onChange={(e) => setEditOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetEditDialog}>
              Annuler
            </Button>
            <Button onClick={handleEditPhone} disabled={!newPhone.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editOtpStep ? "Vérification..." : "Envoi..."}
                </>
              ) : editOtpStep ? (
                "Vérifier et modifier"
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {/*Delete Bet ID Dialog*/}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer le numéro de téléphone</AlertDialogTitle>
                    <AlertDialogDescription>Vous êtes sur le point de supprimer le numéro de téléphone {deletePhone?.phone?? "N/A"}.
                        Cette action est irréversible, êtes vous sûr de vouloir continuer ?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleDeletePhone} disabled={!deletePhone || isDeleting} className="bg-destructive hover:bg-destructive/90 text-white" >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Suppression...
                            </>
                        ) : (
                            "Supprimer"
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}
