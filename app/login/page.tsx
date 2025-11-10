"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/contexts/auth-context"
import { BookOpen } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const hasNotifiedRef = useRef(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true
      toast.info("Você já está autenticado.", {
        description: "Redirecionando você para o painel.",
      })
      router.replace("/dashboard")
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="h-8 w-8" />
            <span className="text-2xl font-bold">EduPortal</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Enter your credentials to access your account</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground mt-6">
          {"Don't have an account? "}
          <Link href="/register" className="text-foreground font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
