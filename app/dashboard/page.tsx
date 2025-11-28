"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, GraduationCap, LogOut, RefreshCw, BookMarked, UserCheck, BarChart3 } from "lucide-react"
import { NotificationCenter } from "@/components/notification-center"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshUser = async () => {
    setIsRefreshing(true)
    try {
      console.log('🔄 Refreshing user data...')
      await refreshUser()
      console.log('✅ User data refreshed!')
    } catch (error) {
      console.error('❌ Failed to refresh user:', error)
    } finally {
      setIsRefreshing(false)
    }
  }
  
  const handleDebugInfo = () => {
    console.log('=== DEBUG INFO ===')
    console.log('User from context:', user)
    console.log('localStorage currentUser:', localStorage.getItem('currentUser'))
    console.log('localStorage authToken:', localStorage.getItem('authToken'))
    console.log('==================')
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

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

  if (!user) {
    return null
  }

  const userRole = user.roles[0]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            <span className="text-2xl font-bold">DistriSchool</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-muted-foreground">{userRole}</p>
            </div>
            <NotificationCenter isAdmin={userRole === 'ADMIN'} />
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo, {user.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Escolha uma seção para começar
          </p>
        </div>

        {/* Principal Actions - Most Used */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Students Card */}
            {userRole === 'ADMIN' && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/students')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    <CardTitle>Estudantes</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Gerencie alunos e matrículas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="sm">Acessar</Button>
                </CardContent>
              </Card>
            )}

            {/* Teachers Card */}
            {userRole === 'ADMIN' && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/teachers')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <CardTitle>Professores</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Gerencie professores e atribuições
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="sm">Acessar</Button>
                </CardContent>
              </Card>
            )}

            {/* Teacher Classes Card */}
            {userRole === 'TEACHER' && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/teacher/classes')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <CardTitle>Minhas Turmas</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Visualize suas turmas e faça chamadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="sm">Acessar</Button>
                </CardContent>
              </Card>
            )}

            {/* Student Classes Card */}
            {userRole === 'STUDENT' && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/courses')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <CardTitle>Minhas Disciplinas</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Visualize as disciplinas em que você está matriculado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="sm">Acessar</Button>
                </CardContent>
              </Card>
            )}

            {/* Student Grades Card */}
            {userRole === 'STUDENT' && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/grades/my-grades')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    <CardTitle>Minhas Notas</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Visualize suas notas e médias por disciplina
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="sm">Acessar</Button>
                </CardContent>
              </Card>
            )}

            {/* My Profile Card */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <CardTitle>Meu Perfil</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Visualize e edite suas informações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="sm" variant="outline">Acessar</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Section */}
        {userRole === 'ADMIN' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Gestão Acadêmica</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/courses')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <BookMarked className="h-6 w-6 text-primary" />
                    <CardTitle>Cursos e Disciplinas</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    Gerencie cursos, turmas, horários e chamadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="sm">Acessar</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Additional Admin Options */}
        {userRole === 'ADMIN' && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Outros</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/assignments')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Atribuições</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="sm" variant="outline">Acessar</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/reports/performance')}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Relatórios</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" size="sm" variant="outline">Acessar</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* User Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informações da Conta</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshUser}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDebugInfo}
                >
                  Debug
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Usuário</p>
                <p className="font-medium">{userRole}</p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}
              {user.documentNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{user.documentNumber}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status da Conta</p>
                <p className="font-medium">
                  {user.active ? (
                    <span className="text-green-600">Ativa</span>
                  ) : (
                    <span className="text-red-600">Inativa</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Verificado</p>
                <p className="font-medium">
                  {(user.emailVerified !== undefined ? user.emailVerified : user.active) ? (
                    <span className="text-green-600">Sim</span>
                  ) : (
                    <span className="text-yellow-600">Pendente</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

