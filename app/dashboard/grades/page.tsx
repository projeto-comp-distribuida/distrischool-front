"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  GraduationCap,
  FileText,
  Settings,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"

function GradesPageContent() {
  const { user } = useAuth()
  const router = useRouter()

  const isStudent = user?.roles?.includes("STUDENT")
  const isTeacher = user?.roles?.includes("TEACHER")
  const isAdmin = user?.roles?.includes("ADMIN")

  useEffect(() => {
    // Redirect students to their grades page
    if (isStudent) {
      router.push("/dashboard/grades/my-grades")
    }
  }, [isStudent, router])

  if (isStudent) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="container mx-auto space-y-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <header>
          <h1 className="text-3xl font-semibold">Gerenciamento de Notas</h1>
          <p className="text-muted-foreground mt-2">
            Acesse as ferramentas de gestão de notas e avaliações
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/grades/manage')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gerenciar Notas
              </CardTitle>
              <CardDescription>
                Crie, edite e gerencie notas dos alunos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Acessar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/evaluations')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Avaliações
              </CardTitle>
              <CardDescription>
                Crie e gerencie avaliações para suas turmas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Acessar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Relatórios
                </CardTitle>
                <CardDescription>
                  Visualize relatórios e estatísticas de notas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" disabled>
                  Em breve
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GradesPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "STUDENT"]}>
      <GradesPageContent />
    </ProtectedRoute>
  )
}


