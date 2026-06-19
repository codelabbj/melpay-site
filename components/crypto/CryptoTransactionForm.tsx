"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Phone, Trash, CheckCircle, Plus, Copy, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"
import api from "@/lib/api"

const BUY_ENDPOINT  = "/mobcash/buy-crypto/v2"    // POST — buy crypto at fixed price
const SALE_ENDPOINT = "/mobcash/sale-crypto/v2"   // POST — sell crypto at fixed price
const PHONE_API     = "/mobcash/user-phone/"      // GET ?network=<id> / POST / DELETE <id>/
const QR_API        = "/mobcash/crypto-network-qrcode" // GET ?network_id=<id>

interface CryptoNetwork {
  id: number
  name: string
  symbol: string
  logo: string
  is_active: boolean
  address?: string
  fee?: string | number
  crypto: { id: number; name: string }
}

interface Network {
  id: string
  name: string
  public_name: string
  country_code?: string
  indication?: string
  image?: string
}

interface UserPhone {
  id: string
  phone: string
  network: number
  network_name?: string
}

interface Cryptocurrency {
  id: number
  name: string
  symbol: string
  public_amount: number
  logo?: string
  sale_adress?: string
  buy_price?: number | string
  sale_price?: number | string
}

interface Props {
  isVerified: boolean
  crypto: Cryptocurrency
  typeTrans: "buy" | "sale"
  selectedCryptoNetwork: CryptoNetwork
  paymentNetworks: Network[]
  onBack: () => void
}

