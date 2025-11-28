"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StudentForm } from "@/components/student-form"
import { studentService } from "@/services/student.service"
import type { Student, StudentStatus, CreateStudentRequest } from "@/types/student.types"
import { Plus, Search, Pencil, Trash2, RefreshCw, GraduationCap, ArrowLeft } from "lucide-react"

function StudentsPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [students, setStudents] = React.useState<Student[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<number | null>(null)
  
  // Pagination
  const [page, setPage] = React.useState(0)
  const [size, setSize] = React.useState(20)
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalElements, setTotalElements] = React.useState(0)
  
  // Filters
  const [searchName, setSearchName] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState<StudentStatus | "ALL">("ALL")
  const [filterCourse, setFilterCourse] = React.useState("")

  const fetchStudents = React.useCallback(async (customFilters?: {
    name?: string
    course?: string
    status?: StudentStatus | "ALL"
    page?: number
  }) => {
    setIsLoading(true)
    try {
      const currentSearchName = customFilters?.name ?? searchName
      const currentFilterCourse = customFilters?.course ?? filterCourse
      const currentFilterStatus = customFilters?.status ?? filterStatus
      const currentPage = customFilters?.page ?? page
      const currentSize = size
      
      let response
      
      if (currentSearchName || currentFilterCourse) {
        // Use search endpoint if filters are applied
        response = await studentService.search({
          name: currentSearchName || undefined,
          course: currentFilterCourse || undefined,
          status: currentFilterStatus !== "ALL" ? currentFilterStatus : undefined,
          page: currentPage,
          size: currentSize,
          sortBy: "id",
          direction: "ASC" as const,
        })
      } else if (currentFilterStatus !== "ALL") {
        // Use search with status filter
        response = await studentService.search({
          status: currentFilterStatus,
          page: currentPage,
          size: currentSize,
          sortBy: "id",
          direction: "ASC",
        })
      } else {
        // Use regular list endpoint
        response = await studentService.getAll({
          page: currentPage,
          size: currentSize,
          sortBy: "id",
          direction: "ASC",
        })
      }

      // Handle wrapped response from API Gateway
      // The backend returns { success: true, data: { content: [...], ... }, message: "..." }
      const data = (response as any).data || response
      setStudents(data.content || [])
      setTotalPages(data.totalPages || 0)
      setTotalElements(data.totalElements || 0)
    } catch (error) {
      console.error("Failed to fetch students:", error)
      alert("Erro ao carregar estudantes: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setIsLoading(false)
    }
  }, [page, size, filterStatus, filterCourse, searchName])

  React.useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleCreate = () => {
    setEditingStudent(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const userId = user?.id?.toString() || "admin-user"
      
      if (editingStudent) {
        // When updating, include the registrationNumber from the original student
        const updateData = {
          ...data,
          registrationNumber: editingStudent.registrationNumber
        }
        await studentService.update(editingStudent.id, updateData, userId)
        setIsDialogOpen(false)
        setEditingStudent(null)
        fetchStudents()
      } else {
        // Create new student
        await studentService.create(data, userId)
        setIsDialogOpen(false)
        setEditingStudent(null)
        
        // Reset filters and pagination to show the new student
        setSearchName("")
        setFilterStatus("ALL")
        setFilterCourse("")
        setPage(0)
        
        // Fetch the students list with reset filters
        await fetchStudents({ name: "", course: "", status: "ALL", page: 0 })
      }
    } catch (error) {
      console.error("Failed to save student:", error)
      alert("Erro ao salvar estudante: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (studentId: number) => {
    if (!confirm("Tem certeza que deseja excluir este estudante?")) return

    setIsSubmitting(true)
    try {
      const userId = user?.id?.toString() || "admin-user"
      await studentService.delete(studentId, userId)
      setDeleteConfirm(null)
      fetchStudents()
    } catch (error) {
      console.error("Failed to delete student:", error)
      alert("Erro ao excluir estudante: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    // Fetch with explicit current filter values to ensure they're used immediately
    await fetchStudents({
      name: searchName,
      course: filterCourse,
      status: filterStatus,
      page: 0
    })
    setPage(0)
  }

  const handleClearFilters = () => {
    setSearchName("")
    setFilterStatus("ALL")
    setFilterCourse("")
    setPage(0)
    // This will trigger useEffect which will call fetchStudents with empty filters
  }

  const handleRefresh = () => {
    fetchStudents()
  }

  const statusBadgeClass = (status: StudentStatus) => {
    const classes = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      GRADUATED: "bg-blue-100 text-blue-800",
      SUSPENDED: "bg-red-100 text-red-800",
    }
    return classes[status] || ""
  }

  const statusLabel = (status: StudentStatus) => {
    const labels = {
      ACTIVE: "Ativo",
      INACTIVE: "Inativo",
      GRADUATED: "Graduado",
      SUSPENDED: "Suspenso",
    }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Estudantes</h1>
            <p className="text-muted-foreground mt-1">
              Total: {totalElements} estudantes
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Estudante
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Busque e filtre estudantes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  placeholder="Buscar por nome..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Buscar por curso..."
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                />
              </div>
              <div>
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                    <SelectItem value="GRADUATED">Graduado</SelectItem>
                    <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="gap-2">
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
                <Button type="button" variant="outline" onClick={handleClearFilters}>
                  Limpar
                </Button>
                <Button type="button" variant="outline" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Estudantes</CardTitle>
            <CardDescription>
              Página {page + 1} de {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Carregando...</p>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum estudante encontrado</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Semestre</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.id}</TableCell>
                          <TableCell className="font-mono">{student.registrationNumber}</TableCell>
                          <TableCell className="font-medium">{student.fullName}</TableCell>
                          <TableCell className="font-mono">{student.cpf}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.course}</TableCell>
                          <TableCell>{student.semester}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(student.status)}`}>
                              {statusLabel(student.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(student)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm(student.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {page * size + 1} até {Math.min((page + 1) * size, totalElements)} de {totalElements}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Editar Estudante" : "Novo Estudante"}
              </DialogTitle>
              <DialogDescription>
                {editingStudent 
                  ? "Atualize as informações do estudante" 
                  : "Preencha os dados para criar um novo estudante"}
              </DialogDescription>
            </DialogHeader>
            <StudentForm
              student={editingStudent}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingStudent(null)
              }}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir este estudante? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Excluindo..." : "Excluir"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}

export default function StudentsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <StudentsPageContent />
    </ProtectedRoute>
  )
}

