"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2, CheckCircle2 } from "lucide-react"
import { networkApi } from "@/lib/api-client"
import type { Network } from "@/lib/types"
import { TRANSACTION_TYPES, getTransactionTypeLabel } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface NetworkStepProps {
  selectedNetwork: Network | null
  onSelect: (network: Network) => void
  type: "deposit" | "withdrawal"
}

export function NetworkStep({ selectedNetwork, onSelect, type }: NetworkStepProps) {
  const [networks, setNetworks] = useState<Network[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await networkApi.getAll()
        // Filter networks based on transaction type
        const activeNetworks = data.filter(network => 
          type === TRANSACTION_TYPES.DEPOSIT ? network.active_for_deposit : network.active_for_with
        )
        setNetworks(activeNetworks)
      } catch (error) {
        console.error("Error fetching networks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNetworks()
  }, [type])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choisir un réseau</CardTitle>
        <CardDescription>
          Sélectionnez le réseau mobile money pour votre {type === TRANSACTION_TYPES.DEPOSIT ? "dépôt" : "retrait"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {networks.map((network) => (
            <div
              key={network.id}
              className={cn(
                "relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                "hover:bg-muted/50 hover:border-primary/50",
                selectedNetwork?.id === network.id
                  ? "bg-primary/10 border-primary shadow-lg scale-[1.03]"
                  : "bg-card"
              )}
              onClick={() => onSelect(network)}
            >
              {selectedNetwork?.id === network.id && (
                <div className="absolute top-2 right-2 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              )}
              <SafeImage
                src={network.image}
                alt={network.name}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
                fallbackText={network.public_name.charAt(0).toUpperCase()}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate text-card-foreground">
                  {network.public_name}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {network.active_for_deposit && (
                    <Badge variant="outline" className="text-xs font-medium border-green-500/50 text-green-700 bg-green-500/10">
                      {getTransactionTypeLabel(TRANSACTION_TYPES.DEPOSIT)}
                    </Badge>
                  )}
                  {network.active_for_with && (
                    <Badge variant="outline" className="text-xs font-medium border-blue-500/50 text-blue-700 bg-blue-500/10">
                      {getTransactionTypeLabel(TRANSACTION_TYPES.WITHDRAWAL)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {networks.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              Aucun réseau disponible
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Aucun réseau n'est configuré pour {type === TRANSACTION_TYPES.DEPOSIT ? "les dépôts" : "les retraits"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}