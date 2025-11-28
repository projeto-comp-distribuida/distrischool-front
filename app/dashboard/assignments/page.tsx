'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { teacherService } from '@/services/teacher.service';
import { classService } from '@/services/class.service';
import { Teacher } from '@/types/teacher.types';
import { ClassEntity } from '@/types/class.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, UserPlus, Trash2, Users, Search, RefreshCw, UserCheck, Loader2, Briefcase } from 'lucide-react';
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
    const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    
    // Filters
    const [searchTeacher, setSearchTeacher] = useState('');
    const [searchClass, setSearchClass] = useState('');

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
            // classService.getAll() now returns ClassEntity[] directly
            const classesData = classesResponse;

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
            setFilteredAssignments(mockAssignments);
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
            const updatedAssignments = [...assignments, newAssignment];
            setAssignments(updatedAssignments);
            setFilteredAssignments(updatedAssignments);

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
            const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
            setAssignments(updatedAssignments);
            setFilteredAssignments(updatedAssignments);
            toast.success('Atribuição removida com sucesso');
        } catch (error) {
            toast.error('Erro ao remover atribuição');
        }
    };

    const applyFilters = () => {
        let filtered = [...assignments];

        if (searchTeacher) {
            filtered = filtered.filter(assignment =>
                assignment.teacher.name.toLowerCase().includes(searchTeacher.toLowerCase()) ||
                assignment.teacher.email?.toLowerCase().includes(searchTeacher.toLowerCase())
            );
        }

        if (searchClass) {
            filtered = filtered.filter(assignment =>
                assignment.class.name.toLowerCase().includes(searchClass.toLowerCase()) ||
                assignment.class.code.toLowerCase().includes(searchClass.toLowerCase())
            );
        }

        setFilteredAssignments(filtered);
    };

    const handleClearFilters = () => {
        setSearchTeacher('');
        setSearchClass('');
        setFilteredAssignments(assignments);
    };

    const handleRefresh = () => {
        loadData();
    };

    useEffect(() => {
        applyFilters();
    }, [searchTeacher, searchClass, assignments]);

    return (
        <div className="space-y-8 p-6">
            <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
            </Button>
            {/* Header com gradiente */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                    <Briefcase className="h-8 w-8" />
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight">Atribuições</h1>
                            </div>
                            <p className="text-amber-100 text-lg">
                                Gerencie as atribuições de professores às turmas
                            </p>
                        </div>
                        <Button 
                            onClick={() => setDialogOpen(true)}
                            size="lg"
                            className="bg-white text-amber-600 hover:bg-amber-50 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Nova Atribuição
                        </Button>
                    </div>
                    <div className="mt-6 flex items-center gap-6">
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <UserCheck className="h-5 w-5" />
                            <span className="font-semibold">{filteredAssignments.length}</span>
                            <span className="text-amber-100">atribuições cadastradas</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Filters */}
            <Card className="border-2 shadow-lg transition-all duration-300 hover:shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Filtros de Busca</CardTitle>
                    </div>
                    <CardDescription className="text-base">Busque e filtre atribuições de forma rápida e eficiente</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Professor</label>
                            <Input
                                placeholder="Buscar por professor..."
                                value={searchTeacher}
                                onChange={(e) => setSearchTeacher(e.target.value)}
                                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Turma</label>
                            <Input
                                placeholder="Buscar por turma..."
                                value={searchClass}
                                onChange={(e) => setSearchClass(e.target.value)}
                                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="flex gap-2 items-end">
                            <Button type="submit" className="gap-2 h-11 flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-300">
                                <Search className="h-4 w-4" />
                                Buscar
                            </Button>
                            <Button type="button" variant="outline" onClick={handleClearFilters} className="h-11">
                                Limpar
                            </Button>
                            <Button type="button" variant="outline" onClick={handleRefresh} disabled={loading} className="h-11">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Lista de Atribuições */}
            <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        Lista de Atribuições
                    </CardTitle>
                    <CardDescription className="text-base">
                        Professores atribuídos às turmas
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground text-lg">Carregando atribuições...</p>
                        </div>
                    ) : filteredAssignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <Briefcase className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Nenhuma atribuição encontrada</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                {assignments.length === 0 
                                    ? "Comece criando sua primeira atribuição para vincular professores às turmas."
                                    : "Nenhuma atribuição corresponde aos filtros aplicados. Tente ajustar sua busca."}
                            </p>
                            {assignments.length === 0 && (
                                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Criar Primeira Atribuição
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Professor</TableHead>
                                        <TableHead className="font-semibold">Email</TableHead>
                                        <TableHead className="font-semibold">Turma</TableHead>
                                        <TableHead className="font-semibold">Código da Turma</TableHead>
                                        <TableHead className="text-right font-semibold">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAssignments.map((assignment) => (
                                        <TableRow 
                                            key={assignment.id}
                                            className="transition-all duration-200 hover:bg-muted/50 cursor-pointer"
                                        >
                                            <TableCell className="font-semibold text-base">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                    <Users className="h-5 w-5 text-primary" />
                                                    {assignment.teacher.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{assignment.teacher.email || <span className="text-muted-foreground italic">Sem email</span>}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-sm font-medium">
                                                    {assignment.class.name}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                                    {assignment.class.code}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:bg-destructive/10 transition-colors"
                                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
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
