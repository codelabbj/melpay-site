import {Transaction} from "@/lib/types";
import {Card, CardContent} from "@/components/ui/card";
import {ArrowDownToLine, ArrowUpFromLine, Check, Copy, CreditCard, Phone} from "lucide-react";
import {Button} from "@/components/ui/button";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {toast} from "react-hot-toast";
import {useState} from "react";
import {Badge} from "@/components/ui/badge";

interface Props {
    transaction: Transaction
}

export const TransactionCard = ({transaction} : Props) =>{
    const [copiedReference, setCopiedReference] = useState<string|null>(null)

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

    return (
        <Card className="relative overflow-hidden border rounded-2xl sm:rounded-3xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 cursor-pointer group">
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
    )
}