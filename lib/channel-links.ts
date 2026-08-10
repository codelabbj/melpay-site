/** Helpers liens support (même pattern TurainCash / Blaffa). */

export function formatWhatsAppLink(phone?: string | null, indicator?: string | null): string {
  if (!phone) return ""
  const cleanIndicator = (indicator || "").replace(/\D/g, "")
  const cleanPhone = String(phone).replace(/\D/g, "")
  if (!cleanPhone) return ""
  return `https://wa.me/${cleanIndicator}${cleanPhone}`
}

export function formatTelegramLink(telegram?: string | null): string {
  if (!telegram) return ""
  const value = String(telegram).trim()
  if (!value) return ""
  if (value.startsWith("http")) return value
  return `https://t.me/${value.replace(/^@/, "")}`
}
