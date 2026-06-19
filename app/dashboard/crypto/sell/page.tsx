"use client"

import CryptoSelectionGrid from "@/components/crypto/CryptoSelectionGrid"

export default function SellCryptoPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <CryptoSelectionGrid mode="sale" title="Vente de Crypto" />
    </div>
  )
}

