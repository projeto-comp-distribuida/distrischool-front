"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import type { UserRole } from "@/types/auth.types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  MapPin,
  NotebookPen,
  Plus,
  Users,
} from "lucide-react"

type ClassScheduleItem = {
  weekday: string
  start: string
  end: string
  room: string
}

type ClassSession = {
  date: string
  topic: string
  resources: string[]
  status: "Agendada" | "Concluída" | "Cancelada"
}

type ClassStudent = {
  name: string
  progress: "Excelente" | "Bom" | "Em atenção"
  attendanceRate: number
}

type ClassMock = {
  id: string
  name: string
  course: string
  gradeLevel: string
  mainTeacher: string
  assistants: string[]
  schedule: ClassScheduleItem[]
  studentsCount: number
  status: "Em andamento" | "Encerrada" | "Planejada"
  nextSessions: ClassSession[]
  students: ClassStudent[]
  description: string
  room: string
}

const mockClasses: ClassMock[] = [
  {
    id: "TURMA-MAT-3A",
    name: "Matemática Aplicada",
    course: "Engenharia de Software",
    gradeLevel: "3º semestre",
    mainTeacher: "Marina Albuquerque",
    assistants: ["Paulo Lima"],
    schedule: [
      { weekday: "Segunda-feira", start: "08:00", end: "09:40", room: "Bloco B - 203" },
      { weekday: "Quarta-feira", start: "08:00", end: "09:40", room: "Bloco B - 203" },
    ],
    studentsCount: 32,
    status: "Em andamento",
    nextSessions: [
      {
        date: "12/11/2025",
        topic: "Modelagem de Funções e Derivadas",
        resources: ["Slides em PDF", "Lista de exercícios", "Simulação em GeoGebra"],
        status: "Agendada",
      },
      {
        date: "15/11/2025",
        topic: "Aplicações em Otimização",
        resources: ["Estudo de caso", "Vídeo demonstrativo"],
        status: "Agendada",
      },
    ],
    students: [
      { name: "Ana Souza", progress: "Excelente", attendanceRate: 96 },
      { name: "Bruno Costa", progress: "Bom", attendanceRate: 88 },
      { name: "Carla Santos", progress: "Em atenção", attendanceRate: 72 },
    ],
    description:
      "Turma focada em conectar conceitos matemáticos com problemas reais da engenharia. Inclui laboratórios práticos e avaliações continuadas.",
    room: "Bloco B - 203",
  },
  {
    id: "TURMA-HIS-2B",
    name: "História Contemporânea",
    course: "Licenciatura em História",
    gradeLevel: "2º semestre",
    mainTeacher: "Renato Farias",
    assistants: ["Luciana Viana"],
    schedule: [
      { weekday: "Terça-feira", start: "10:00", end: "11:40", room: "Bloco C - 110" },
      { weekday: "Quinta-feira", start: "10:00", end: "11:40", room: "Bloco C - 110" },
    ],
    studentsCount: 28,
    status: "Em andamento",
    nextSessions: [
      {
        date: "14/11/2025",
        topic: "Guerras Mundiais e seus impactos",
        resources: ["Mapas interativos", "Documentário indicado"],
        status: "Agendada",
      },
    ],
    students: [
      { name: "Diego Martins", progress: "Bom", attendanceRate: 90 },
      { name: "Fernanda Lopes", progress: "Excelente", attendanceRate: 98 },
      { name: "Ricardo Menezes", progress: "Bom", attendanceRate: 84 },
    ],
    description:
      "Turma com abordagem híbrida, combinando debates em sala com atividades em ambientes virtuais. Avaliações formativas a cada módulo.",
    room: "Bloco C - 110",
  },
  {
    id: "TURMA-LAB-1C",
    name: "Laboratório de Projetos Integradores",
    course: "Ciência da Computação",
    gradeLevel: "1º semestre",
    mainTeacher: "Patrícia Nascimento",
    assistants: [],
    schedule: [
      { weekday: "Sexta-feira", start: "14:00", end: "17:30", room: "LAB Maker" },
    ],
    studentsCount: 24,
    status: "Planejada",
    nextSessions: [
      {
        date: "22/11/2025",
        topic: "Kick-off dos times e definição de escopo",
        resources: ["Canvas do projeto", "Guia de metodologias ágeis"],
        status: "Agendada",
      },
    ],
    students: [
      { name: "Equipe Alpha", progress: "Bom", attendanceRate: 0 },
      { name: "Equipe Beta", progress: "Bom", attendanceRate: 0 },
    ],
    description:
      "Espaço para ideação e prototipagem rápida. Cada equipe trabalha em um desafio real orientado por mentores do mercado.",
    room: "Laboratório Maker",
  },
]

