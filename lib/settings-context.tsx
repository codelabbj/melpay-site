"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { settingApi } from "./api-client"
import type { Setting } from "./types"

interface SettingsContextType {
  settings: Setting | null
  isLoading: boolean
  isHydrated: boolean
  refreshSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Setting | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  const loadSettings = async () => {
    try {
      const data = await settingApi.getSetting()
      setSettings(data)
      // Persist to localStorage for offline access
      localStorage.setItem("app_settings", JSON.stringify(data))
    } catch (error) {
      console.error("Failed to load settings:", error)
      // Try to load from localStorage if API fails
      const cachedSettings = localStorage.getItem("app_settings")
      if (cachedSettings && cachedSettings !== "undefined" && cachedSettings !== "null") {
        try {
          setSettings(JSON.parse(cachedSettings))
        } catch (parseError) {
          console.error("Failed to parse cached settings:", parseError)
        }
      }
    }
  }

  useEffect(() => {
    // Mark as hydrated first
    setIsHydrated(true)

    // Load cached settings immediately for faster initial render
    const cachedSettings = localStorage.getItem("app_settings")
    if (cachedSettings && cachedSettings !== "undefined" && cachedSettings !== "null") {
      try {
        setSettings(JSON.parse(cachedSettings))
      } catch (error) {
        console.error("Failed to parse cached settings:", error)
      }
    }

    // Then load fresh settings from API
    loadSettings().finally(() => {
      setIsLoading(false)
    })
  }, [])

  const refreshSettings = async () => {
    setIsLoading(true)
    await loadSettings()
    setIsLoading(false)
  }

  return (
    <SettingsContext.Provider value={{ settings, isLoading, isHydrated, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}