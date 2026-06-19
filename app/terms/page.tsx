"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
        e.preventDefault()
        const id = target.getAttribute("href")?.substring(1)
        document.getElementById(id || "")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
    document.addEventListener("click", handleAnchorClick)
    return () => document.removeEventListener("click", handleAnchorClick)
  }, [])

  const sections = [
    { id: "presentation", title: "1. Présentation de FASTXOF", content: "FASTXOF est une plateforme de services financiers permettant d'effectuer des dépôts et retraits vers des plateformes de paris sportifs partenaires. FASTXOF n'est pas un site de paris sportifs et ne garantit aucun gain." },
    { id: "acces", title: "2. Conditions d'accès", content: "Vous devez être âgé d'au moins 18 ans, utiliser un numéro valide et fournir des informations exactes. FASTXOF peut refuser ou suspendre l'accès en cas de non-respect." },
    { id: "responsabilite", title: "3. Responsabilité de l'utilisateur", content: "L'utilisateur est seul responsable de son compte, de ses dépôts, retraits, gains et pertes. FASTXOF n'est pas responsable des décisions des plateformes de paris sportifs." },
    { id: "transactions", title: "4. Dépôts et retraits", content: "Les opérations suivent les procédures indiquées. Vérifiez toujours les informations de paiement. Un code de validation peut être exigé pour les retraits." },
    { id: "equitable", title: "5. Utilisation équitable", content: "L'utilisation uniquement pour des retraits sans dépôts peut entraîner des limitations ou un refus de service." },
    { id: "coupons", title: "6. Coupons et pronostics", content: "Les coupons publiés par les utilisateurs ne sont pas forcément rentables. Téléchargez et analysez chaque coupon avant de jouer. Vous jouez à vos propres risques." },
    { id: "frais", title: "7. Frais et commissions", content: "Certains services peuvent être sans frais. FASTXOF peut modifier ses frais si nécessaire." },
    { id: "fraude", title: "8. Lutte contre la fraude", content: "FASTXOF met en place des mesures pour prévenir la fraude, le blanchiment et l'utilisation abusive." },
    { id: "limitation", title: "9. Limitation de responsabilité", content: "FASTXOF n'est pas responsable des pertes liées aux paris, des pannes partenaires ou des retards opérateurs." },
    { id: "service", title: "10. Service client", content: "En cas de souci, contactez rapidement le service client via WhatsApp ou Telegram uniquement." },
    { id: "conformite", title: "11. Conformité et réglementation", content: "FASTXOF applique des règles de conformité, peut demander des documents (KYC), bloquer des transactions suspectes et coopérer avec les autorités si la loi l'exige." },
    { id: "modification", title: "12. Modification des conditions", content: "FASTXOF peut modifier les présentes conditions à tout moment." },
    { id: "acceptation", title: "13. Acceptation", content: "L'utilisation de FASTXOF vaut acceptation complète des présents Termes et Conditions." },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 py-6 sm:py-8 mb-6 sm:mb-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-foreground">
            TERMES ET CONDITIONS D'UTILISATION – FASTXOF
          </h1>
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : <strong>30 Janvier 2026</strong>
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of contents */}
          <nav className="lg:col-span-1" aria-label="Table des matières">
            <div className="sticky top-6 border border-border/50 rounded-2xl p-5 bg-card shadow-sm">
              <h2 className="text-sm font-bold mb-3 text-foreground">Sommaire</h2>
              <ul className="space-y-1.5 text-sm">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-primary hover:underline transition-colors text-xs leading-relaxed">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Content */}
          <article className="lg:col-span-3 border border-border/50 rounded-2xl p-6 sm:p-8 bg-card shadow-sm space-y-8">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className={i > 0 ? "pt-6 border-t border-border/30" : ""}>
                <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground">{s.title}</h2>
                <p className={`text-sm sm:text-base text-muted-foreground leading-relaxed${i === sections.length - 1 ? " font-semibold text-foreground" : ""}`}>
                  {s.content}
                </p>
              </section>
            ))}

            <footer className="pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center italic">
                Ceci constitue l'intégralité des termes et conditions régissant votre utilisation du service FASTXOF.
              </p>
            </footer>
          </article>
        </div>

        {/* Back button */}
        <div className="mt-8">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>
      </main>
    </div>
  )
}
