"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2 } from "lucide-react"
import { networkApi } from "@/lib/api-client"
import type { Network } from "@/lib/types"
import { TRANSACTION_TYPES, getTransactionTypeLabel } from "@/lib/constants"

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {networks.map((network) => (
            <Card
              key={network.id}
              className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                selectedNetwork?.id === network.id
                  ? "ring-2 ring-primary bg-primary/5 shadow-md"
                  : "hover:bg-muted/50 hover:border-primary/50"
              }`}
              onClick={() => onSelect(network)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`relative ${
                      selectedNetwork?.id === network.id
                        ? "ring-2 ring-primary ring-offset-2 rounded-lg"
                        : "group-hover:ring-1 group-hover:ring-primary/30 group-hover:ring-offset-1 rounded-lg transition-all"
                    }`}>
                      <SafeImage
                        src={network.image}
                        alt={network.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                        fallbackText={network.public_name.charAt(0).toUpperCase()}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                        {network.public_name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{network.name}</p>
                    </div>
                  </div>

                  {(network.active_for_deposit || network.active_for_with) && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                      {network.active_for_deposit && (
                        <Badge variant="secondary" className="text-xs">
                          {getTransactionTypeLabel(TRANSACTION_TYPES.DEPOSIT)}
                        </Badge>
                      )}
                      {network.active_for_with && (
                        <Badge variant="secondary" className="text-xs">
                          {getTransactionTypeLabel(TRANSACTION_TYPES.WITHDRAWAL)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
