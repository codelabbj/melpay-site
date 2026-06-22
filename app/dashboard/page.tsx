"use client"

import { useState, useEffect, useRef} from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowDownToLine, ArrowUpFromLine, Wallet, Loader2, ArrowRight, RefreshCw, Copy, Check, Smartphone, Ticket,
    MessageSquare, Send, CreditCard, Phone, Bitcoin
} from "lucide-react"
import Link from "next/link"
import {adsApi, transactionApi} from "@/lib/api-client"
import type {Ad, Transaction} from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Image from "next/image"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {useSettings} from "@/lib/settings-context";
import AppDownloadButton from "@/components/AppDownloadButton";

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [copiedReference, setCopiedReference] = useState<string | null>(null)
    const [isChatPopoverOpen, setIsChatPopoverOpen] = useState<boolean>(false)
  const [ads, setAds] = useState<Ad[]>([])
  const [isCarouselHovered, setIsCarouselHovered] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
    const {settings} = useSettings()

  useEffect(() => {
    if (user) {
      fetchRecentTransactions()
    }
  }, [user])

  // Refetch data when the page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchRecentTransactions()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

    useEffect(()=>{
        const carrouselAutoScroll = ()=>{
            // Only auto scroll if carousel is not being hovered
            if (!isCarouselHovered) {
                const next = document.getElementById("next")
                if (next) next.click()
            }
        }

        const intervalId = setInterval(carrouselAutoScroll, 5000)
        return () => clearInterval(intervalId)
    }, [isCarouselHovered])

  const fetchRecentTransactions = async () => {
    try {
      setIsLoadingTransactions(true)
      const data = await transactionApi.getHistory({
        page: 1,
        page_size: 5, // Get only the 5 most recent transactions
      })
        const response = await adsApi.getAll()
        setAds(response.results)
        setRecentTransactions(data.results)
    } catch (error) {
      console.error("Error fetching recent transactions:", error)
      toast.error("Erreur lors du chargement des transactions récentes")
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const getStatusBadge = (status: Transaction["status"]) => {
    const statusConfig: Record<string, { variant:"pending" |"default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "pending", label: "En attente" },
      accept: { variant: "default", label: "Accepté" },
      init_payment: { variant: "pending", label: "En attente" },
      error: { variant: "destructive", label: "Erreur" },
      reject: { variant: "destructive", label: "Rejeté" },
      timeout: { variant: "outline", label: "Expiré" },
    }
    
    const config = statusConfig[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: Transaction["type_trans"]) => {
    return (
      <Badge variant={type === "deposit" ? "default" : "secondary"}>
        {type === "deposit" ? "Dépôt" : "Retrait"}
      </Badge>
    )
  }

  const copyReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopiedReference(reference)
      toast.success("Référence copiée!")
      setTimeout(() => setCopiedReference(null), 2000)
    } catch (error) {
      toast.error("Erreur lors de la copie")
    }
  }

  const router = useRouter()

  const handleRowClick = (transaction: Transaction) => {
    sessionStorage.setItem('cached_transaction', JSON.stringify(transaction))
    router.push(`/dashboard/history/detail?id=${transaction.reference}`)
  }

  return (
      <>
          <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
              {/* Welcome section */}
              <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3">
                      <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
                      <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                          <span className="gradient-text">Bienvenue, {user?.first_name}!</span>
                      </h1>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground pl-0 sm:pl-20">
                      Gérez vos dépôts et retraits en toute simplicité
                  </p>
              </div>

              {/* Ads Section */}
              {ads.length > 0 ? (
                  <div
                      ref={carouselRef}
                      onMouseEnter={() => setIsCarouselHovered(true)}
                      onMouseLeave={() => setIsCarouselHovered(false)}
                      className="relative rounded-2xl overflow-hidden shadow-sm border border-border/40"
                  >
                      <Carousel className="w-full" opts={{ loop: true }}>
                          <CarouselContent>
                              {ads.map((ad, index) =>
                                  ad.enable ? (
                                      <CarouselItem key={index}>
                                          <div className="relative w-full aspect-[21/9] sm:aspect-[21/6]">
                                              <Image
                                                  src={ad.image}
                                                  alt={`Publicité ${index + 1}`}
                                                  fill
                                                  className="object-cover"
                                                  priority={index === 0}
                                              />
                                          </div>
                                      </CarouselItem>
                                  ) : <></>
                              )}
                          </CarouselContent>
                          {ads.length > 1 && (
                              <>
                                  <CarouselPrevious id="previous" className="left-2 sm:left-3 h-7 w-7 bg-background/70 backdrop-blur-sm border-border/40 hover:bg-background/90" />
                                  <CarouselNext id="next" className="right-2 sm:right-3 h-7 w-7 bg-background/70 backdrop-blur-sm border-border/40 hover:bg-background/90" />
                              </>
                          )}
                      </Carousel>
                  </div>
              ) : (
                  <div className="rounded-2xl border border-dashed border-border/50 bg-muted/20 flex items-center justify-center py-8 sm:py-10">
                      <p className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">Espace publicitaire</p>
                  </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[
                      { href: "/dashboard/deposit",    icon: ArrowDownToLine, label: "Dépôt",    sub: "Ajouter",   color: "#059669", shadow: "emerald" },
                      { href: "/dashboard/withdrawal", icon: ArrowUpFromLine, label: "Retrait",  sub: "Retirer",   color: "#2563eb", shadow: "blue"    },
                      { href: "/dashboard/phones",     icon: Smartphone,      label: "Numéros",  sub: "IDs",       color: "#9333ea", shadow: "purple"  },
                      { href: "/dashboard/coupons",    icon: Ticket,          label: "Coupons",  sub: "Codes",     color: "#ea580c", shadow: "orange"  },
                  ].map(({ href, icon: Icon, label, sub, color }) => (
                      <Link key={href} href={href} className="group flex flex-col items-center gap-2 sm:gap-2.5">
                          {/* Icon circle */}
                          <div
                              className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg`}
                              style={{
                                  background: `${color}18`,
                                  border: `1.5px solid ${color}35`,
                                  boxShadow: `0 0 0 0 ${color}00`,
                              }}
                              onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 16px ${color}40`)}
                              onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 0 0 ${color}00`)}
                          >
                              <Icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 transition-colors duration-200" style={{ color }} strokeWidth={2} />
                          </div>
                          {/* Label */}
                          <div className="text-center">
                              <p className="text-[11px] sm:text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors duration-200">{label}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{sub}</p>
                          </div>
                      </Link>
                  ))}
              </div>

              {/* App Download Button */}
              <AppDownloadButton />

              {/* Crypto Achat / Vente */}
              {settings?.crypto_enable !== false && (
                  <div className="grid grid-cols-2 gap-3">
                      <Link
                          href="/dashboard/crypto/buy"
                          className="group relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                          style={{ background: "#d9770614", border: "1.5px solid #d9770630" }}
                      >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#d9770622" }}>
                              <Bitcoin className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0">
                              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 leading-tight">Achat Crypto</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-amber-500 ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>

                      <Link
                          href="/dashboard/crypto/sell"
                          className="group relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                          style={{ background: "#ea580c14", border: "1.5px solid #ea580c30" }}
                      >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#ea580c22" }}>
                              <Bitcoin className="h-4 w-4 text-orange-600 dark:text-orange-400" strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0">
                              <p className="text-xs font-bold text-orange-700 dark:text-orange-300 leading-tight">Vente Crypto</p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-orange-500 ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                  </div>
              )}

              {/* Recent activity */}
              <div className="space-y-3 sm:space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">Activité récente</h2>
                      <div className="flex items-center gap-2">
                          <button
                              onClick={fetchRecentTransactions}
                              disabled={isLoadingTransactions}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                          >
                              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                          </button>
                          <Link
                              href="/dashboard/history"
                              className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                          >
                              Voir tout
                              <ArrowRight className="h-3 w-3" />
                          </Link>
                      </div>
                  </div>

                  {/* Content */}
                  {isLoadingTransactions ? (
                      <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                      </div>
                  ) : recentTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
                              <Wallet className="h-6 w-6 text-primary/50" />
                          </div>
                          <div className="text-center">
                              <p className="text-sm font-semibold text-foreground">Aucune transaction</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Vos transactions apparaîtront ici</p>
                          </div>
                      </div>
                  ) : (
                      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/40">
                          {recentTransactions.map((transaction) => {
                            const type = transaction.type_trans
                            const isBuy  = type === "buy"
                            const isSale = type === "sale"
                            const isCrypto = isBuy || isSale

                            const iconBg = isBuy ? "#d9770620" : isSale ? "#ea580c20" : type === "deposit" ? "var(--deposit-bg, #05966920)" : "var(--withdrawal-bg, #2563eb20)"
                            const iconColor = isBuy ? "text-amber-500" : isSale ? "text-orange-500" : type === "deposit" ? "text-deposit" : "text-withdrawal"
                            const iconBorder = isBuy ? "#d9770640" : isSale ? "#ea580c40" : type === "deposit" ? "rgba(5,150,105,0.3)" : "rgba(37,99,235,0.3)"

                            const typeBadgeClass = isBuy
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : isSale
                                ? "bg-orange-500/10 text-orange-700 dark:text-orange-300"
                                : type === "deposit"
                                  ? "bg-deposit/10 text-deposit"
                                  : "bg-withdrawal/10 text-withdrawal"

                            const typeLabel = isBuy ? "Achat Crypto" : isSale ? "Vente Crypto" : type === "deposit" ? "Dépôt" : "Retrait"
                            const amountClass = isBuy ? "text-amber-500 dark:text-amber-400" : isSale ? "text-orange-500 dark:text-orange-400" : type === "deposit" ? "text-deposit" : "text-withdrawal"
                            const amountPrefix = (type === "deposit" || isSale) ? "+" : "-"

                            return (
                              <div
                                key={transaction.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer group"
                                onClick={() => handleRowClick(transaction)}
                              >
                                {/* Icon */}
                                <div
                                  className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
                                  style={{ background: iconBg, border: `1px solid ${iconBorder}` }}
                                >
                                  {isCrypto ? (
                                    <Bitcoin className={`h-4 w-4 ${iconColor}`} strokeWidth={2.5} />
                                  ) : type === "deposit" ? (
                                    <ArrowDownToLine className={`h-4 w-4 ${iconColor}`} strokeWidth={2.5} />
                                  ) : (
                                    <ArrowUpFromLine className={`h-4 w-4 ${iconColor}`} strokeWidth={2.5} />
                                  )}
                                </div>

                                {/* Middle */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${typeBadgeClass}`}>{typeLabel}</span>
                                    {getStatusBadge(transaction.status)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="truncate font-mono text-[10px]">#{transaction.reference}</span>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyReference(transaction.reference) }}
                                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      {copiedReference === transaction.reference
                                        ? <Check className="h-2.5 w-2.5 text-green-600" />
                                        : <Copy className="h-2.5 w-2.5" />}
                                    </button>
                                  </div>
                                  {!isCrypto && transaction.app_details?.name && (
                                    <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{transaction.app_details.name}</p>
                                  )}
                                </div>

                                {/* Right */}
                                <div className="shrink-0 text-right">
                                  <p className={`text-sm font-bold ${amountClass}`}>
                                    {amountPrefix}{transaction.amount.toLocaleString("fr-FR")} XOF
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {format(new Date(transaction.created_at), "dd MMM, HH:mm", { locale: fr })}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                  )}
              </div>
          </div>
          <Popover open={isChatPopoverOpen} onOpenChange={setIsChatPopoverOpen}>
              <PopoverTrigger asChild>
                  <Button
                      className="fixed right-4 bottom-24 sm:bottom-10 sm:right-8 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                      aria-label="Ouvrir le chat"
                  >
                      <MessageSquare className="h-6 w-6" />
                      <span className="sr-only">Ouvrir le chat</span>
                  </Button>
              </PopoverTrigger>
              <PopoverContent
                  className="w-64 p-4 mb-4 mr-4 glass backdrop-blur-xl border-border/50 shadow-xl"
                  align="end"
                  side="top"
              >
                  <div className="space-y-3">
                      <div className="mb-4">
                          <h3 className="text-sm font-semibold text-foreground mb-1">Besoin d'aide ?</h3>
                          <p className="text-xs text-muted-foreground">Contactez-nous via :</p>
                      </div>
                      <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-auto px-3 py-3 rounded-lg hover:bg-green-500/10 transition-all duration-200 group"
                          onClick={() => {
                              // Replace with your WhatsApp number (format: country code + number without + or spaces)
                              window.open(`https://wa.me/${settings?.whatsapp_phone}`, "_blank")
                              setIsChatPopoverOpen(false)
                          }}
                      >
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all duration-200">
                              <Send className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col items-start flex-1">
                              <span className="font-medium text-sm text-foreground">WhatsApp</span>
                              <span className="text-xs text-muted-foreground">Réponse rapide</span>
                          </div>
                          <div className="text-xs font-semibold text-green-600 group-hover:text-green-500">→</div>
                      </Button>
                      <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-auto px-3 py-3 rounded-lg hover:bg-blue-500/10 transition-all duration-200 group"
                          onClick={() => {
                              // Replace with your Telegram username
                              window.open(settings?.telegram||"https://t.me/your_username", "_blank")
                              setIsChatPopoverOpen(false)
                          }}
                      >
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all duration-200">
                              <Send className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col items-start flex-1">
                              <span className="font-medium text-sm text-foreground">Telegram</span>
                              <span className="text-xs text-muted-foreground">Support 24/7</span>
                          </div>
                          <div className="text-xs font-semibold text-blue-600 group-hover:text-blue-500">→</div>
                      </Button>
                  </div>
              </PopoverContent>
          </Popover>
      </>
  )
}
