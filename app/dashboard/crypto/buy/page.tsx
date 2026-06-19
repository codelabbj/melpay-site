"use client"

import CryptoSelectionGrid from "@/components/crypto/CryptoSelectionGrid"

export default function BuyCryptoPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <CryptoSelectionGrid mode="buy" title="Achat de Crypto" />
    </div>
  )
}

