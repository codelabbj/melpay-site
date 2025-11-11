"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Loader2, Bell } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image";
import logo from "@/public/logo.png"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userInitials = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-[#059669]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2563eb]/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 glass backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Top row with logo and user menu */}
          <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
            {/* Logo section */}
            <Link href="/dashboard" className="group flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 group-hover:scale-105 transition-all duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md group-hover:bg-primary/30 transition-all duration-300"></div>
                  <Image
                    src={logo}
                    alt="MELPAY logo"
                    className="relative rounded-xl h-10 sm:h-12 w-auto ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300"
                  />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold gradient-text tracking-tight">
                  MELPAY
                </h1>
              </div>
            </Link>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300 relative"
                asChild
              >
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full animate-pulse"></span>
                </Link>
              </Button>

              {/* Theme toggle for mobile */}
              <div className="sm:hidden">
                <ThemeToggle />
              </div>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full p-0 hover:scale-105 transition-all duration-300"
                  >
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/30 hover:ring-primary/50 transition-all duration-300">
                      <AvatarFallback className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground font-bold text-base sm:text-lg">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 sm:w-72 glass backdrop-blur-xl border-border/50 shadow-xl mt-2"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                        <AvatarFallback className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground font-bold text-lg">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-none truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <div className="p-2">
                    <DropdownMenuItem
                      asChild
                      className="rounded-lg cursor-pointer hover:bg-primary/10 focus:bg-primary/10 transition-colors p-3"
                    >
                      <Link href="/dashboard/profile" className="flex items-center">
                        <div className="p-2 rounded-lg bg-primary/10 mr-3">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">Profil</span>
                          <span className="text-xs text-muted-foreground">Gérer votre compte</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <div className="p-2">
                    <DropdownMenuItem
                      onClick={logout}
                      className="rounded-lg cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 text-destructive focus:text-destructive transition-colors p-3"
                    >
                      <div className="p-2 rounded-lg bg-destructive/10 mr-3">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Déconnexion</span>
                        <span className="text-xs text-muted-foreground">Se déconnecter du compte</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 relative z-10">{children}</main>
    </div>
  )
}
