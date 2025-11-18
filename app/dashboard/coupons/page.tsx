"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { couponApi } from "@/lib/api-client"
import { Coupon } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, ArrowLeft, Ticket, Copy, Check, Calendar } from "lucide-react"
import { toast } from "react-hot-toast"
import { format, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"

export default function CouponsPage() {
    const router = useRouter()
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(false)
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

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
        setLoading(true)
        try {
            const response = await couponApi.getAll()
            setCoupons(response.results)
        } catch (error) {
            toast.error("Erreur lors du chargement des coupons")
        } finally {
            setLoading(false)
        }
    }

    const copyCouponCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code)
            setCopiedCode(code)
            toast.success("Code copié!")
            setTimeout(() => setCopiedCode(null), 2000)
        } catch (error) {
            toast.error("Erreur lors de la copie")
        }
    }

    const getTimeAgo = (dateString: string) => {
        const createdDate = new Date(dateString).setHours(0, 0, 0, 0)
        const now = new Date().setHours(0, 0, 0, 0)
        const daysDiff = differenceInDays(now, createdDate)

        if (daysDiff === 0) {
            return "Aujourd'hui"
        } else if (daysDiff === 1) {
            return "Hier"
        } else if (daysDiff <= 10) {
            return `Il y a ${daysDiff} jours`
        } else {
            return `Créé le ${format(createdDate, "dd MMM yyyy à HH:mm", { locale: fr })}`
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-0">
            <div className="space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-xl hover:bg-muted shrink-0 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-1 w-12 sm:w-16 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                            <span className="gradient-text">Mes Coupons</span>
                        </h1>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground pl-14 sm:pl-20">
                        Consultez tous vos coupons de paris disponibles
                    </p>
                </div>

                {/* Coupons List */}
                <div className="space-y-4 sm:space-y-5">
                    <div className="flex flex-row items-center justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-primary rounded-full"></div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Coupons</h2>
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                                {coupons.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={loadData}
                                disabled={loading}
                                className="rounded-xl border-2 hover:border-primary/50 flex-1 sm:flex-initial transition-colors"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    <div>
                        {loading ? (
                            <Card className="border-2 border-dashed">
                                <CardContent className="flex items-center justify-center py-12 sm:py-16">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground">Chargement...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : coupons.length === 0 ? (
                            <Card className="border-2 border-dashed border-muted-foreground/20">
                                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                                        <div className="relative p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
                                            <Ticket className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                                        </div>
                                    </div>
                                    <p className="text-base sm:text-lg font-bold text-foreground text-center mb-2">
                                        Aucun coupon disponible
                                    </p>
                                    <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-xs">
                                        Vos coupons de paris apparaîtront ici
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {coupons.map((coupon) => (
                                    <Card
                                        key={coupon.id}
                                        className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden relative"
                                    >
                                        {/* Decorative corner */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full"></div>

                                        <CardContent className="p-5">
                                            <div className="space-y-4">
                                                {/* Header with icon */}
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                                        <Ticket className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/30">
                                                        {coupon.bet_app_details?.name||"N/A"}
                                                    </Badge>
                                                </div>

                                                {/* Coupon Code */}
                                                <div className="space-y-2">
                                                    <p className="text-xs font-medium text-muted-foreground">Code du coupon</p>
                                                    <div className="relative group/code cursor-pointer "
                                                         onClick={() => copyCouponCode(coupon.code)}
                                                    >
                                                        <div className="p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                                                            <p className="font-mono text-lg font-bold text-primary tracking-wider text-center">
                                                                {coupon.code}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyCouponCode(coupon.code)}
                                                            className="absolute -top-2 -right-2 h-8 w-8 cursor-pointer rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg opacity-0 group-hover/code:opacity-100 transition-all"
                                                        >
                                                            {copiedCode === coupon.code ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Date */}
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>
                                                        {getTimeAgo(coupon.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}