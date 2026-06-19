"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import CryptoTransactionForm from "@/components/crypto/CryptoTransactionForm"

interface Crypto {
  id: number
  public_amount: number
  logo: string
  code: string
  name: string
  amount: string
  symbol: string
  sale_adress?: string
  buy_price?: number | string
  sale_price?: number | string
}

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

const CHECK_USER_STATUS_API = `${process.env.NEXT_PUBLIC_BASE_URL}auth/check-user-account-status`
const UPLOAD_API = `${process.env.NEXT_PUBLIC_BASE_URL}blaffa/upload/file`
const CRYPTO_API_PATH = "/blaffa/crypto"
const NETWORK_API = "/mobcash/network"
const CRYPTO_NETWORK_API = "/betpay/crypto-network/"

export default function CryptoDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [userVerified, setUserVerified] = useState<boolean | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [userImage, setUserImage] = useState<File | null>(null)
  const [cardImage, setCardImage] = useState<File | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null)
  const [showTypeModal, setShowTypeModal] = useState(true)
  const [typeTrans, setTypeTrans] = useState<string | null>(null)
  const [cryptoNetworks, setCryptoNetworks] = useState<CryptoNetwork[]>([])
  const [selectedCryptoNetwork, setSelectedCryptoNetwork] = useState<CryptoNetwork | null>(null)
  const [paymentNetworks, setPaymentNetworks] = useState<Network[]>([])
  const [networkStep, setNetworkStep] = useState<"crypto" | "crypto-network" | "details">("crypto")

  useEffect(() => {
    if (!user) return
    setUserId(user.id?.toString() || "")
  }, [user])

  useEffect(() => {
    const fetchCryptos = async () => {
      if (!typeTrans) return
      setLoading(true)
      setError(null)
      try {
        const response = await api.get(CRYPTO_API_PATH + `?type_trans=${typeTrans}`)
        setCryptos(Array.isArray(response.data.results) ? response.data.results : [])
      } catch {
        setError("Impossible de charger les cryptomonnaies")
      } finally {
        setLoading(false)
      }
    }
    fetchCryptos()

    api.get(NETWORK_API)
      .then((res) => {
        const data = res.data
        if (Array.isArray(data)) setPaymentNetworks(data)
        else if (Array.isArray(data.results)) setPaymentNetworks(data.results)
      })
      .catch(() => {})
  }, [typeTrans])

  useEffect(() => {
    if (!userId) return
    let isMounted = true
    const checkStatus = async () => {
      setStatusLoading(true)
      try {
        const token = localStorage.getItem("access_token")
        const response = await fetch(CHECK_USER_STATUS_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ user_id: userId }),
        })
        const data = await response.json()
        const verified = data.is_verified ?? data.is_verify ?? false
        if (isMounted) setUserVerified(!!verified)
      } catch {
        if (isMounted) setUserVerified(false)
      } finally {
        if (isMounted) setStatusLoading(false)
      }
    }
    checkStatus()
    return () => { isMounted = false }
  }, [userId])

  const handleCryptoSelect = async (crypto: Crypto) => {
    if (!userVerified) { setShowVerifyModal(true); return }
    setSelectedCrypto(crypto)
    setLoading(true)
    try {
      const response = await api.get(CRYPTO_NETWORK_API)
      const all = Array.isArray(response.data.results)
        ? response.data.results
        : Array.isArray(response.data) ? response.data : []
      const filtered = all.filter((n: CryptoNetwork) => n.crypto?.id === crypto.id && n.is_active)
      setCryptoNetworks(filtered)
      setNetworkStep("crypto-network")
    } catch {
      setError("Impossible de charger les réseaux.")
    } finally {
      setLoading(false)
    }
  }

  const handleCryptoNetworkSelect = (network: CryptoNetwork) => {
    setSelectedCryptoNetwork(network)
    setNetworkStep("details")
  }

  const handleFormBack = () => {
    if (networkStep === "details") {
      setNetworkStep("crypto-network")
      setSelectedCryptoNetwork(null)
    } else if (networkStep === "crypto-network") {
      setNetworkStep("crypto")
      setSelectedCrypto(null)
      setCryptoNetworks([])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setUploadError(null)
    if (!userImage || !cardImage) {
      setUploadError("Veuillez sélectionner les deux images.")
      setUploading(false)
      return
    }
    try {
      const formData = new FormData()
      formData.append("file", userImage)
      formData.append("image", cardImage)
      const token = localStorage.getItem("access_token")
      const response = await fetch(UPLOAD_API, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      })
      if (!response.ok) throw new Error("Upload failed")
      setShowVerifyModal(false)
      setSuccessMessage("Images envoyées. Veuillez attendre la vérification de l'admin.")
      setShowSuccessModal(true)
    } catch {
      setUploadError("Échec de l'envoi. Réessayez.")
    } finally {
      setUploading(false)
    }
  }

  const renderStatusBadge = () => {
    if (statusLoading) return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Vérification...</span>
    if (userVerified === true) return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3" /> Vérifié</span>
    return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><AlertTriangle className="h-3 w-3" /> Non vérifié</span>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-muted shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Cryptomonnaies</h1>
        </div>
        {renderStatusBadge()}
      </div>

      {/* Buy/Sell selection modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-background rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-4">
            <h2 className="text-xl font-bold text-center">Choisir le type de transaction</h2>
            <Button
              className="w-full text-lg font-semibold bg-green-600 hover:bg-green-700"
              onClick={() => { setTypeTrans("buy"); setShowTypeModal(false) }}
            >
              Acheter des Cryptos
            </Button>
            <Button
              className="w-full text-lg font-semibold bg-yellow-500 hover:bg-yellow-600"
              onClick={() => { setTypeTrans("sale"); setShowTypeModal(false) }}
            >
              Vendre des Cryptos
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      {typeTrans && !showTypeModal && (
        <>
          {networkStep === "details" && selectedCrypto && selectedCryptoNetwork ? (
            <CryptoTransactionForm
              isVerified={userVerified === true}
              crypto={selectedCrypto}
              typeTrans={typeTrans as "buy" | "sale"}
              selectedCryptoNetwork={selectedCryptoNetwork}
              paymentNetworks={paymentNetworks}
              onBack={handleFormBack}
            />
          ) : networkStep === "crypto-network" && selectedCrypto ? (
            <div className="space-y-4">
              <button
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                onClick={handleFormBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux cryptos
              </button>
              <h2 className="text-xl font-bold">2. Sélectionnez le réseau blockchain</h2>
              <div className="space-y-3">
                {cryptoNetworks.length > 0 ? (
                  cryptoNetworks.map((network) => (
                    <div
                      key={network.id}
                      onClick={() => handleCryptoNetworkSelect(network)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 flex-shrink-0">
                        {network.logo ? (
                          <img src={network.logo} alt={network.name} className="w-full h-full object-contain rounded-md" />
                        ) : (
                          <div className="w-full h-full bg-muted rounded-md flex items-center justify-center text-xs font-bold">{network.symbol}</div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold">{network.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{network.symbol}</span>
                          {network.fee && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                              Frais: {network.fee}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center rounded-xl border border-dashed border-border text-muted-foreground">
                    Aucun réseau disponible pour cette crypto.
                  </div>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">1. Sélectionnez votre cryptomonnaie</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cryptos.map((crypto) => (
                  <div
                    key={crypto.id}
                    onClick={() => handleCryptoSelect(crypto)}
                    className="border border-border rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all bg-background shadow-sm hover:shadow-md group"
                  >
                    <div className="w-12 h-12 relative mb-3">
                      <img
                        src={crypto.logo}
                        alt={crypto.name}
                        className="w-full h-full object-contain rounded-full bg-black dark:bg-muted p-1"
                      />
                    </div>
                    <h3 className="font-semibold mb-1 text-center">{crypto.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{crypto.symbol}</p>
                    <p className="font-bold text-primary text-sm">
                      {parseInt(String((typeTrans === "buy" ? crypto.buy_price : crypto.sale_price) || 0)).toLocaleString()} XOF
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Verification Modal */}
      {showVerifyModal && !userVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center">Vérification du compte requise</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-semibold">Votre photo (visage)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUserImage(e.target.files?.[0] || null)}
                  className="w-full text-sm border rounded-lg p-2 bg-background"
                />
                {userImage && (
                  <img src={URL.createObjectURL(userImage)} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded shadow mx-auto block" />
                )}
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold">Photo de votre pièce d&apos;identité</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCardImage(e.target.files?.[0] || null)}
                  className="w-full text-sm border rounded-lg p-2 bg-background"
                />
                {cardImage && (
                  <img src={URL.createObjectURL(cardImage)} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded shadow mx-auto block" />
                )}
              </div>
              {uploadError && <p className="text-red-600 text-sm text-center">{uploadError}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowVerifyModal(false)} disabled={uploading}>
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={uploading}>
                  {uploading ? "Envoi..." : "Envoyer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-background rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-3 text-green-600">Succès</h2>
            <p className="text-muted-foreground mb-6">{successMessage}</p>
            <Button onClick={() => setShowSuccessModal(false)} className="w-full">Fermer</Button>
          </div>
        </div>
      )}
    </div>
  )
}

