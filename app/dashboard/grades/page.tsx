"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import type { UserRole } from "@/types/auth.types"
import { gradeService } from "@/services/grade.service"
import { studentService } from "@/services/student.service"
import { subjectService } from "@/services/subject.service"
import { Grade, GradeStatus } from "@/types/grade.types"
import { toast } from "sonner"
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
  ClipboardList,
  Edit3,
  FileSpreadsheet,
  GraduationCap,
  Lock,
  Save,
  Loader2,
} from "lucide-react"

type GradeRecord = {
  id: string
  studentId: string
  studentName: string
  subject: string
  assessment: string
  grade: number
  status: GradeStatus
  feedback: string
  lastUpdated: string
}

// Helper function to calculate status from grade
const calculateStatus = (grade: number): GradeStatus => {
  if (grade >= 7.0) return "Aprovado"
  if (grade >= 5.0) return "Em recuperação"
  return "Requer atenção"
}

const statusStyles: Record<GradeStatus, string> = {
  Aprovado: "bg-emerald-100 text-emerald-700",
  "Em recuperação": "bg-amber-100 text-amber-700",
  "Requer atenção": "bg-rose-100 text-rose-700",
}

function GradesPageContent() {
  const { user } = useAuth()

  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<GradeRecord | null>(null)
  const [editGradeValue, setEditGradeValue] = useState<string>("")
  const [editFeedbackValue, setEditFeedbackValue] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    loadGrades()
  }, [user])

  const loadGrades = async () => {
    if (!user) return

    setLoading(true)
    try {
      const primaryRole = (user.roles?.[0] ?? "STUDENT") as UserRole
      const isStudent = primaryRole === "STUDENT"
      
      // Fetch grades based on role
      let gradesResponse
      if (isStudent && user.id) {
        gradesResponse = await gradeService.getByStudent(Number(user.id), { size: 100 })
      } else {
        gradesResponse = await gradeService.getAll({ size: 100 })
      }

      const gradesData = gradesResponse.content || []
      
      // Fetch student and subject names if not included in grade response
      const gradeRecords: GradeRecord[] = await Promise.all(
        gradesData.map(async (grade: Grade) => {
          let studentName = grade.studentName
          let subjectName = grade.subjectName

          // Fetch student name if not provided
          if (!studentName && grade.studentId) {
            try {
              const student = await studentService.getById(grade.studentId)
              studentName = student.fullName
            } catch (error) {
              console.error(`Failed to fetch student ${grade.studentId}:`, error)
              studentName = `Estudante ${grade.studentId}`
            }
          }

          // Fetch subject name if not provided
          if (!subjectName && grade.subjectId) {
            try {
              const subject = await subjectService.getById(grade.subjectId)
              subjectName = subject.name
            } catch (error) {
              console.error(`Failed to fetch subject ${grade.subjectId}:`, error)
              subjectName = `Disciplina ${grade.subjectId}`
            }
          }

          return {
            id: String(grade.id),
            studentId: String(grade.studentId),
            studentName: studentName || `Estudante ${grade.studentId}`,
            subject: subjectName || `Disciplina ${grade.subjectId}`,
            assessment: grade.assessment,
            grade: grade.grade,
            status: grade.status || calculateStatus(grade.grade),
            feedback: grade.feedback || "",
            lastUpdated: grade.updatedAt 
              ? new Date(grade.updatedAt).toLocaleString("pt-BR")
              : grade.createdAt 
                ? new Date(grade.createdAt).toLocaleString("pt-BR")
                : new Date().toLocaleString("pt-BR"),
          }
        })
      )

      setGrades(gradeRecords)
    } catch (error) {
      console.error("Failed to load grades:", error)
      toast.error("Erro ao carregar notas")
      setGrades([])
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const primaryRole = (user.roles?.[0] ?? "STUDENT") as UserRole
  const isStudent = primaryRole === "STUDENT"
  const canEdit = primaryRole === "ADMIN" || primaryRole === "TEACHER"
  const currentUserId = String(user.id ?? "current")

  const viewableGrades = useMemo(() => {
    if (isStudent) {
      return grades.filter((grade) => grade.studentId === currentUserId)
    }
    return grades
  }, [grades, isStudent, currentUserId])

  const overallAverage = useMemo(() => {
    if (viewableGrades.length === 0) return 0
    const total = viewableGrades.reduce((sum, grade) => sum + grade.grade, 0)
    return Number((total / viewableGrades.length).toFixed(1))
  }, [viewableGrades])

  const approvedCount = useMemo(
    () => viewableGrades.filter((grade) => grade.status === "Aprovado").length,
    [viewableGrades],
  )

  const attentionCount = useMemo(
    () => viewableGrades.filter((grade) => grade.status !== "Aprovado").length,
    [viewableGrades],
  )

  const handleOpenEditDialog = (record: GradeRecord) => {
    setEditingRecord(record)
    setEditGradeValue(String(record.grade))
    setEditFeedbackValue(record.feedback)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRecord) return

    const parsedGrade = Number(editGradeValue.replace(",", "."))
    if (Number.isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 10) {
      toast.error("Informe uma nota entre 0 e 10.")
      return
    }

    setSaving(true)
    try {
      const gradeId = Number(editingRecord.id)
      await gradeService.update(gradeId, {
        grade: parsedGrade,
        feedback: editFeedbackValue,
      })

      // Reload grades to get updated data
      await loadGrades()
      
      toast.success("Nota atualizada com sucesso!")
      setIsEditDialogOpen(false)
      setEditingRecord(null)
    } catch (error) {
      console.error("Failed to update grade:", error)
      toast.error("Erro ao atualizar nota")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="container mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Gerenciamento de Notas</h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho acadêmico. Estudantes possuem visualização somente.
            </p>
          </div>
          {canEdit ? (
            <Button className="gap-2" variant="default" disabled>
              <FileSpreadsheet className="h-4 w-4" />
              Importar planilha
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              Alterações restritas a professores e administradores.
            </div>
          )}
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média geral</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{overallAverage.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Cálculo sobre as avaliações visíveis para você
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status aprovado</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Quantidade de registros em situação positiva</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acompanhamento</CardTitle>
              <Edit3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{attentionCount}</div>
              <p className="text-xs text-muted-foreground">Registros que pedem revisão ou reforço</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modo de acesso</CardTitle>
              {isStudent ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Edit3 className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {isStudent ? "Somente leitura" : "Edição habilitada"}
              </div>
              <p className="text-xs text-muted-foreground">
                {isStudent
                  ? "Entre em contato com a coordenação para dúvidas."
                  : "Você pode editar notas e feedbacks."}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Notas por estudante</CardTitle>
            <CardDescription>
              {isStudent
                ? "Visualize suas avaliações registradas. A edição não está disponível para estudantes."
                : "Clique em editar para alterar a nota e feedback da avaliação."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : viewableGrades.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/40 p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma avaliação disponível para o seu perfil neste momento.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudante</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead>Nota</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Feedback</TableHead>
                      <TableHead className="hidden md:table-cell">Atualizado em</TableHead>
                      {canEdit && <TableHead className="text-right">Ação</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewableGrades.map((register) => (
                      <TableRow key={register.id}>
                        <TableCell className="font-medium">{register.studentName}</TableCell>
                        <TableCell>{register.subject}</TableCell>
                        <TableCell>{register.assessment}</TableCell>
                        <TableCell>
                          <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm">
                            {register.grade.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[register.status]}`}>
                            {register.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {register.feedback}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {register.lastUpdated}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => handleOpenEditDialog(register)}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nota</DialogTitle>
            <DialogDescription>
              Ajuste a nota e o feedback da avaliação. As alterações serão salvas no sistema.
            </DialogDescription>
          </DialogHeader>
          {editingRecord ? (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p>
                  <span className="font-medium">Estudante:</span> {editingRecord.studentName}
                </p>
                <p>
                  <span className="font-medium">Disciplina:</span> {editingRecord.subject}
                </p>
                <p>
                  <span className="font-medium">Avaliação:</span> {editingRecord.assessment}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade-value">Nota</Label>
                <Input
                  id="grade-value"
                  inputMode="decimal"
                  value={editGradeValue}
                  onChange={(event) => setEditGradeValue(event.target.value)}
                  placeholder="Ex.: 8.5"
                />
                <p className="text-xs text-muted-foreground">
                  Utilize ponto ou vírgula. O sistema valida notas entre 0 e 10.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="grade-feedback">Feedback</Label>
                <textarea
                  id="grade-feedback"
                  rows={4}
                  value={editFeedbackValue}
                  onChange={(event) => setEditFeedbackValue(event.target.value)}
                  placeholder="Oriente o estudante sobre os próximos passos."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Escolha um registro na tabela para editar.
            </p>
          )}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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


