"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import type { UserRole } from '@/types/auth.types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['ADMIN'],
  fallbackPath = '/' 
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user && allowedRoles.length > 0) {
      const hasAccess = user.roles.some(role => allowedRoles.includes(role))
      
      if (!hasAccess) {
        console.warn(`Access denied. Required roles: ${allowedRoles.join(', ')}. User has: ${user.roles.join(', ')}`)
        router.push(fallbackPath)
        return
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, fallbackPath, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (user && allowedRoles.length > 0) {
    const hasAccess = user.roles.some(role => allowedRoles.includes(role))
    
    if (!hasAccess) {
      return null
    }
  }

  return <>{children}</>
}

