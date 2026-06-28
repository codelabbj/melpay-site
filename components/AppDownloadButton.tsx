"use client"

import { Download, Smartphone } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function AppDownloadButton() {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = () => {
    setIsDownloading(true)
    const apkUrl = "/releases/app-v1.0.6.apk"
    try {
      const link = document.createElement("a")
      link.href = apkUrl
      link.download = "melpay-v1.0.6.apk"
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
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="w-full group flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors duration-200">
        <Smartphone className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-foreground leading-tight">Télécharger l'application</p>
        <p className="text-xs text-muted-foreground mt-0.5">Android APK · v1.0.6</p>
      </div>

      {/* Action indicator */}
      <div className="shrink-0 flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide hidden sm:block">
          {isDownloading ? "En cours..." : "Télécharger"}
        </span>
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-200">
          <Download className="h-3.5 w-3.5 text-primary group-hover:text-white transition-colors duration-200" strokeWidth={2.5} />
        </div>
      </div>
    </button>
  )
}
