"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import CryptoTransactionForm from "@/components/crypto/CryptoTransactionForm"

interface Cryptocurrency {
  id: number
  public_amount: number
  logo: string
  code: string
  name: string
  amount: string
  symbol: string
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

// Endpoints from backend urls.py
const CRYPTO_LIST_API    = "/mobcash/crypto/v2"        // GET ?type_trans=buy|sale
const CRYPTO_NETWORK_API = "/mobcash/crypto-network/"  // GET ?crypto_id=<id>&is_active=true
const PAYMENT_NETWORK_API = "/mobcash/network"         // GET

interface Props {
  mode: "buy" | "sale"
  title: string
}

export default function CryptoSelectionGrid({ mode, title }: Props) {
  const router = useRouter()
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [cryptoNetworks, setCryptoNetworks] = useState<CryptoNetwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCrypto, setSelectedCrypto] = useState<Cryptocurrency | null>(null)
  const [selectedCryptoNetwork, setSelectedCryptoNetwork] = useState<CryptoNetwork | null>(null)
  const [step, setStep] = useState<"crypto" | "crypto-network" | "details">("crypto")

  useEffect(() => {
    const fetchCryptos = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get(CRYPTO_LIST_API, { params: { type_trans: mode } })
        const data = response.data
        setCryptos(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [])
      } catch {
        setError("Impossible de charger les cryptomonnaies")
      } finally {
        setLoading(false)
      }
    }
    fetchCryptos()
  }, [mode])

  useEffect(() => {
    api
      .get(PAYMENT_NETWORK_API)
      .then((res) => {
        const data = res.data
        if (Array.isArray(data)) setNetworks(data)
        else if (Array.isArray(data.results)) setNetworks(data.results)
      })
      .catch(() => {})
  }, [])

  const handleCryptoSelect = async (crypto: Cryptocurrency) => {
    const token = localStorage.getItem("access_token")
    if (!token) { router.push("/login"); return }
    setSelectedCrypto(crypto)
    setLoading(true)
    try {
      const response = await api.get(CRYPTO_NETWORK_API, {
        params: { crypto_id: crypto.id, is_active: "true" },
      })
      const data = response.data
      const all = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []
      setCryptoNetworks(all)
      setStep("crypto-network")
    } catch {
      setError("Impossible de charger les réseaux.")
    } finally {
      setLoading(false)
    }
  }

  const handleCryptoNetworkSelect = (network: CryptoNetwork) => {
    setSelectedCryptoNetwork(network)
    setStep("details")
  }

  const handleBack = () => {
    if (step === "details") {
      setStep("crypto-network")
      setSelectedCryptoNetwork(null)
    } else if (step === "crypto-network") {
      setStep("crypto")
      setSelectedCrypto(null)
      setCryptoNetworks([])
    } else {
      router.back()
    }
  }

  if (step === "details" && selectedCrypto && selectedCryptoNetwork) {
    return (
      <CryptoTransactionForm
        isVerified={true}
        crypto={selectedCrypto}
        typeTrans={mode}
        selectedCryptoNetwork={selectedCryptoNetwork}
        paymentNetworks={networks}
        onBack={handleBack}
      />
    )
  }

  if (step === "crypto-network" && selectedCrypto) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Réseau Blockchain</h1>
        </div>
        <p className="text-muted-foreground">2. Sélectionnez votre réseau blockchain</p>
        <div className="space-y-3">
          {cryptoNetworks.length > 0 ? (
            cryptoNetworks.map((network) => (
              <div
                key={network.id}
                onClick={() => handleCryptoNetworkSelect(network)}
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all hover:border-primary"
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
              <button onClick={handleBack} className="block mt-3 text-primary font-medium mx-auto">Retour</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
      </div>
      <p className="text-muted-foreground">1. Sélectionnez votre cryptomonnaie</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cryptos.map((crypto) => (
            <div
              key={crypto.id}
              onClick={() => handleCryptoSelect(crypto)}
              className="border border-border rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all bg-background shadow-sm hover:shadow-md"
            >
              <div className="w-12 h-12 mb-3">
                <img
                  src={crypto.logo}
                  alt={crypto.name}
                  className="w-full h-full object-contain rounded-full bg-black dark:bg-muted p-1"
                />
              </div>
              <h3 className="font-semibold mb-1 text-center">{crypto.name}</h3>
              <p className="text-xs text-muted-foreground mb-1">{crypto.symbol}</p>
              <p className="font-bold text-primary text-sm">
                {parseInt(String((mode === "buy" ? crypto.buy_price : crypto.sale_price) || 0)).toLocaleString()} XOF
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


interface Props {
  mode: "buy" | "sale"
  title: string
}

