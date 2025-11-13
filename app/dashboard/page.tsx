"use client"

import { useState, useEffect} from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Loader2, ArrowRight, RefreshCw, Copy, Check, Smartphone, Ticket } from "lucide-react"
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

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [copiedReference, setCopiedReference] = useState<string | null>(null)
  const [ads, setAds] = useState<Ad[]>([])


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
            const next = document.getElementById("next")
            if (next) next.click()
        }

        const intervalId = setInterval(carrouselAutoScroll,500)
        return () => clearInterval(intervalId)
    })

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

      {/* Balance card */}
      {/* <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <CardHeader>
          <CardDescription className="text-primary-foreground/80">Solde disponible</CardDescription>
          <CardTitle className="text-4xl font-bold">
            {user?.balance?.toLocaleString("fr-FR", {
              style: "currency",
              currency: "XOF",
              minimumFractionDigits: 0,
            }) || "0 FCFA"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button asChild variant="secondary" size="sm" className="text-deposit border-deposit hover:bg-deposit/10">
              <Link href="/dashboard/deposit">
                <ArrowDownToLine className="mr-2 h-4 w-4 text-deposit" />
                Déposer
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="text-withdrawal border-withdrawal hover:bg-withdrawal/10">
              <Link href="/dashboard/withdrawal">
                <ArrowUpFromLine className="mr-2 h-4 w-4 text-withdrawal" />
                Retirer
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Quick actions */}
      <div className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          <Link href="/dashboard/deposit" className="group">
            <Card className="relative overflow-hidden border-2 border-deposit/30 bg-gradient-to-br from-deposit via-deposit/65 to-deposit/50 hover:border-deposit/50 transition-all duration-300 hover:shadow-lg hover:shadow-deposit/40 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-deposit/20 rounded-full blur-3xl group-hover:bg-deposit/30 transition-all duration-500"></div>
              <CardContent className="p-4 sm:p-5 lg:p-6 relative flex flex-col items-center justify-center text-center gap-2 h-full">
                <div className="p-3 rounded-2xl bg-deposit/70 text-secondary-foreground ring-1 ring-deposit group-hover:scale-110 transition-transform duration-300">
                  <ArrowDownToLine className="h-6 w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Dépôt</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/withdrawal" className="group">
            <Card className="relative overflow-hidden border-2 border-withdrawal/30 bg-gradient-to-br from-withdrawal via-withdrawal/65 to-withdrawal/50 hover:border-withdrawal/50 transition-all duration-300 hover:shadow-lg hover:shadow-withdrawal/40 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-withdrawal/20 rounded-full blur-3xl group-hover:bg-withdrawal/30 transition-all duration-500"></div>
              <CardContent className="p-4 sm:p-5 lg:p-6 relative flex flex-col items-center justify-center text-center gap-2 h-full">
                <div className="p-3 rounded-2xl bg-withdrawal/70 text-secondary-foreground ring-1 ring-withdrawal group-hover:scale-110 transition-transform duration-300">
                  <ArrowUpFromLine className="h-6 w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Retrait</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/phones" className="group">
            <Card className="relative overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary via-primary/65 to-primary/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/40 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500"></div>
              <CardContent className="p-4 sm:p-5 lg:p-6 relative flex flex-col items-center justify-center text-center gap-2 h-full">
                <div className="p-3 rounded-2xl bg-primary/70 text-secondary-foreground ring-1 ring-primary group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Numéros & IDs</h3>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/coupons" className="group">
            <Card className="relative overflow-hidden border-2 border-blue-300/40 bg-gradient-to-br from-blue-200 via-blue-300/65 to-blue-200/50 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-300/40 h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-300/20 rounded-full blur-3xl group-hover:bg-blue-300/30 transition-all duration-500"></div>
              <CardContent className="p-4 sm:p-5 lg:p-6 relative flex flex-col items-center justify-center text-center gap-2 h-full">
                <div className="p-3 rounded-2xl bg-blue-300/70 text-blue-900 ring-1 ring-blue-400 group-hover:scale-110 transition-transform duration-300">
                  <Ticket className="h-6 w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Coupons</h3>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Ads Section */}
      {ads.length > 0 ? (
        <Carousel
          className="w-full"
          opts={{
              loop: true,
          }}
        >
          <CarouselContent>
            {ads.map((ad, index) => (
              <CarouselItem key={index}>
                <Card className="border-2 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative w-full aspect-[21/9] sm:aspect-[21/6]">
                      <Image
                        src={ad.image}
                        alt={`Publicité ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
            {ads.length > 1 && (
                <>
                    <CarouselPrevious id="previous" className="left-2 sm:left-4" />
                    <CarouselNext id="next" className="right-2 sm:right-4" />
                </>
            )}

        </Carousel>
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

      {/* Recent activity */}
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-primary rounded-full"></div>
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
              <Card key={transaction.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                      <div className={`p-2.5 sm:p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110 ${
                        transaction.type_trans === "deposit"
                          ? "bg-deposit/10 text-deposit ring-2 ring-deposit/20"
                          : "bg-withdrawal/10 text-withdrawal ring-2 ring-withdrawal/20"
                      }`}>
                        {transaction.type_trans === "deposit" ? (
                          <ArrowDownToLine className="h-5 w-5" />
                        ) : (
                          <ArrowUpFromLine className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm sm:text-base text-foreground">#{transaction.reference}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-lg hover:bg-muted/80"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                copyReference(transaction.reference)
                              }}
                              title="Copier la référence"
                            >
                              {copiedReference === transaction.reference ? (
                                <Check className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              )}
                            </Button>
                          </div>
                          {getTypeBadge(transaction.type_trans)}
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium px-2 py-0.5 rounded-md bg-muted/50">{transaction.app_details.name ?? "N/A"}</span>
                          <span>•</span>
                          <span className="truncate">{transaction.phone_number}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 text-left sm:text-right shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), "dd MMM à HH:mm", {
                          locale: fr,
                        })}
                      </p>
                        <p className={`text-lg sm:text-xl font-bold ${
                            transaction.type_trans === "deposit" ? "text-deposit" : "text-withdrawal"
                        }`}>
                            {transaction.type_trans === "deposit" ? "+" : "-"}
                            {transaction.amount.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "XOF",
                                minimumFractionDigits: 0,
                            })}
                        </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
