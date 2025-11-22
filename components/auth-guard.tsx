"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

interface AuthGuardProps {
  children: React.ReactNode
};

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, accessToken, isLoading, refreshToken, user, fetchProfile } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while auth store is still loading
    if (isLoading) return

    // Redirect to login if not authenticated or no token
    if (!isAuthenticated || !accessToken || !refreshToken) {
      router.push("/")
      return
    }

    // Fetch profile if authenticated but profile not loaded
    if (isAuthenticated && accessToken && !user) {
      fetchProfile()
    }
  }, [isAuthenticated, accessToken, isLoading, router, user, fetchProfile])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!isAuthenticated || !accessToken || !refreshToken) {
    return null
  }

  return <>{children}</>
}
