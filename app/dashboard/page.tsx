"use client"

import { useState, useEffect, useRef} from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    ArrowDownToLine, ArrowUpFromLine, Wallet, Loader2, ArrowRight, RefreshCw, Copy, Check, Smartphone, Ticket,
    MessageSquare, Send, CreditCard, Phone
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

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [copiedReference, setCopiedReference] = useState<string | null>(null)
    const [isChatPopoverOpen, setIsChatPopoverOpen] = useState<boolean>(false)
  const [ads, setAds] = useState<Ad[]>([])
  const [isCarouselHovered, setIsCarouselHovered] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)


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
                  >
                      <Carousel
                          className="w-full"
                          opts={{
                              loop: true,
                          }}
                      >
                          <CarouselContent>
                              {ads.map((ad, index) =>
                                  ad.enable ? (
                                      <CarouselItem key={index}>
                                          <div className="relative w-full aspect-[21/9] sm:aspect-[21/6]">
                                              <Image
                                                  src={ad.image}
                                                  alt={`Publicité ${index + 1}`}
                                                  fill
                                                  className="object-fit border-2 rounded-lg"
                                                  priority={index === 0}
                                              />
                                          </div>
                                      </CarouselItem>
                                  ):(
                                      <></>
                                  )
                              )}
                          </CarouselContent>
                          {ads.length > 1 && (
                              <>
                                  <CarouselPrevious id="previous" className="left-2 sm:left-4" />
                                  <CarouselNext id="next" className="right-2 sm:right-4" />
                              </>
                          )}

                      </Carousel>
                  </div>
              ) : (
                  <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/10">
                      <CardContent className="flex items-center justify-center py-8 sm:py-12">
                          <div className="text-center space-y-2">
                              <p className="text-sm sm:text-base font-medium text-muted-foreground">
                                  Espace publicitaire à venir
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                  Les publicités arriveront bientôt ici
                              </p>
                          </div>
                      </CardContent>
                  </Card>
              )}

              {/* Quick actions */}
              <div className="space-y-4 sm:space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                      <Link href="/dashboard/deposit" className="group h-full">
                          <Card className="relative p-6 sm:p-7 md:p-8 lg:p-10 rounded-2xl cursor-pointer transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) overflow-hidden backdrop-blur-lg border border-white/10 bg-gradient-to-br from-emerald-400 to-emerald-600 animate-fadeInUp group-hover:-translate-y-3 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-black/40 h-full">
                              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-90 -z-10"></div>
                              <div className="absolute w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full blur-2xl top-0 right-0 group-hover:translate-x-6 group-hover:-translate-y-6 transition-all duration-600"></div>
                              <div className="relative z-10 flex flex-col items-center text-center gap-4 sm:gap-6 h-full">
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/25 rounded-lg sm:rounded-xl backdrop-blur-lg border border-white/30 flex items-center justify-center transition-all duration-500 group-hover:bg-white/35">
                                      <ArrowDownToLine className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2} />
                                  </div>
                                  <div>
                                      <h3 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-white drop-shadow mb-1 sm:mb-2">Dépôt</h3>
                                  </div>
                              </div>
                          </Card>
                      </Link>

                      <Link href="/dashboard/withdrawal" className="group h-full">
                          <Card className="relative p-6 sm:p-7 md:p-8 lg:p-10 rounded-2xl cursor-pointer transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) overflow-hidden backdrop-blur-lg border border-white/10 bg-gradient-to-br from-blue-400 to-blue-600 animate-fadeInUp group-hover:-translate-y-3 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-black/40 h-full">
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-90 -z-10"></div>
                              <div className="absolute w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full blur-2xl top-0 right-0 group-hover:translate-x-6 group-hover:-translate-y-6 transition-all duration-600"></div>
                              <div className="relative z-10 flex flex-col items-center text-center gap-4 sm:gap-6 h-full">
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/25 rounded-lg sm:rounded-xl backdrop-blur-lg border border-white/30 flex items-center justify-center transition-all duration-500 group-hover:bg-white/35">
                                      <ArrowUpFromLine className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2} />
                                  </div>
                                  <div>
                                      <h3 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-white drop-shadow mb-1 sm:mb-2">Retrait</h3>
                                  </div>
                              </div>
                          </Card>
                      </Link>

                      <Link href="/dashboard/phones" className="group h-full">
                          <Card className="relative p-6 sm:p-7 md:p-8 lg:p-10 rounded-2xl cursor-pointer transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) overflow-hidden backdrop-blur-lg border border-white/10 bg-gradient-to-br from-purple-400 to-purple-600 animate-fadeInUp group-hover:-translate-y-3 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-black/40 h-full">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 opacity-90 -z-10"></div>
                              <div className="absolute w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full blur-2xl top-0 right-0 group-hover:translate-x-6 group-hover:-translate-y-6 transition-all duration-600"></div>
                              <div className="relative z-10 flex flex-col items-center text-center gap-4 sm:gap-6 h-full">
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/25 rounded-lg sm:rounded-xl backdrop-blur-lg border border-white/30 flex items-center justify-center transition-all duration-500 group-hover:bg-white/35">
                                      <Smartphone className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2} />
                                  </div>
                                  <div>
                                      <h3 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-white drop-shadow mb-1 sm:mb-2">Numéros & IDs</h3>
                                  </div>
                              </div>
                          </Card>
                      </Link>

                      <Link href="/dashboard/coupons" className="group h-full">
                          <Card className="relative p-6 sm:p-7 md:p-8 lg:p-10 rounded-2xl cursor-pointer transition-all duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) overflow-hidden backdrop-blur-lg border border-white/10 bg-gradient-to-br from-orange-400 to-orange-600 animate-fadeInUp group-hover:-translate-y-3 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-black/40 h-full">
                              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 opacity-90 -z-10"></div>
                              <div className="absolute w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full blur-2xl top-0 right-0 group-hover:translate-x-6 group-hover:-translate-y-6 transition-all duration-600"></div>
                              <div className="relative z-10 flex flex-col items-center text-center gap-4 sm:gap-6 h-full">
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/25 rounded-lg sm:rounded-xl backdrop-blur-lg border border-white/30 flex items-center justify-center transition-all duration-500 group-hover:bg-white/35">
                                      <Ticket className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2} />
                                  </div>
                                  <div>
                                      <h3 className="text-base sm:text-lg md:text-xl lg:text-xl font-bold text-white drop-shadow mb-1 sm:mb-2">Coupons</h3>
                                  </div>
                              </div>
                          </Card>
                      </Link>
                  </div>
              </div>

              {/* Recent activity */}
              <div className="space-y-4 sm:space-y-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <div className="flex items-center gap-3">
                          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Activité récente</h2>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchRecentTransactions}
                              disabled={isLoadingTransactions}
                              className="rounded-xl border-2 hover:border-primary/50 flex-1 sm:flex-initial transition-colors"
                          >
                              <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button asChild variant="outline" size="sm" className="rounded-xl border-2 hover:border-primary/50 flex-1 sm:flex-initial transition-colors">
                              <Link href="/dashboard/history" className="flex items-center justify-center gap-2">
                                  <span className="hidden sm:inline">Voir tout</span>
                                  <span className="sm:hidden">Tout</span>
                                  <ArrowRight className="h-4 w-4" />
                              </Link>
                          </Button>
                      </div>
                  </div>

                  {isLoadingTransactions ? (
                      <Card className="border-2 border-dashed">
                          <CardContent className="flex items-center justify-center py-12 sm:py-16">
                              <div className="flex flex-col items-center gap-3">
                                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                                  <p className="text-sm text-muted-foreground">Chargement...</p>
                              </div>
                          </CardContent>
                      </Card>
                  ) : recentTransactions.length === 0 ? (
                      <Card className="border-2 border-dashed border-muted-foreground/20">
                          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
                              <div className="relative mb-6">
                                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                                  <div className="relative p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
                                      <Wallet className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                                  </div>
                              </div>
                              <p className="text-base sm:text-lg font-bold text-foreground text-center mb-2">Aucune transaction récente</p>
                              <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-xs">Vos transactions apparaîtront ici une fois que vous effectuez un dépôt ou retrait</p>
                          </CardContent>
                      </Card>
                  ) : (
                      <div className="space-y-3">
                          {recentTransactions.map((transaction) => (
                              <Card key={transaction.id} className="relative overflow-hidden border rounded-2xl sm:rounded-3xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 cursor-pointer group">
                                  <CardContent className="p-4 sm:p-6 md:p-7">
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 md:gap-8">
                                          {/* Left section */}
                                          <div className="flex items-start gap-3 sm:gap-4 md:gap-5 flex-1 min-w-0 w-full">
                                              {/* Icon wrapper with border */}
                                              <div
                                                className={`w-14 h-14 sm:w-16 md:w-16 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 border-2 ${
                                                  transaction.type_trans === "deposit"
                                                    ? "border-deposit shadow-lg shadow-deposit/20"
                                                    : "border-withdrawal shadow-lg shadow-withdrawal/20"
                                                }`}
                                              >
                                                  {transaction.type_trans === "deposit" ? (
                                                      <ArrowDownToLine className="h-7 w-7 sm:h-8 md:h-8 text-deposit" strokeWidth={2.5} />
                                                  ) : (
                                                      <ArrowUpFromLine className="h-7 w-7 sm:h-8 md:h-8 text-withdrawal" strokeWidth={2.5} />
                                                  )}
                                              </div>

                                              {/* Transaction info */}
                                              <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                                                  {/* Reference and copy button */}
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                      <h3 className="font-bold text-sm sm:text-base md:text-base text-foreground truncate">
                                                          #{transaction.reference}
                                                      </h3>
                                                      <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-6 w-6 sm:h-7 md:h-7 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                                                          onClick={(e) => {
                                                              e.preventDefault()
                                                              e.stopPropagation()
                                                              copyReference(transaction.reference)
                                                          }}
                                                          title="Copier la référence"
                                                      >
                                                          {copiedReference === transaction.reference ? (
                                                              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                                                          ) : (
                                                              <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-500 group-hover:text-slate-700" />
                                                          )}
                                                      </Button>
                                                  </div>

                                                  {/* Badges */}
                                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                      <div
                                                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold text-white transition-transform hover:scale-105 ${
                                                          transaction.type_trans === "deposit"
                                                            ? "bg-gradient-to-r from-deposit to-deposit/90"
                                                            : "bg-gradient-to-r from-withdrawal to-withdrawal/90"
                                                        }`}
                                                      >
                                                          {transaction.type_trans === "deposit" ? "Dépôt" : "Retrait"}
                                                      </div>
                                                      {getStatusBadge(transaction.status)}
                                                  </div>

                                                  {/* Transaction details */}
                                                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 flex-wrap">
                                                      <div className="flex items-center gap-1.5 font-medium">
                                                          <CreditCard className="w-4 h-4 text-slate-400" />
                                                          <span className="text-slate-700 font-semibold">{transaction.app_details.name}</span>
                                                      </div>
                                                      <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                      <div className="flex items-center gap-1.5 font-medium">
                                                          <Phone className="w-4 h-4 text-slate-400" />
                                                          <span className="text-slate-700 font-semibold truncate">+{transaction.phone_number.slice(0,3)} {transaction.phone_number.slice(3)}</span>
                                                      </div>
                                                      {transaction.user_app_id && (
                                                          <>
                                                              <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                              <span className="text-slate-700 font-medium">ID: <span className="font-semibold">{transaction.user_app_id}</span></span>
                                                          </>
                                                      )}
                                                  </div>

                                                  {/* Withdrawal code if present */}
                                                  {transaction.withdriwal_code && (
                                                      <div className="flex items-center gap-2 text-xs pt-1">
                                                          <span className="font-medium text-slate-600 shrink-0">Code:</span>
                                                          <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono font-medium text-xs truncate">
                                                              {transaction.withdriwal_code}
                                                          </span>
                                                      </div>
                                                  )}

                                                  {/* Error message if present */}
                                                  {transaction.error_message && (
                                                      <p className="text-xs text-red-600 font-medium pt-1">
                                                          ⚠️ {transaction.error_message}
                                                      </p>
                                                  )}
                                              </div>
                                          </div>

                                          {/* Right section - Amount and timestamp */}
                                          <div className="w-full sm:w-auto shrink-0 flex items-center sm:flex-col justify-between sm:items-end gap-3 sm:gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                              <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                                  {format(new Date(transaction.created_at), "dd MMM à HH:mm", {
                                                      locale: fr,
                                                  })}
                                              </p>
                                              <div className="flex flex-col items-end gap-0.5 sm:gap-1">
                                                  <p
                                                    className={`text-lg sm:text-xl md:text-2xl font-bold transition-all duration-300 ${
                                                      transaction.type_trans === "deposit"
                                                        ? "text-deposit"
                                                        : "text-withdrawal"
                                                    }`}
                                                  >
                                                      {transaction.type_trans === "deposit" ? "+" : "-"}
                                                      {transaction.amount.toLocaleString("fr-FR", {
                                                          style: "currency",
                                                          currency: "XOF",
                                                          minimumFractionDigits: 0,
                                                      })}
                                                  </p>
                                              </div>
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>
                          ))}
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
                              window.open("https://wa.me/22912345678", "_blank")
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
                              window.open("https://t.me/your_username", "_blank")
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
