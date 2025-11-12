"use client"

import {useEffect, useState} from "react";
import {bonusApi} from "@/lib/api-client";
import {Bonus} from "@/lib/types";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {
    ArrowLeft,
    Gift,
    Loader2,
    RefreshCw,
} from "lucide-react";
import {useRouter} from "next/navigation";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {format} from "date-fns";
import {fr} from "date-fns/locale";

export default function BonusPage(){

    const [loading, setLoading] = useState(false);
    const [bonuses, setBonuses] = useState<Bonus[]>([]);
    const router = useRouter();

    useEffect(() => {
        loadData()
    },[])

    useEffect(() => {
        window.addEventListener('focus',loadData)
        return () => window.removeEventListener('focus',loadData)
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await bonusApi.getAll()
            setBonuses(data.results)
        }catch(error){
            toast.error("Erreur lors du chargement des bonus")
        } finally {
            setLoading(false);
        }
    }

    return(
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
                            <span className="gradient-text">Mes bonus</span>
                        </h1>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground pl-14 sm:pl-20">
                        Consultez tous vos bonus disponibles
                    </p>
                </div>

                <div className="space-y-4 sm:space-y-5">
                    <div className="flex flex-row items-center justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1 bg-primary rounded-full"></div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Bonus</h2>
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                                {bonuses.length}
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
                        ) : bonuses.length === 0 ? (
                            <Card className="border-2 border-dashed border-muted-foreground/20">
                                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
                                        <div className="relative p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
                                            <Gift className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
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
                                {bonuses.map((bonus) => (
                                    <Card key={bonus.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden">
                                        <CardContent className="p-4 sm:p-5">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                                                    <div className="p-2.5 sm:p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110 text-blue-500 border-blue-500 bg-violet-500/20">
                                                        <Gift className="h-5 w-5"/>
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <div className="flex items-center gap-1.5">
                                                                <h3 className="font-bold text-sm sm:text-base text-foreground">{bonus.reason_bonus}</h3>
                                                            </div>
                                                            <Badge variant="default">Bonus</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                            <span className="font-medium px-2 py-0.5 rounded-md bg-muted/50 truncate">{bonus.transaction ?? "N/A"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="font-medium text-muted-foreground">Utilisateur:</span>
                                                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-mono">{bonus.user}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-3 text-left sm:text-right shrink-0 w-full sm:w-auto border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(bonus.created_at), "dd MMM à HH:mm", {
                                                            locale: fr,
                                                        })}
                                                    </p>
                                                    <p className="text-lg sm:text-xl font-bold text-blue-500">
                                                        +
                                                        {bonus.amount.toLocaleString("fr-FR", {
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

            </div>
        </div>
    )
}