"use client"

import { Button } from "@/components/ui/button"
import { Smartphone, Download } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function AppDownloadButton() {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = () => {
    setIsDownloading(true)
    
    // Replace this URL with your actual APK download URL
    const apkUrl = "/releases/app-v1.0.6.apk"
    
    try {
      const link = document.createElement("a")
      link.href = apkUrl
      link.download = "fastxof-v1.0.6.apk"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Téléchargement démarré!")
    } catch (error) {
      toast.error("Erreur lors du téléchargement")
      console.error(error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="mt-6 sm:mt-8">
      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5 p-4 sm:p-5">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Smartphone className="h-7 w-7 text-white" />
            </div>
          </div>

          {/* Text & Button */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
              Télécharger l'application FASTXOF
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Gérez vos transactions en déplacement avec notre application mobile Android
            </p>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full sm:w-auto h-10 sm:h-11 text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-md shadow-primary/25 transition-all duration-200 rounded-xl"
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? "Téléchargement..." : "Télécharger l'APK"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
