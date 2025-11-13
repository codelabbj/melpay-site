"use client"

import { useEffect, useState } from "react";
import { bonusApi, platformApi, transactionApi, userAppIdApi } from "@/lib/api-client";
import { Bonus, Platform, UserAppId } from "@/lib/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    ArrowDownToLine,
    ArrowLeft,
    ArrowUpFromLine,
    ExternalLink,
    Gift,
    Loader2,
    RefreshCw
} from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useSettings } from "@/lib/settings-context";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {useAuth} from "@/lib/auth-context";

export default function BonusPage() {
  const { settings, isLoading: settingsLoading } = useSettings();
  const {user} = useAuth()
  const [loading, setLoading] = useState(false);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const router = useRouter();

  const [selectedBetId, setSelectedBetId] = useState<string>();
  const [amount, setAmount] = useState<number|undefined>(undefined);
  const [selectedPlatform, setSelectedPlatform] = useState<string>();
  const [betIds, setBetIds] = useState<UserAppId[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loadingBetIds, setLoadingBetIds] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionLink, setTransactionLink] = useState<string | null>(null);

  useEffect(() => {
    if (!settingsLoading && settings && !settings.referral_bonus) {
      notFound();
    }
  }, [settings, settingsLoading]);

  useEffect(() => {
    if (settings?.referral_bonus) {
      loadData();
    }
  }, [settings]);

  useEffect(() => {
    const handleFocus = () => {
      if (settings?.referral_bonus) {
        loadData();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [settings]);

    useEffect(() => {
        const fetchBetIds = async ()=>{
            if (selectedPlatform){
                setLoadingBetIds(true);
                try {
                    const res = await userAppIdApi.getByPlatform(selectedPlatform);
                    setBetIds(res);
                }catch (error){
                    toast.error("Erreur lors du chargement des ID de paris");
                } finally {
                    setLoadingBetIds(false);
                    setSelectedBetId(undefined);
                }
            }
        }
        fetchBetIds()
    }, [selectedPlatform]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await bonusApi.getAll();
      setBonuses(data.results);
      const res = await platformApi.getAll();
      setPlatforms(res)
    } catch (error) {
      toast.error("Erreur lors du chargement des bonus");
    } finally {
      setLoading(false);
    }
  };

  const handleBonusDeposit = async () => {
    if (!selectedPlatform ||!selectedBetId || !amount || amount <= 0) {
      toast.error("Veuillez sélectionner un ID de paris et entrer un montant valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await transactionApi.createBonusDeposit({
        app: selectedPlatform,
        amount: amount,
          user_app_id:selectedBetId
      });

      if (response.transaction_link) {
        setTransactionLink(response.transaction_link);
      } else {
        toast.success("Dépôt bonus initié avec succès!");
        setDepositDialogOpen(false);
        loadData(); // Reload bonuses
      }
    } catch (error) {
      toast.error("Erreur lors de la création du dépôt bonus.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRedirect = () => {
    if (transactionLink) {
      window.open(transactionLink, '_blank');
      setDepositDialogOpen(false);
    }
  };

    const validateAmount = (value: number) => {
        if (!selectedPlatform) return "Plateforme non sélectionnée"

        if (value <= 0) return "Le montant doit être supérieur à 0"

        const platform = platforms.find((p)=>p.id === selectedPlatform);
        if (platform) {
            const minDeposit = Math.max(platform.minimun_deposit, settings?.reward_mini_withdrawal??0 , user?.bonus_available ?? 0);

            if (value < minDeposit) {
                return `Le montant minimum est de ${minDeposit.toLocaleString()} FCFA`;
            }
            if (value > platform.max_deposit) {
                return `Le montant maximum est de ${platform.max_deposit.toLocaleString()} FCFA`;
            }
        }

        return null
    }

  const resetDialogState = () => {
        setDepositDialogOpen(false);
        setSelectedPlatform(undefined)
    setSelectedBetId(undefined);
    setAmount(undefined);
    setTransactionLink(null);
    setIsSubmitting(false);
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
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
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                Bonus
              </h2>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                {bonuses.length}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-auto">
                {user && settings && user.bonus_available > settings.reward_mini_withdrawal &&(
                    <Button
                        onClick={()=>setDepositDialogOpen(true)}
                        size="sm"
                        className="w-auto shadow-sm hover:shadow-md transition-shadow bg-deposit text-white hover:bg-deposit/70"
                    >
                        <ArrowDownToLine className=" h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">Dépôt</span>
                    </Button>
                )}

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="rounded-xl border-2 hover:border-primary/50 flex-1 sm:flex-initial transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div>
            {loading ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex items-center justify-center py-12 sm:py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Chargement...
                    </p>
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
              <div className="space-y-3">
                {bonuses.map((bonus) => (
                  <Card
                    key={bonus.id}
                    className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                          <div className="p-2.5 sm:p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110 text-blue-500 border-blue-500 bg-violet-500/20">
                            <Gift className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm sm:text-base text-foreground">
                                  {bonus.reason_bonus}
                                </h3>
                              </div>
                              <Badge variant="default">Bonus</Badge>
                            </div>
                              <div className="flex justify-between">
                                  <p className="text-lg sm:text-xl font-bold text-blue-500">
                                      +
                                      {bonus.amount.toLocaleString("fr-FR", {
                                          style: "currency",
                                          currency: "XOF",
                                          minimumFractionDigits: 0,
                                      })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                      {format(
                                          new Date(bonus.created_at),
                                          "dd MMM à HH:mm",
                                          {
                                              locale: fr,
                                          }
                                      )}
                                  </p>
                              </div>
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
      </div>

        <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                        Effectuer un dépôt bonus
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Faire un dépôt avec votre solde bonus.
                    </DialogDescription>
                </DialogHeader>
                {transactionLink ? (
                    <div>
                        <div className="py-4">
                            <p className="text-center text-sm text-muted-foreground">
                                Pour terminer la transaction, veuillez cliquer sur confirmer.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleConfirmRedirect} className="w-full">
                                Confirmer
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
                            <div className="space-y-2 w-full">
                                <Label htmlFor="platform">Plateforme</Label>
                                <Select
                                    onValueChange={setSelectedPlatform}
                                    value={selectedPlatform}
                                    disabled={loadingBetIds}
                                >
                                    <SelectTrigger id="platform" className="w-full overflow-hidden">
                                        <SelectValue placeholder={loadingBetIds ? "Chargement..." : "Sélectionner une platforme"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {platforms.map((platform) => (
                                            <SelectItem key={platform.id} value={platform.id}>
                                                {platform.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 w-full">
                                <Label htmlFor="betId">ID de paris</Label>
                                <Select
                                    onValueChange={setSelectedBetId}
                                    value={selectedBetId}
                                    disabled={loadingBetIds||!selectedPlatform}
                                >
                                    <SelectTrigger id="betId" className="w-full overflow-hidden">
                                        <SelectValue placeholder={loadingBetIds ? "Chargement..." : "Sélectionner un id de paris"} />
                                    </SelectTrigger>
                                    <SelectContent className="w-full">
                                        {betIds.map((betId) => (
                                            <SelectItem key={betId.id} value={String(betId.id)}>
                                                {betId.user_app_id}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Montant</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Entrer le montant"
                                value={amount === undefined ? "" : amount}
                                onChange={(e) => {
                                    if (e.target.value !== ""){
                                        setAmount(parseFloat(e.target.value))
                                    }else {
                                        setAmount(undefined)
                                    }
                                }}
                                className={`text-lg h-12 ${amount !== undefined && validateAmount(amount) ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                            {amount !== undefined && validateAmount(amount)  && (
                                <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5">
                                    <AlertCircle className="h-4 w-4" /> {validateAmount(amount)}
                                </p>
                            )}
                        </div>
                        {amount!== undefined && !validateAmount(amount) && (
                            <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Montant à déposer </p>
                                        <p className="text-2xl font-bold text-primary">
                                            {amount.toLocaleString("fr-FR", {
                                                style: "currency",
                                                currency: "XOF",
                                                minimumFractionDigits: 0,
                                            })}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <ArrowDownToLine className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={resetDialogState}>
                                Annuler
                            </Button>
                            <Button
                                onClick={handleBonusDeposit}
                                disabled={isSubmitting || loadingBetIds || !selectedBetId || !amount || amount <= 0}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmer
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    </div>
  );
}