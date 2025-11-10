"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2, Plus } from "lucide-react"
import { platformApi } from "@/lib/api-client"
import type { Platform } from "@/lib/types"
import { toast } from "react-hot-toast"

interface PlatformStepProps {
  selectedPlatform: Platform | null
  onSelect: (platform: Platform) => void
  onNext: () => void
}

export function PlatformStep({ selectedPlatform, onSelect, onNext }: PlatformStepProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const data = await platformApi.getAll()
        // Filter only enabled platforms
        const enabledPlatforms = data.filter(platform => platform.enable)
        setPlatforms(enabledPlatforms)
      } catch (error) {
        toast.error("Erreur lors du chargement des plateformes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatforms()
  }, [])

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
        <CardTitle>Choisir une plateforme</CardTitle>
        <CardDescription>Sélectionnez la plateforme de paris sur laquelle vous souhaitez effectuer votre transaction</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {platforms.map((platform) => (
            <Card
              key={platform.id}
              className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                selectedPlatform?.id === platform.id
                  ? "ring-2 ring-primary bg-primary/5 shadow-md"
                  : "hover:bg-muted/50 hover:border-primary/50"
              }`}
              onClick={() => onSelect(platform)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`relative ${
                      selectedPlatform?.id === platform.id
                        ? "ring-2 ring-primary ring-offset-2 rounded-lg"
                        : "group-hover:ring-1 group-hover:ring-primary/30 group-hover:ring-offset-1 rounded-lg transition-all"
                    }`}>
                      <SafeImage
                        src={platform.image}
                        alt={platform.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                        fallbackText={platform.name.charAt(0).toUpperCase()}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                        {platform.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Minimum</span>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {platform.minimun_deposit.toLocaleString()} FCFA
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Maximum</span>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {platform.max_deposit.toLocaleString()} FCFA
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {platforms.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Aucune plateforme disponible</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Les plateformes seront affichées ici</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
