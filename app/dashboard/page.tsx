"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Users,
  GraduationCap,
  LogOut,
  RefreshCw,
  NotebookPen,
  ClipboardList,
} from "lucide-react"
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
    console.log('sessionStorage currentUser:', sessionStorage.getItem('currentUser'))
    console.log('sessionStorage authToken:', sessionStorage.getItem('authToken'))
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Students Card */}
          {(userRole === 'ADMIN' || userRole === 'TEACHER') && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/students')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <GraduationCap className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl">Estudantes</CardTitle>
                </div>
                <CardDescription>
                  Gerencie alunos, matrículas e informações acadêmicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Acessar</Button>
              </CardContent>
            </Card>
          )}

          {/* Classes Card */}
          {(userRole === 'ADMIN' || userRole === 'TEACHER' || userRole === 'STUDENT') && (
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push('/dashboard/classes')}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <NotebookPen className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl">Turmas</CardTitle>
                </div>
                <CardDescription>
                  {userRole === 'STUDENT'
                    ? 'Visualize seu cronograma e professores responsáveis'
                    : 'Organize cronogramas, participantes e próximos encontros'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant={userRole === 'STUDENT' ? 'outline' : 'default'}>
                  {userRole === 'STUDENT' ? 'Ver turmas' : 'Gerenciar'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Teachers Card */}
          {(userRole === 'ADMIN' || userRole === 'TEACHER') && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/teachers')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-primary" />
                  <CardTitle className="text-2xl">Professores</CardTitle>
                </div>
                <CardDescription>
                  Gerencie professores, atribuições e horários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Acessar</Button>
              </CardContent>
            </Card>
          )}

          {/* Grades Card */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/dashboard/grades')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <ClipboardList className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Notas</CardTitle>
              </div>
              <CardDescription>
                {userRole === 'STUDENT'
                  ? 'Consulte suas avaliações e feedbacks dos professores'
                  : 'Acompanhe e edite notas para cada avaliação'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {userRole === 'STUDENT' ? 'Ver minhas notas' : 'Abrir gerenciamento'}
              </Button>
            </CardContent>
          </Card>

          {/* My Profile Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/profile')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <BookOpen className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Meu Perfil</CardTitle>
              </div>
              <CardDescription>
                Visualize e edite suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">Acessar</Button>
            </CardContent>
          </Card>
        </div>

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

