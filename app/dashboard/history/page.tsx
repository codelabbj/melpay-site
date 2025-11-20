"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Filter, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Copy, Check, ArrowLeft, CreditCard, Phone } from "lucide-react"
import { transactionApi } from "@/lib/api-client"
import type { Transaction } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function TransactionHistoryPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [copiedReference, setCopiedReference] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "withdrawal">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accept" | "reject" | "timeout">("all")

  useEffect(() => {
    fetchTransactions()
  }, [currentPage, searchTerm, typeFilter, statusFilter])

  // Refetch data when the page gains focus to ensure fresh data
  useEffect(() => {
    const handleFocus = () => {
      fetchTransactions()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        page: currentPage,
        page_size: 10,
      }
      
      if (searchTerm) params.search = searchTerm
      if (typeFilter !== "all") params.type_trans = typeFilter
      if (statusFilter !== "all") params.status = statusFilter
      
      const data = await transactionApi.getHistory(params)
      setTransactions(data.results)
      setTotalCount(data.count)
      setTotalPages(Math.ceil(data.count / 10))
    } catch (error) {
      toast.error("Erreur lors du chargement de l'historique")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: Transaction["status"]) => {
    const statusConfig: Record<string, { variant: "default" | "pending" | "destructive" | "outline"; label: string }> = {
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

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "type") {
      setTypeFilter(value as any)
    } else if (filterType === "status") {
      setStatusFilter(value as any)
    }
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Veuillez vous connecter pour voir l'historique</p>
      </div>
    )
  }

  const router = useRouter()

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
              <span className="gradient-text">Historique</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground pl-14 sm:pl-20">
            Consultez toutes vos transactions de dépôt et de retrait
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Filtres</h2>
          </div>
          <Card className="border-2 hover:border-primary/20 transition-colors">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 border-2"
                  />
                </div>
                  <div className=" items-center w-full gap-3 block sm:hidden">
                      <Select value={typeFilter} onValueChange={(value) => handleFilterChange("type", value)}>
                          <SelectTrigger className=" w-full border-2">
                              <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Tous les types</SelectItem>
                              <SelectItem value="deposit">Dépôts</SelectItem>
                              <SelectItem value="withdrawal">Retraits</SelectItem>
                          </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
                          <SelectTrigger className=" w-full border-2">
                              <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Tous les statuts</SelectItem>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="accept">Accepté</SelectItem>
                              <SelectItem value="reject">Rejeté</SelectItem>
                              <SelectItem value="timeout">Expiré</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="hidden sm:block">
                      <Select value={typeFilter} onValueChange={(value) => handleFilterChange("type", value)}>
                          <SelectTrigger className=" border-2">
                              <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Tous les types</SelectItem>
                              <SelectItem value="deposit">Dépôts</SelectItem>
                              <SelectItem value="withdrawal">Retraits</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                  <div className="hidden sm:block">
                      <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
                          <SelectTrigger className="border-2">
                              <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Tous les statuts</SelectItem>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="accept">Accepté</SelectItem>
                              <SelectItem value="reject">Rejeté</SelectItem>
                              <SelectItem value="timeout">Expiré</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-2 hover:border-primary/50 transition-colors"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Transactions</h2>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">{totalCount}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTransactions}
                disabled={isLoading}
                className="rounded-xl border-2 hover:border-primary/50 flex-1 sm:flex-initial transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground">Aucune transaction trouvée</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Vos transactions apparaîtront ici une fois effectuées
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="relative overflow-hidden border rounded-2xl sm:rounded-3xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 cursor-pointer group"
                  >
                    <CardContent>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 md:gap-8">
                        {/* Left section */}
                        <div className="flex items-start gap-3 sm:gap-4 md:gap-5 flex-1 min-w-0 w-full">
                          {/* Icon wrapper with gradient */}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Page {currentPage} sur {totalPages} ({totalCount} transactions)
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}