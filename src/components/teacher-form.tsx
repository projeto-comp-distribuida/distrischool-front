"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Teacher, TeacherStatus } from "@/types/teacher.types"

interface TeacherFormProps {
  teacher?: Teacher | null
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function TeacherForm({ teacher, onSubmit, onCancel, isLoading }: TeacherFormProps) {
  const [formData, setFormData] = React.useState({
    name: teacher?.name || "",
    employeeId: teacher?.employeeId || "",
    qualification: teacher?.qualification || "",
    contact: teacher?.contact || "",
    status: teacher?.status || "ACTIVE",
    hireDate: teacher?.hireDate || "",
  })

  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Clear errors when component is unmounted or when editing teacher changes
  React.useEffect(() => {
    return () => {
      setErrors({})
    }
  }, [teacher])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }
    
    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Matrícula é obrigatória"
    }
    
    if (!formData.qualification.trim()) {
      newErrors.qualification = "Qualificação é obrigatória"
    }
    
    if (!formData.contact.trim()) {
      newErrors.contact = "Contato é obrigatório"
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    
    const submitData = {
      name: formData.name.trim(),
      employeeId: formData.employeeId.trim(),
      qualification: formData.qualification.trim(),
      contact: formData.contact.trim(),
      status: formData.status as TeacherStatus,
      ...(formData.hireDate && { hireDate: formData.hireDate }),
    }
    
    await onSubmit(submitData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold mb-4">Informações do Professor</h3>
        </div>

        <div>
          <Label htmlFor="name">Nome Completo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="employeeId">Matrícula (Employee ID) *</Label>
          <Input
            id="employeeId"
            value={formData.employeeId}
            onChange={(e) => handleChange("employeeId", e.target.value.toUpperCase())}
            placeholder="TCH-0001"
            required
            className={errors.employeeId ? "border-red-500" : ""}
          />
          {errors.employeeId && (
            <p className="text-sm text-red-500 mt-1">{errors.employeeId}</p>
          )}
        </div>

        <div>
          <Label htmlFor="qualification">Qualificação *</Label>
          <Input
            id="qualification"
            value={formData.qualification}
            onChange={(e) => handleChange("qualification", e.target.value)}
            placeholder="Ex: Mestre em Matemática"
            required
            className={errors.qualification ? "border-red-500" : ""}
          />
          {errors.qualification && (
            <p className="text-sm text-red-500 mt-1">{errors.qualification}</p>
          )}
        </div>

        <div>
          <Label htmlFor="contact">Contato (Email ou Telefone) *</Label>
          <Input
            id="contact"
            value={formData.contact}
            onChange={(e) => handleChange("contact", e.target.value)}
            placeholder="professor@escola.com ou (85) 99999-9999"
            required
            className={errors.contact ? "border-red-500" : ""}
          />
          {errors.contact && (
            <p className="text-sm text-red-500 mt-1">{errors.contact}</p>
          )}
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleChange("status", value)}
            required
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
              <SelectItem value="ON_LEAVE">Em Licença</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="hireDate">Data de Contratação</Label>
          <Input
            id="hireDate"
            type="date"
            value={formData.hireDate}
            onChange={(e) => handleChange("hireDate", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : teacher ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

