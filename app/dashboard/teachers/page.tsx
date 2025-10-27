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
import { TeacherForm } from "@/components/teacher-form"
import { teacherService } from "@/services/teacher.service"
import type { Teacher, TeacherStatus } from "@/types/teacher.types"
import { Plus, Search, Pencil, Trash2, RefreshCw, GraduationCap } from "lucide-react"

function TeachersPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [teachers, setTeachers] = React.useState<Teacher[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [editingTeacher, setEditingTeacher] = React.useState<Teacher | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState<number | null>(null)
  
  // Pagination
  const [page, setPage] = React.useState(0)
  const [size, setSize] = React.useState(20)
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalElements, setTotalElements] = React.useState(0)
  
  // Filters
  const [searchName, setSearchName] = React.useState("")
  const [filterStatus, setFilterStatus] = React.useState<TeacherStatus | "ALL">("ALL")
  const [filterSubject, setFilterSubject] = React.useState("")

  const fetchTeachers = React.useCallback(async (customFilters?: {
    name?: string
    subject?: string
    status?: TeacherStatus | "ALL"
    page?: number
  }) => {
    setIsLoading(true)
    try {
      const currentSearchName = customFilters?.name ?? searchName
      const currentFilterSubject = customFilters?.subject ?? filterSubject
      const currentFilterStatus = customFilters?.status ?? filterStatus
      const currentPage = customFilters?.page ?? page
      const currentSize = size
      
      let response
      
      // Check if filters are applied
      if (currentFilterSubject) {
        // Use search by subject endpoint
        response = await teacherService.getBySubject(currentFilterSubject)
        // This endpoint doesn't support pagination, so we handle it as a simple array
        const teachers = Array.isArray(response) ? response : []
        setTeachers(teachers)
        setTotalPages(1)
        setTotalElements(teachers.length)
      } else if (currentFilterStatus !== "ALL") {
        // Use search by status endpoint
        response = await teacherService.getByStatus(currentFilterStatus)
        const teachers = Array.isArray(response) ? response : []
        setTeachers(teachers)
        setTotalPages(1)
        setTotalElements(teachers.length)
      } else {
        // Use regular list endpoint with pagination
        response = await teacherService.getAll({
          page: currentPage,
          size: currentSize,
          sortBy: "id",
          direction: "ASC" as const,
        })
        
        // Handle both paginated and non-paginated responses
        if (response && typeof response === 'object') {
          if ('content' in response) {
            // Paginated response
            const data = response as any
            setTeachers(data.content || [])
            setTotalPages(data.totalPages || 0)
            setTotalElements(data.totalElements || 0)
          } else if (Array.isArray(response)) {
            // Simple array response
            setTeachers(response)
            setTotalPages(1)
            setTotalElements(response.length)
          } else {
            setTeachers([])
            setTotalPages(0)
            setTotalElements(0)
          }
        } else {
          setTeachers([])
          setTotalPages(0)
          setTotalElements(0)
        }
      }
      
      // Filter by name if provided (client-side filtering for simple arrays)
      if (currentSearchName && Array.isArray(response)) {
        const filtered = (response as Teacher[]).filter(teacher => 
          teacher.name.toLowerCase().includes(currentSearchName.toLowerCase())
        )
        setTeachers(filtered)
        setTotalElements(filtered.length)
      }
      
    } catch (error) {
      console.error("Failed to fetch teachers:", error)
      alert("Erro ao carregar professores: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setIsLoading(false)
    }
  }, [page, size, filterStatus, filterSubject, searchName])

  React.useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const handleCreate = () => {
    setEditingTeacher(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      if (editingTeacher) {
        await teacherService.update(editingTeacher.id, data)
        setIsDialogOpen(false)
        setEditingTeacher(null)
        fetchTeachers()
      } else {
        await teacherService.create(data)
        setIsDialogOpen(false)
        setEditingTeacher(null)
        
        // Reset filters and pagination to show the new teacher
        setSearchName("")
        setFilterStatus("ALL")
        setFilterSubject("")
        setPage(0)
        
        // Fetch the teachers list with reset filters
        await fetchTeachers({ name: "", subject: "", status: "ALL", page: 0 })
      }
    } catch (error) {
      console.error("Failed to save teacher:", error)
      alert("Erro ao salvar professor: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (teacherId: number) => {
    if (!confirm("Tem certeza que deseja excluir este professor?")) return

    setIsSubmitting(true)
    try {
      await teacherService.delete(teacherId)
      setDeleteConfirm(null)
      fetchTeachers()
    } catch (error) {
      console.error("Failed to delete teacher:", error)
      alert("Erro ao excluir professor: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    // Fetch with explicit current filter values to ensure they're used immediately
    await fetchTeachers({
      name: searchName,
      subject: filterSubject,
      status: filterStatus,
      page: 0
    })
    setPage(0)
  }

  const handleClearFilters = () => {
    setSearchName("")
    setFilterStatus("ALL")
    setFilterSubject("")
    setPage(0)
    // This will trigger useEffect which will call fetchTeachers with empty filters
  }

  const handleRefresh = () => {
    fetchTeachers()
  }

  const statusBadgeClass = (status?: TeacherStatus) => {
    const classes: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      ON_LEAVE: "bg-yellow-100 text-yellow-800",
    }
    return classes[status || "ACTIVE"] || ""
  }

  const statusLabel = (status?: TeacherStatus) => {
    const labels: Record<string, string> = {
      ACTIVE: "Ativo",
      INACTIVE: "Inativo",
      ON_LEAVE: "Em Licença",
    }
    return labels[status || "ACTIVE"] || status
  }

  return (
    <div className="min-h-screen p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gerenciamento de Professores</h1>
            <p className="text-muted-foreground mt-1">
              Total: {totalElements} professores
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Professor
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Busque e filtre professores</CardDescription>
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
                  placeholder="Buscar por disciplina..."
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
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
                    <SelectItem value="ON_LEAVE">Em Licença</SelectItem>
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

        {/* Teachers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Professores</CardTitle>
            <CardDescription>
              Página {page + 1} de {totalPages || 1}
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
            ) : teachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum professor encontrado</p>
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
                        <TableHead>Qualificação</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell>{teacher.id}</TableCell>
                          <TableCell className="font-mono">{teacher.employeeId}</TableCell>
                          <TableCell className="font-medium">{teacher.name}</TableCell>
                          <TableCell>{teacher.qualification}</TableCell>
                          <TableCell>{teacher.contact}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(teacher.status)}`}>
                              {statusLabel(teacher.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(teacher)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm(teacher.id)}
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
                {totalPages > 1 && (
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
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? "Editar Professor" : "Novo Professor"}
              </DialogTitle>
              <DialogDescription>
                {editingTeacher 
                  ? "Atualize as informações do professor" 
                  : "Preencha os dados para criar um novo professor"}
              </DialogDescription>
            </DialogHeader>
            <TeacherForm
              teacher={editingTeacher}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingTeacher(null)
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
                  Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita.
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

export default function TeachersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
      <TeachersPageContent />
    </ProtectedRoute>
  )
}

