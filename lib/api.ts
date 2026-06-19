import axios from "axios"
import { toast } from "react-hot-toast"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
})

function detectLang(text: string) {
  const frenchWords = ["le", "la", "de", "pas", "pour", "avec", "est", "une", "des"]
  const score = frenchWords.filter((w) => text.toLowerCase().includes(w)).length
  return score > 1 ? "fr" : "en"
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  
  // Ensure fresh data with cache busting
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
  config.headers['Pragma'] = 'no-cache'
  config.headers['Expires'] = '0'
  
  // Add timestamp to prevent caching
  if (config.params) {
    config.params._t = Date.now()
  } else {
    config.params = { _t: Date.now() }
  }
  
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem("refresh_token")
        const res = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}auth/refresh`, { refresh })
        const newToken = res.data.access
        localStorage.setItem("access_token", newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = "/login"
      }
    }

    const defaultLang = "fr"
    const fallback =
      defaultLang === "fr" ? "Une erreur est survenue. Veuillez réessayer." : "An unexpected error occurred."

    // Only show a toast for simple string-level errors (detail/message).
    // Field-level errors like {"amount": [...]} are handled by the component itself.
    const simpleMsg =
      error.response?.data?.details ||
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.response?.data?.message

    const hasOnlyFieldErrors =
      error.response?.data &&
      typeof error.response.data === "object" &&
      !simpleMsg

    if (!hasOnlyFieldErrors) {
      const displayMsg = simpleMsg || fallback
      const lang = detectLang(displayMsg)
      toast.error(displayMsg, { style: { direction: "ltr" } })
    }

    // Always pass the original error through so components can read response.data
    return Promise.reject(error)
  },
)

export default api
