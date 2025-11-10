"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Student, StudentStatus } from "@/types/student.types"

interface StudentFormProps {
  student?: Student | null
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function StudentForm({ student, onSubmit, onCancel, isLoading }: StudentFormProps) {
  const [formData, setFormData] = React.useState({
    fullName: student?.fullName || "",
    cpf: student?.cpf || "",
    email: student?.email || "",
    phone: student?.phone || "",
    birthDate: student?.birthDate || "",
    course: student?.course || "",
    semester: student?.semester?.toString() || "",
    enrollmentDate: student?.enrollmentDate || "",
    status: student?.status || "ACTIVE",
    notes: student?.notes || "",
  })

  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Clear errors when component is unmounted or when editing student changes
  React.useEffect(() => {
    return () => {
      setErrors({})
    }
  }, [student])

  const validateCPF = (cpf: string): string | null => {
    const digitsOnly = cpf.replace(/\D/g, '')
    
    if (digitsOnly.length === 0) {
      return null // CPF is optional for now, but we'll validate when it has content
    }
    
    if (digitsOnly.length !== 11) {
      return "CPF deve conter 11 dígitos"
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    
    const cpfError = validateCPF(formData.cpf)
    if (cpfError) {
      newErrors.cpf = cpfError
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    
    // Format CPF to remove any formatting characters
    const submitData = {
      ...formData,
      cpf: formData.cpf.replace(/\D/g, ''),
      semester: parseInt(formData.semester),
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
        {/* Personal Information */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>
        </div>

        <div>
          <Label htmlFor="fullName">Nome Completo *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => {
              // Only allow digits
              const value = e.target.value.replace(/\D/g, '')
              handleChange("cpf", value)
            }}
            placeholder="00000000000"
            maxLength={11}
            required
            className={errors.cpf ? "border-red-500" : ""}
          />
          {errors.cpf && (
            <p className="text-sm text-red-500 mt-1">{errors.cpf}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="85999999999"
            required
          />
        </div>

        <div>
          <Label htmlFor="birthDate">Data de Nascimento *</Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleChange("birthDate", e.target.value)}
            required
          />
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
              <SelectItem value="GRADUATED">Graduado</SelectItem>
              <SelectItem value="SUSPENDED">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Academic Information */}
        <div className="col-span-2 mt-4">
          <h3 className="text-lg font-semibold mb-4">Informações Acadêmicas</h3>
        </div>

        <div>
          <Label htmlFor="course">Curso *</Label>
          <Input
            id="course"
            value={formData.course}
            onChange={(e) => handleChange("course", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="semester">Semestre *</Label>
          <Input
            id="semester"
            type="number"
            min="1"
            max="10"
            value={formData.semester}
            onChange={(e) => handleChange("semester", e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="enrollmentDate">Data de Matrícula *</Label>
          <Input
            id="enrollmentDate"
            type="date"
            value={formData.enrollmentDate}
            onChange={(e) => handleChange("enrollmentDate", e.target.value)}
            required
          />
        </div>

        {/* Notes */}
        <div className="col-span-2 mt-4">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : student ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  )
}

