'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { teacherService } from '@/services/teacher.service';
import { classService } from '@/services/class.service';
import { Teacher } from '@/types/teacher.types';
import { ClassEntity } from '@/types/class.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, UserPlus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Assignment {
    id: string;
    teacher: Teacher;
    class: ClassEntity;
}

export default function AssignmentsPage() {
    const router = useRouter();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [teachersResponse, classesResponse] = await Promise.all([
                teacherService.getAll(),
                classService.getAll(),
            ]);

            const teachersData = Array.isArray(teachersResponse)
                ? teachersResponse
                : (teachersResponse as any).content || [];
            const classesData = Array.isArray(classesResponse)
                ? classesResponse
                : (classesResponse as any).content || [];

            setTeachers(teachersData);
            setClasses(classesData);

            // Criar assignments mockados baseados nos dados reais
            // Em produção, isso viria de um endpoint específico
            const mockAssignments: Assignment[] = teachersData.slice(0, 5).map((teacher, index) => ({
                id: `assign-${index}`,
                teacher,
                class: classesData[index % classesData.length],
            }));
            setAssignments(mockAssignments);
        } catch (error) {
            toast.error('Erro ao carregar dados');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!selectedTeacherId || !selectedClassId) {
            toast.error('Selecione um professor e uma turma');
            return;
        }

        setSubmitting(true);
        try {
            const teacher = teachers.find(t => t.id.toString() === selectedTeacherId);
            const classEntity = classes.find(c => c.id.toString() === selectedClassId);

            if (!teacher || !classEntity) {
                toast.error('Professor ou turma não encontrados');
                return;
            }

            // Adicionar professor à turma
            await classService.addTeachers(classEntity.id, [teacher.id]);

            // Atualizar lista de assignments
            const newAssignment: Assignment = {
                id: `assign-${Date.now()}`,
                teacher,
                class: classEntity,
            };
            setAssignments([...assignments, newAssignment]);

            toast.success('Atribuição criada com sucesso!');
            setDialogOpen(false);
            setSelectedTeacherId('');
            setSelectedClassId('');
        } catch (error) {
            toast.error('Erro ao criar atribuição');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!confirm('Tem certeza que deseja remover esta atribuição?')) return;

        try {
            // Em produção, chamaria um endpoint específico para remover a atribuição
            setAssignments(assignments.filter(a => a.id !== assignmentId));
            toast.success('Atribuição removida com sucesso');
        } catch (error) {
            toast.error('Erro ao remover atribuição');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Atribuições</h1>
                    <p className="text-muted-foreground">
                        Gerencie as atribuições de professores às turmas
                    </p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Atribuição
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Atribuições</CardTitle>
                    <CardDescription>
                        Professores atribuídos às turmas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">Carregando...</div>
                    ) : assignments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>Nenhuma atribuição encontrada.</p>
                            <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Criar primeira atribuição
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Professor</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Turma</TableHead>
                                    <TableHead>Código da Turma</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.map((assignment) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell className="font-medium">
                                            {assignment.teacher.name}
                                        </TableCell>
                                        <TableCell>{assignment.teacher.email || '-'}</TableCell>
                                        <TableCell>{assignment.class.name}</TableCell>
                                        <TableCell className="font-mono">{assignment.class.code}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => handleDeleteAssignment(assignment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create Assignment Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Atribuição</DialogTitle>
                        <DialogDescription>
                            Atribua um professor a uma turma
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Professor</label>
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um professor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                            {teacher.name} - {teacher.employeeId}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Turma</label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma turma" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((classItem) => (
                                        <SelectItem key={classItem.id} value={classItem.id.toString()}>
                                            {classItem.name} - {classItem.code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateAssignment} disabled={submitting}>
                            {submitting ? 'Criando...' : 'Criar Atribuição'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