export default function CryptoTransactionForm({
  isVerified,
  crypto,
  typeTrans,
  selectedCryptoNetwork,
  paymentNetworks,
  onBack,
}: Props) {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [quantity, setQuantity] = useState("")
  const [walletLink, setWalletLink] = useState("")
  const [confirmWalletLink, setConfirmWalletLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hash, setHash] = useState("")
  const [view, setView] = useState<"form" | "sale_confirm" | "buy_confirm">("form")
  const [selectedPaymentNetwork, setSelectedPaymentNetwork] = useState<Network | null>(null)
  const [qrCodeData, setQrCodeData] = useState<{ qr_code_base64: string; address: string } | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [internalStep, setInternalStep] = useState<"details" | "payment_network" | "phone" | "amounts">(
    typeTrans === "sale" ? "payment_network" : "details"
  )
  const [userPhones, setUserPhones] = useState<UserPhone[]>([])
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState("")
  const [showAddPhone, setShowAddPhone] = useState(false)

  const getCountryFlag = (indication?: string) => {
    if (!indication) return "🇧🇫"
    const c = indication.replace("+", "")
    const flags: Record<string, string> = {
      "226": "🇧🇫", "225": "🇨🇮", "223": "🇲🇱", "221": "🇸🇳",
      "228": "🇹🇬", "229": "🇧🇯", "237": "🇨🇲", "224": "🇬🇳",
      "241": "🇬🇦", "242": "🇨🇬", "243": "🇨🇩", "227": "🇳🇪",
      "233": "🇬🇭", "234": "🇳🇬",
    }
    return flags[c] || "🌍"
  }

  const getPrice = () => {
    const p = typeTrans === "buy" ? crypto.buy_price : crypto.sale_price
    return Number(p || crypto.public_amount || 0)
  }

  const handleQuantityChange = (q: string) => {
    setQuantity(q)
    const price = getPrice()
    if (!q || isNaN(Number(q)) || price <= 0) { setAmount(""); return }
    setAmount((Number(q) * price).toFixed(0))
  }

  const handleAmountChange = (a: string) => {
    setAmount(a)
    const price = getPrice()
    if (!a || isNaN(Number(a)) || price <= 0) { setQuantity(""); return }
    setQuantity((Number(a) / price).toFixed(6))
  }

  const fetchUserPhones = async (networkId: string) => {
    setPhoneLoading(true)
    try {
      const res = await api.get(PHONE_API, { params: { network: networkId } })
      setUserPhones(Array.isArray(res.data) ? res.data : [])
    } catch { setUserPhones([]) }
    finally { setPhoneLoading(false) }
  }

  const handleAddPhone = async () => {
    if (!selectedPaymentNetwork || !newPhoneNumber.trim()) return
    setError("")
    try {
      const indication = selectedPaymentNetwork.indication || ""
      const formattedPhone = newPhoneNumber.startsWith("+")
        ? newPhoneNumber
        : `${indication}${newPhoneNumber}`
      const res = await api.post(PHONE_API, {
        phone: formattedPhone,
        network: selectedPaymentNetwork.id,
      })
      if (res.status === 201) {
        setUserPhones((prev) => [...prev, res.data])
        setNewPhoneNumber("")
        setShowAddPhone(false)
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Erreur lors de l'ajout du numéro.")
    }
  }

  const handleDeletePhone = async (phoneId: string) => {
    try {
      await api.delete(`${PHONE_API}${phoneId}/`)
      setUserPhones((prev) => prev.filter((p) => p.id !== phoneId))
      if (selectedPhone?.id === phoneId) setSelectedPhone(null)
    } catch { /* ignore */ }
  }

  const formatPhone = (phone: string) => {
    if (!selectedPaymentNetwork?.indication) return phone
    if (phone.startsWith("+") || phone.startsWith(selectedPaymentNetwork.indication)) return phone
    return `${selectedPaymentNetwork.indication}${phone}`
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copié!")
  }

  const handleContinue = async () => {
    setError("")
    if (internalStep === "details") {
      if (typeTrans === "buy") {
        if (!walletLink || !confirmWalletLink || walletLink !== confirmWalletLink) {
          setError("Les adresses de portefeuille ne correspondent pas.")
          return
        }
      }
      setInternalStep("payment_network")
      return
    }
    if (internalStep === "payment_network") {
      if (!selectedPaymentNetwork) {
        setError("Veuillez sélectionner un réseau de paiement.")
        return
      }
      await fetchUserPhones(selectedPaymentNetwork.id)
      setInternalStep("phone")
      return
    }
    if (internalStep === "phone") {
      if (!selectedPhone) {
        setError("Veuillez sélectionner un numéro de téléphone.")
        return
      }
      setInternalStep("amounts")
      return
    }
    if (internalStep === "amounts") {
      if (!quantity || !amount || Number(amount) <= 0) {
        setError("Veuillez entrer une quantité et un montant valides.")
        return
      }
      if (typeTrans === "sale") { setView("sale_confirm"); return }
      if (typeTrans === "buy") { setView("buy_confirm"); return }
    }
  }

  const formatBackendError = (err: any): string => {
    const data = err?.response?.data
    if (!data) return err?.message || "Une erreur est survenue."
    if (typeof data === "string") return data
    if (typeof data === "object") {
      // Collect all messages, stripping technical field prefixes for common fields
      const skipPrefix = new Set(["detail", "non_field_errors", "amount", "total_crypto"])
      return Object.entries(data)
        .map(([key, val]) => {
          const msg = Array.isArray(val) ? val.join(", ") : String(val)
          return skipPrefix.has(key) ? msg : `${key}: ${msg}`
        })
        .join(" | ")
    }
    return "Une erreur est survenue."
  }

  const submitBuy = async () => {
    if (!selectedPaymentNetwork || !selectedPhone) return
    setLoading(true)
    try {
      const payload = {
        total_crypto: quantity,
        crypto_id: String(crypto.id),
        network_id: selectedPaymentNetwork.id,   // ← payment network UUID
        phone_number: selectedPhone.phone.replace(/\s+/g, ""),
        wallet_link: walletLink,
        source: "web",
      }
      const response = await api.post(BUY_ENDPOINT, payload)
      const data = response.data
      if (data?.transaction_link) window.open(data.transaction_link, "_blank")
      toast.success("Achat initié avec succès!")
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch (err: any) {
      setError(formatBackendError(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchQRCode = async (networkId: number | string) => {
    setQrLoading(true)
    try {
      const response = await api.get(QR_API, {
        params: { network_id: String(networkId) },
      })
      // Only set if we actually got a base64 image back
      if (response.data?.qr_code_base64) {
        setQrCodeData(response.data)
      }
      // If qr_code_base64 is null (library not installed fallback), qrCodeData stays null
      // and the address-only fallback UI will render instead
    } catch {
      // 501 or any other error — address fallback will render
    } finally {
      setQrLoading(false)
    }
  }

  useEffect(() => {
    if (view === "sale_confirm" && selectedCryptoNetwork?.id) {
      fetchQRCode(selectedCryptoNetwork.id)
    }
  }, [view, selectedCryptoNetwork?.id])

  const handleHashSubmit = async () => {
    if (!selectedPaymentNetwork || !selectedPhone) return
    setLoading(true)
    setError("")
    try {
      const payload = {
        total_crypto: quantity,
        crypto_id: String(crypto.id),
        network_id: selectedPaymentNetwork.id,   // ← payment network UUID
        phone_number: selectedPhone.phone.replace(/\s+/g, ""),
        hash,
        source: "web",
      }
      const response = await api.post(SALE_ENDPOINT, payload)
      const data = response.data
      if (data?.transaction_link) window.open(data.transaction_link, "_blank")
      toast.success("Vente initiée avec succès!")
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch (err: any) {
      setError(formatBackendError(err))
    } finally {
      setLoading(false)
    }
  }

  if (!isVerified) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl text-sm text-center">
        Veuillez vérifier votre compte pour acheter ou vendre des cryptos.
      </div>
    )
  }

  // ── SALE CONFIRMATION VIEW ──
  if (view === "sale_confirm") {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView("form")} className="rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Confirmation de l&apos;envoi</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Envoyez vos cryptos à l&apos;adresse ci-dessous ({selectedCryptoNetwork.name}).
        </p>

        {qrLoading ? (
          <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-2xl">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">Chargement du QR Code...</p>
          </div>
        ) : qrCodeData ? (
          <div className="flex flex-col items-center gap-4 p-6 bg-background rounded-3xl border border-border shadow-sm">
            <div className="bg-white p-3 rounded-2xl shadow-inner">
              <img src={qrCodeData.qr_code_base64} alt="QR Code" className="w-48 h-48 object-contain" />
            </div>
            <div className="w-full">
              <p className="text-xs font-bold mb-2">Adresse {selectedCryptoNetwork.name} :</p>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                <span className="flex-1 font-mono text-xs break-all">{qrCodeData.address}</span>
                <button onClick={() => handleCopy(qrCodeData.address)} className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30">
            <span className="flex-1 font-mono text-sm break-all">
              {selectedCryptoNetwork.address || "Adresse non disponible"}
            </span>
            <button onClick={() => handleCopy(selectedCryptoNetwork.address || "")} className="p-2 rounded-lg bg-primary/10 text-primary">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="p-4 rounded-xl flex items-start gap-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
            Nous devons recevoir exactement <strong>{quantity} {crypto.symbol || "USDT"}</strong> pour que vous receviez <strong>{amount} XOF</strong>
          </p>
        </div>

        <div className="p-3 rounded-xl flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
          <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Copiez le hash de la transaction et collez-le ci-dessous.
          </p>
        </div>

        <div className="p-4 rounded-xl border-2 border-green-500 bg-background">
          <input
            type="text"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="0x..."
            className="w-full bg-transparent outline-none text-base placeholder:text-muted-foreground"
          />
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}
        <Button onClick={handleHashSubmit} disabled={loading || !hash} className="w-full h-12 text-lg font-bold">
          {loading ? "Traitement..." : "Valider"}
        </Button>
      </div>
    )
  }

  // ── BUY CONFIRMATION VIEW ──
  if (view === "buy_confirm") {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView("form")} className="rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Confirmation de l&apos;achat</h1>
        </div>

        <div className="p-6 rounded-3xl bg-muted/30 border border-border space-y-4">
          {[
            { label: "Vous payez", value: `${amount} XOF` },
            { label: "Vous recevez", value: `${quantity} ${crypto.symbol}` },
            { label: "Réseau Crypto", value: selectedCryptoNetwork.name },
            { label: "Mode de paiement", value: selectedPaymentNetwork?.public_name },
            { label: "Numéro", value: selectedPhone?.phone },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center pb-3 border-b border-border last:border-0 last:pb-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-2 pt-1">
            <span className="text-sm text-muted-foreground">Adresse de réception</span>
            <span className="text-xs font-mono break-all p-3 rounded-lg bg-primary/5 text-primary border border-primary/10">
              {walletLink}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl flex items-start gap-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
          <Info className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-900 dark:text-orange-300">
            Vérifiez bien l&apos;adresse. Les transactions sur {selectedCryptoNetwork.name} sont définitives.
          </p>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>}
        <Button onClick={submitBuy} disabled={loading} className="w-full h-12 text-lg font-bold">
          {loading ? "Traitement..." : "Confirmer l'achat"}
        </Button>
      </div>
    )
  }

  // ── MAIN FORM STEPS ──
  const stepBack = () => {
    if (internalStep === "details") onBack()
    else if (internalStep === "payment_network") {
      if (typeTrans === "sale") onBack()
      else setInternalStep("details")
    } else if (internalStep === "phone") setInternalStep("payment_network")
    else if (internalStep === "amounts") setInternalStep("phone")
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        onClick={stepBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="font-medium">Retour</span>
      </button>

      {/* STEP: Wallet details */}
      {internalStep === "details" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">3. Informations du portefeuille</h2>
          {typeTrans === "buy" ? (
            <>
              <div className="p-4 rounded-xl border border-primary/30 bg-background">
                <label className="block mb-2 text-sm text-muted-foreground">
                  Adresse du portefeuille ({selectedCryptoNetwork.name})
                </label>
                <input
                  type="text"
                  value={walletLink}
                  onChange={(e) => setWalletLink(e.target.value)}
                  placeholder="Entrez l'adresse du portefeuille"
                  className="w-full bg-transparent outline-none text-base placeholder:text-muted-foreground"
                />
              </div>
              <div className="p-4 rounded-xl border border-border bg-background">
                <input
                  type="text"
                  value={confirmWalletLink}
                  onChange={(e) => setConfirmWalletLink(e.target.value)}
                  placeholder="Confirmer l'adresse du portefeuille"
                  className="w-full bg-transparent outline-none text-base placeholder:text-muted-foreground"
                />
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-sm text-orange-800">
                <Info className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                Vérifiez bien votre adresse. Les transactions crypto sont irréversibles.
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Vous allez vendre <strong>{crypto.name} ({crypto.symbol})</strong> sur le réseau{" "}
              <strong>{selectedCryptoNetwork.name}</strong>. Continuez pour indiquer le réseau de paiement.
            </p>
          )}
        </div>
      )}

      {/* STEP: Payment network */}
      {internalStep === "payment_network" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">4. Réseau de paiement</h3>
          <div className="space-y-3">
            {paymentNetworks.map((net) => (
              <div
                key={net.id}
                onClick={() => {
                  setSelectedPaymentNetwork(net)
                  fetchUserPhones(net.id)
                  setInternalStep("phone")
                }}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                  ${selectedPaymentNetwork?.id === net.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50 hover:border-primary/50"}`}
              >
                <div className="w-12 h-12 flex-shrink-0">
                  {net.image ? (
                    <img src={net.image} alt={net.name} className="w-full h-full object-contain rounded-md" />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-md flex items-center justify-center text-xs font-bold">
                      {net.name.substring(0, 2)}
                    </div>
                  )}
                </div>
                <span className="text-base font-medium">{net.public_name || net.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP: Phone */}
      {internalStep === "phone" && selectedPaymentNetwork && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">
            5. Numéro {selectedPaymentNetwork.public_name || selectedPaymentNetwork.name}
          </h3>
          {phoneLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {userPhones.map((phone) => (
                  <div
                    key={phone.id}
                    onClick={() => setSelectedPhone(phone)}
                    className={`flex items-center justify-between border rounded-2xl px-4 py-4 cursor-pointer transition-all
                      ${selectedPhone?.id === phone.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-base font-medium">{formatPhone(phone.phone)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPhone?.id === phone.id && <CheckCircle className="h-5 w-5 text-primary" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePhone(phone.id) }}
                        className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {showAddPhone ? (
                <div className="p-4 rounded-2xl border border-border bg-muted/30">
                  <p className="text-sm font-medium mb-3">
                    Ajouter un numéro {selectedPaymentNetwork.public_name}
                  </p>
                  <div className="flex gap-3 mb-3">
                    <div className="flex items-center gap-2 px-3 rounded-xl border border-border bg-background">
                      <span className="text-lg">{getCountryFlag(selectedPaymentNetwork.indication)}</span>
                      <span className="font-bold text-sm">{selectedPaymentNetwork.indication || "+225"}</span>
                    </div>
                    <input
                      type="tel"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      placeholder="Numéro de téléphone"
                      className="flex-1 px-4 py-3 rounded-xl border border-border outline-none bg-background text-foreground"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowAddPhone(false)}>
                      Annuler
                    </Button>
                    <Button className="flex-1" onClick={handleAddPhone}>
                      Ajouter
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setShowAddPhone(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un numéro
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP: Amounts */}
      {internalStep === "amounts" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">6. Montant</h3>
          <div className="p-4 rounded-xl border border-border bg-background space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Quantité ({crypto.symbol})</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="Ex: 0.001"
                className="w-full bg-transparent outline-none text-xl font-bold placeholder:text-muted-foreground"
              />
            </div>
            <div className="h-px bg-border" />
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Montant (XOF)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Ex: 5000"
                className="w-full bg-transparent outline-none text-xl font-bold placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-muted/30 border border-border text-sm text-muted-foreground">
            Taux: <strong>1 {crypto.symbol} = {getPrice().toLocaleString()} XOF</strong>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">{error}</div>
      )}

      {(internalStep === "details" || internalStep === "phone" || internalStep === "amounts") && (
        <Button
          onClick={handleContinue}
          disabled={internalStep === "phone" && !selectedPhone}
          className="w-full h-12 text-base font-bold"
        >
          Continuer
        </Button>
      )}
    </div>
  )
}