function ClassesPageContent() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  const primaryRole = (user.roles?.[0] ?? "STUDENT") as UserRole
  const canManage = primaryRole === "ADMIN" || primaryRole === "TEACHER"

  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    mockClasses.length > 0 ? mockClasses[0].id : null,
  )
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const selectedClass = useMemo(
    () => mockClasses.find((cls) => cls.id === selectedClassId) ?? null,
    [selectedClassId],
  )

  const summary = useMemo(() => {
    const active = mockClasses.filter((cls) => cls.status === "Em andamento").length
    const planned = mockClasses.filter((cls) => cls.status === "Planejada").length
    const students = mockClasses.reduce((sum, cls) => sum + cls.studentsCount, 0)
    const averageOccupancy = mockClasses.length > 0 ? Math.round(students / mockClasses.length) : 0

    return {
      active,
      planned,
      students,
      averageOccupancy,
    }
  }, [])

  const statusClassName = (status: ClassMock["status"]) => {
    const base = "px-2 py-1 text-xs font-medium rounded-full"
    switch (status) {
      case "Em andamento":
        return `${base} bg-green-100 text-green-700`
      case "Planejada":
        return `${base} bg-blue-100 text-blue-700`
      case "Encerrada":
      default:
        return `${base} bg-gray-100 text-gray-700`
    }
  }

  const handleOpenDetails = (classId: string) => {
    setSelectedClassId(classId)
    setIsDetailsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="container mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Gerenciamento de Turmas</h1>
            <p className="text-muted-foreground">
              Acompanhe o status das turmas, próximas aulas e engajamento dos estudantes.
            </p>
          </div>
          {canManage && (
            <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova turma mock
            </Button>
          )}
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turmas ativas</CardTitle>
              <NotebookPen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.active}</div>
              <p className="text-xs text-muted-foreground">Em andamento neste período</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turmas planejadas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.planned}</div>
              <p className="text-xs text-muted-foreground">Com início previsto nas próximas semanas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estudantes engajados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.students}</div>
              <p className="text-xs text-muted-foreground">Somatória de matrículas nas turmas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média por turma</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.averageOccupancy} alunos</div>
              <p className="text-xs text-muted-foreground">Distribuição média de estudantes</p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Lista de turmas</CardTitle>
            <CardDescription>
              Visualize as turmas em andamento e acesse detalhes. Ações de edição são mockadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Professor(a)</TableHead>
                    <TableHead className="hidden lg:table-cell">Horários</TableHead>
                    <TableHead className="hidden lg:table-cell">Estudantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Próxima aula</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.course}</TableCell>
                      <TableCell>{cls.mainTeacher}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {cls.schedule.map((item) => (
                            <div key={`${cls.id}-${item.weekday}`} className="flex items-center gap-2">
                              <span>{item.weekday}</span>
                              <span className="font-mono text-xs">
                                {item.start} - {item.end}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{cls.studentsCount}</TableCell>
                      <TableCell>
                        <span className={statusClassName(cls.status)}>{cls.status}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm leading-tight">
                          {cls.nextSessions[0]?.date ?? "—"}
                          <div className="text-xs text-muted-foreground">
                            {cls.nextSessions[0]?.topic ?? "Sem conteúdo definido"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={canManage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleOpenDetails(cls.id)}
                        >
                          {canManage ? "Gerenciar" : "Ver detalhes"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximas aulas</CardTitle>
            <CardDescription>Resumo dos próximos encontros organizados por turma.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mockClasses.flatMap((cls) =>
                cls.nextSessions.map((session) => (
                  <Card key={`${cls.id}-${session.date}`}>
                    <CardHeader className="space-y-1">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">{cls.name}</CardTitle>
                        <span className={statusClassName(cls.status)}>{session.status}</span>
                      </div>
                      <CardDescription>{session.topic}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>{session.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{cls.room}</span>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Recursos previstos:</p>
                        <ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">
                          {session.resources.map((resource) => (
                            <li key={resource}>{resource}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedClass?.name}</DialogTitle>
            <DialogDescription>
              Informações mockadas para demonstrar como a gestão de turmas pode se comportar.
            </DialogDescription>
          </DialogHeader>
          {selectedClass ? (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Curso</p>
                  <p className="text-base font-semibold">{selectedClass.course}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Professor responsável</p>
                  <p className="text-base font-semibold">{selectedClass.mainTeacher}</p>
                  {selectedClass.assistants.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Apoio: {selectedClass.assistants.join(", ")}
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Horários</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {selectedClass.schedule.map((slot) => (
                    <div key={`${selectedClass.id}-${slot.weekday}`} className="rounded-md border bg-muted/40 p-3">
                      <p className="font-medium">{slot.weekday}</p>
                      <p className="font-mono text-sm">
                        {slot.start} - {slot.end}
                      </p>
                      <p className="text-sm text-muted-foreground">{slot.room}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                  Estudantes em destaque
                </h3>
                <div className="mt-3 space-y-2">
                  {selectedClass.students.map((student) => (
                    <div
                      key={`${selectedClass.id}-${student.name}`}
                      className="flex flex-col gap-1 rounded-md border bg-muted/30 p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Progresso: {student.progress}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Frequência: {student.attendanceRate}%
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                  Observações pedagógicas
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {selectedClass.description}
                </p>
              </section>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecione uma turma na tabela para visualizar detalhes.
            </p>
          )}
          <DialogFooter className="pt-4">
            {canManage && (
              <Button type="button" variant="secondary">
                Simular edição da turma
              </Button>
            )}
            <Button type="button" onClick={() => setIsDetailsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova turma (mock)</DialogTitle>
            <DialogDescription>
              Formulário demonstrativo para ilustrar a criação de uma turma. Não persiste dados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="class-name">Nome da turma</Label>
              <Input id="class-name" placeholder="Ex.: Física Experimental" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="class-course">Curso</Label>
              <Input id="class-course" placeholder="Curso vinculado" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="class-teacher">Professor responsável</Label>
              <Input id="class-teacher" placeholder="Nome do(a) professor(a)" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="class-start">Data prevista de início</Label>
              <Input id="class-start" type="date" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled>
              Salvar mock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ClassesPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "TEACHER", "STUDENT"]}>
      <ClassesPageContent />
    </ProtectedRoute>
  )
}


