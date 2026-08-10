import api from "./api"
import type { AuthResponse } from "./types"

export interface GoogleAuthResult {
  success: boolean
  error?: string
  data?: any
}

/**
 * Lance le flow Google Sign-In via Google Identity Services popup.
 * Envoie l'id_token à POST /auth/google-login
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    const idToken = await new Promise<string | null>((resolve) => {
      if (typeof window === "undefined" || !(window as any).google) {
        resolve(null)
        return
      }
      ;(window as any).google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        callback: (response: { credential: string }) => {
          resolve(response.credential)
        },
      })
      ;(window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          resolve(null)
        }
      })
    })

    if (!idToken) {
      return { success: false, error: "Connexion Google annulée" }
    }

    const response = await api.post<AuthResponse>("/auth/google-login", { id_token: idToken })
    const { access, refresh, data } = response.data

    localStorage.setItem("access_token", access)
    localStorage.setItem("refresh_token", refresh)
    localStorage.setItem("user_data", JSON.stringify(data))

    return { success: true, data }
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Erreur lors de la connexion avec Google"
    return { success: false, error: message }
  }
}
