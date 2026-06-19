"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Info, Copy, Phone, Receipt, Calendar, User,
  CheckCircle2, XCircle, Loader2, Bitcoin, Hash, Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { transactionApi, settingApi, networkApi } from "@/lib/api-client"
import type { Transaction, Network, Setting } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"

function TransactionDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [networks, setNetworks] = useState<Network[]>([])
  const [settings, setSettings] = useState<Setting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => { if (id) fetchData() }, [id])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let transactionData = null
      try {
        const cached = sessionStorage.getItem("cached_transaction")
        if (cached) {
          const parsed = JSON.parse(cached)
          if (String(parsed.id) === String(id) || String(parsed.reference) === String(id)) {
            transactionData = parsed
          }
        }
      } catch (e) {}

      if (!transactionData) {
        const response: any = await transactionApi.getHistory({ page: 1, page_size: 50 })
        transactionData = response.results?.find?.(
          (t: any) => String(t.id) === String(id) || String(t.reference) === String(id) || String(t.uid) === String(id)
        )
        if (transactionData) {
          sessionStorage.setItem("cached_transaction", JSON.stringify(transactionData))
        } else {
          throw new Error("Transaction non trouvée.")
        }
      }

      const [networksData, settingsData] = await Promise.all([
        networkApi.getAll(),
        settingApi.getSetting(),
      ])
      setTransaction(transactionData)
      setNetworks(networksData)
      setSettings(settingsData)
    } catch (err) {
      setError("Erreur lors du chargement de la transaction")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copié!")
  }

  if (!id) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 gap-4">
      <p className="text-destructive text-sm">ID de transaction manquant</p>
      <Button onClick={() => router.back()} size="sm">Retour</Button>
    </div>
  )

  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (error || !transaction) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 gap-4">
      <p className="text-destructive text-sm">{error || "Transaction non trouvée"}</p>
      <Button onClick={() => router.back()} size="sm">Retour</Button>
    </div>
  )

  const network = networks?.find((n) => n.id === transaction.network)
  const isCrypto = transaction.type_trans === "buy" || transaction.type_trans === "sale"

  const statusConfig = (() => {
    const s = transaction.status.toLowerCase()
    if (["accept", "completed", "success"].includes(s))
      return { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Accepté", message: "Transaction effectuée avec succès" }
    if (["error", "fail", "reject", "echec"].includes(s))
      return { icon: <XCircle className="h-5 w-5 text-destructive" />, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", label: "Échoué", message: "La transaction a échoué" }
    return { icon: <Info className="h-5 w-5 text-primary" />, color: "text-primary", bg: "bg-primary/10 border-primary/20", label: "En attente", message: "Transaction en cours de traitement" }
  })()

  const Row = ({ icon, label, value, copyValue, mono = false }: {
    icon: React.ReactNode; label: string; value: React.ReactNode; copyValue?: string; mono?: boolean
  }) => (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        {typeof value === "string"
          ? <p className={`text-sm font-semibold text-foreground truncate ${mono ? "font-mono text-xs break-all whitespace-normal" : ""}`}>{value}</p>
          : value}
      </div>
      {copyValue && (
        <button onClick={() => handleCopy(copyValue)} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1 text-center pr-9 truncate">
            Détails de la transaction
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Amount + status hero */}
        <div className="text-center py-2 space-y-1">
          <p className={`text-xs font-semibold uppercase tracking-widest ${statusConfig.color}`}>
            {statusConfig.label}
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
            {transaction.amount.toLocaleString()}
            <span className="text-xl font-bold text-muted-foreground ml-1">XOF</span>
          </h2>
        </div>

        {/* Status banner */}
        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${statusConfig.bg} animate-in zoom-in-95 duration-300`}>
          <div className="mt-0.5 shrink-0">{statusConfig.icon}</div>
          <div>
            <p className={`text-sm font-bold ${statusConfig.color} mb-0.5`}>Statut</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{statusConfig.message}</p>
          </div>
        </div>

        {/* Details card */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-4 pt-4 pb-1">
            <p className="text-sm font-bold text-foreground">Détails du paiement</p>
          </div>
          <div className="px-4 pb-4">
            {/* Type badge */}
            <div className="flex items-center gap-3 py-3 border-b border-border/50">
              <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold text-white ${
                isCrypto ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : transaction.type_trans === "deposit" ? "bg-emerald-600"
                  : "bg-blue-600"
              }`}>
                {isCrypto
                  ? (transaction.type_trans === "buy" ? "Achat Crypto" : "Vente Crypto")
                  : transaction.type_trans === "deposit" ? "Dépôt" : "Retrait"}
              </div>
            </div>

            {/* Crypto asset */}
            {isCrypto && transaction.crypto && (
              <Row
                icon={transaction.crypto.logo
                  ? <img src={transaction.crypto.logo} alt="" className="w-5 h-5 object-contain" />
                  : <Bitcoin className="h-4 w-4 text-amber-500" />}
                label="Actif Crypto"
                value={`${transaction.crypto.name} (${transaction.crypto.symbol})`}
              />
            )}

            {/* App */}
            {!isCrypto && (
              <Row
                icon={transaction.app_details?.image
                  ? <img src={transaction.app_details.image} alt="" className="w-5 h-5 object-contain" />
                  : <div className="w-5 h-5 bg-primary rounded flex items-center justify-center"><span className="text-primary-foreground text-[8px] font-bold">A</span></div>}
                label="Application"
                value={transaction.app_details?.name || transaction.app || "—"}
              />
            )}

            {/* Network */}
            <Row
              icon={network?.image
                ? <img src={network.image} alt="" className="w-5 h-5 object-contain" />
                : <Phone className="h-4 w-4 text-muted-foreground" />}
              label="Réseau"
              value={network?.public_name || "—"}
            />

            {/* Phone */}
            <Row
              icon={<Phone className="h-4 w-4 text-muted-foreground" />}
              label="Numéro"
              value={transaction.phone_number}
            />

            {/* Amount */}
            <Row
              icon={<span className="text-sm font-bold text-muted-foreground">₣</span>}
              label="Montant"
              value={`${transaction.amount.toLocaleString()} XOF`}
            />

            {/* Crypto quantity */}
            {isCrypto && transaction.total_crypto && transaction.crypto && (
              <Row
                icon={<Bitcoin className="h-4 w-4 text-amber-500" />}
                label="Quantité Crypto"
                value={`${transaction.total_crypto} ${transaction.crypto.symbol}`}
              />
            )}

            {/* Wallet */}
            {transaction.wallet_link && (
              <Row
                icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                label="Adresse Portefeuille"
                value={<p className="text-[11px] font-mono text-foreground break-all leading-snug">{transaction.wallet_link}</p>}
                copyValue={transaction.wallet_link}
              />
            )}

            {/* Hash */}
            {transaction.hash && (
              <Row
                icon={<Hash className="h-4 w-4 text-emerald-500" />}
                label="Hash Transaction"
                value={<p className="text-[11px] font-mono text-foreground break-all leading-snug">{transaction.hash}</p>}
                copyValue={transaction.hash}
              />
            )}

            {/* Withdrawal code */}
            {transaction.withdriwal_code && (
              <Row
                icon={<Receipt className="h-4 w-4 text-primary" />}
                label="Code de retrait"
                value={<p className="text-sm font-mono font-bold text-primary">{transaction.withdriwal_code}</p>}
                copyValue={transaction.withdriwal_code}
              />
            )}

            {/* Reference */}
            <Row
              icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
              label="Référence"
              value={<p className="text-xs font-mono text-foreground break-all">{transaction.reference}</p>}
              copyValue={transaction.reference}
            />

            {/* Date */}
            <Row
              icon={<Calendar className="h-4 w-4 text-primary" />}
              label="Date"
              value={formatDate(transaction.created_at)}
            />

            {/* App ID */}
            {!isCrypto && (
              <Row
                icon={<User className="h-4 w-4 text-primary" />}
                label={`${transaction.app_details?.name || "Application"} ID`}
                value={transaction.user_app_id || "—"}
              />
            )}

            {/* Error message */}
            {transaction.error_message && (
              <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-semibold text-destructive">⚠️ {transaction.error_message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Support */}
        <Button
          className="w-full h-12 rounded-2xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
          onClick={() => {
            const phone = settings?.whatsapp_phone || "2250544360901"
            const fmt = (d: string) => {
              const dt = new Date(d)
              return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`
            }
            const transType = isCrypto ? (transaction.type_trans === "buy" ? "achat crypto" : "vente crypto") : transaction.type_trans === "deposit" ? "dépôt" : "retrait"
            const userName = user ? `${user.first_name} ${user.last_name}` : "{Utilisateur}"
            const cryptoLine = isCrypto && transaction.crypto && transaction.total_crypto ? `\n*Crypto:* ${transaction.total_crypto} ${transaction.crypto.symbol}` : ""
            const walletLine = transaction.wallet_link ? `\n*Portefeuille:* ${transaction.wallet_link}` : ""
            const hashLine = transaction.hash ? `\n*Hash:* ${transaction.hash}` : ""
            const appIdLine = !isCrypto ? `\n*ID App:* ${transaction.user_app_id}` : ""
            const msg = `Bonjour moi c'est ${userName}, j'ai besoin d'aide concernant mon ${transType}.\n*Référence:* ${transaction.reference}\n*Montant:* XOF ${transaction.amount.toLocaleString()}\n*Date:* ${fmt(transaction.created_at)}\n*Réseau:* ${network?.public_name || "N/A"}\n*Téléphone:* ${transaction.phone_number}${cryptoLine}${walletLine}${hashLine}${appIdLine}\nLa capture du ${transType}`
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank")
          }}
        >
          <Phone className="h-4 w-4 mr-2" />
          Contacter le support
        </Button>

        <div className="flex justify-center pb-4">
          <button
            onClick={() => router.push("/dashboard/history")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            Voir l&apos;historique complet
          </button>
        </div>
      </main>
    </div>
  )
}

export default function TransactionDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <TransactionDetailContent />
    </Suspense>
  )
}
