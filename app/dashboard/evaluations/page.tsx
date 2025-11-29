'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { evaluationService } from '@/services/evaluation.service';
import { Evaluation, EvaluationType, EvaluationFilters } from '@/types/evaluation.types';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { scheduleService } from '@/services/schedule.service';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Schedule } from '@/types/schedule.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { EvaluationForm, EvaluationFormValues } from '@/components/evaluation-form';
import { ProtectedRoute } from '@/components/protected-route';
import { Plus, Edit, Trash2, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const evaluationTypeLabels: Record<EvaluationType, string> = {
    [EvaluationType.EXAM]: 'Prova',
    [EvaluationType.QUIZ]: 'Quiz',
    [EvaluationType.ASSIGNMENT]: 'Trabalho',
    [EvaluationType.PROJECT]: 'Projeto',
    [EvaluationType.PRESENTATION]: 'Apresentação',
    [EvaluationType.PARTICIPATION]: 'Participação',
    [EvaluationType.FINAL]: 'Prova Final',
    [EvaluationType.OTHER]: 'Outro',
};

function EvaluationsPageContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teacherClasses, setTeacherClasses] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState<EvaluationFilters>({
        academicYear: new Date().getFullYear(),
        academicSemester: 1,
    });

    const isAdmin = user?.roles?.includes('ADMIN');
    const isTeacher = user?.roles?.includes('TEACHER');

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, filters]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Load classes and subjects
            const [classesResponse, subjectsResponse] = await Promise.all([
                classService.getAll(),
                subjectService.getAll(),
            ]);
            
            const classesList = Array.isArray(classesResponse)
                ? classesResponse
                : (classesResponse as any).content || [];
            const subjectsList = Array.isArray(subjectsResponse)
                ? subjectsResponse
                : (subjectsResponse as any).content || [];
            
            setClasses(classesList);
            setSubjects(subjectsList);

            // If teacher, filter classes they teach
            if (isTeacher && user?.id) {
                try {
                    const schedulesResponse = await scheduleService.getAll();
                    const allSchedules = Array.isArray(schedulesResponse)
                        ? schedulesResponse
                        : (schedulesResponse as any).content || [];
                    
                    // Find teacher by user ID or email
                    let teacherId: number | null = null;
                    try {
                        const userId = Number(user.id);
                        if (!isNaN(userId)) {
                            // Try to use user ID as teacher ID
                            teacherId = userId;
                        }
                    } catch (e) {
                        // If that fails, we'll filter by schedules
                    }
                    
                    const teacherSchedules = teacherId
                        ? allSchedules.filter((s: Schedule) => s.teacherId === teacherId)
                        : [];
                    
                    const classIds = new Set(teacherSchedules.map((s: Schedule) => s.classId || s.classEntity?.id).filter(Boolean));
                    setTeacherClasses(Array.from(classIds) as number[]);
                } catch (error) {
                    console.error('Error loading teacher classes:', error);
                }
            }

            // Load evaluations
            const evaluationsList = await evaluationService.getAll(filters);
            setEvaluations(evaluationsList);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erro ao carregar avaliações');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingEvaluation(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (evaluation: Evaluation) => {
        setEditingEvaluation(evaluation);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta avaliação?')) {
            return;
        }

        try {
            await evaluationService.delete(id);
            toast.success('Avaliação excluída com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error deleting evaluation:', error);
            toast.error('Erro ao excluir avaliação');
        }
    };

    const handleSubmit = async (values: EvaluationFormValues) => {
        try {
            setSubmitting(true);
            
            if (editingEvaluation) {
                await evaluationService.update(editingEvaluation.id, values);
                toast.success('Avaliação atualizada com sucesso!');
            } else {
                await evaluationService.create(values);
                toast.success('Avaliação criada com sucesso!');
            }
            
            setIsDialogOpen(false);
            setEditingEvaluation(null);
            loadData();
        } catch (error) {
            console.error('Error saving evaluation:', error);
            toast.error(`Erro ao ${editingEvaluation ? 'atualizar' : 'criar'} avaliação`);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter evaluations based on teacher access
    const visibleEvaluations = isAdmin
        ? evaluations
        : isTeacher
        ? evaluations.filter(e => teacherClasses.includes(e.classId))
        : [];

    const getClassName = (classId: number) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? `${cls.name} (${cls.code})` : `Turma ${classId}`;
    };

    const getSubjectName = (subjectId: number) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? subject.name : `Disciplina ${subjectId}`;
    };

    return (
        <div className="space-y-6 p-6">
            <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Avaliações</h1>
                    <p className="text-muted-foreground">
                        Crie e gerencie avaliações para suas turmas
                    </p>
                </div>
                {(isAdmin || isTeacher) && (
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Avaliação
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Ano Letivo</label>
                            <Input
                                type="number"
                                min="2000"
                                value={filters.academicYear || ''}
                                onChange={(e) => setFilters({ ...filters, academicYear: Number(e.target.value) || undefined })}
                                placeholder={String(new Date().getFullYear())}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Semestre</label>
                            <Select
                                value={filters.academicSemester ? String(filters.academicSemester) : undefined}
                                onValueChange={(value) => setFilters({ ...filters, academicSemester: Number(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1º Semestre</SelectItem>
                                    <SelectItem value="2">2º Semestre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Turma</label>
                            <Select
                                value={filters.classId ? String(filters.classId) : 'all'}
                                onValueChange={(value) => setFilters({ ...filters, classId: value === 'all' ? undefined : Number(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {(isAdmin ? classes : classes.filter(c => teacherClasses.includes(c.id))).map((cls) => (
                                        <SelectItem key={cls.id} value={String(cls.id)}>
                                            {cls.name} ({cls.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Disciplina</label>
                            <Select
                                value={filters.subjectId ? String(filters.subjectId) : 'all'}
                                onValueChange={(value) => setFilters({ ...filters, subjectId: value === 'all' ? undefined : Number(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={String(subject.id)}>
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Evaluations Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Avaliações</CardTitle>
                    <CardDescription>
                        {visibleEvaluations.length} avaliação(ões) encontrada(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : visibleEvaluations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma avaliação encontrada</p>
                            {(isAdmin || isTeacher) && (
                                <Button variant="outline" className="mt-4" onClick={handleCreate}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Criar primeira avaliação
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Turma</TableHead>
                                    <TableHead>Disciplina</TableHead>
                                    <TableHead>Ano/Semestre</TableHead>
                                    <TableHead>Nota Máx.</TableHead>
                                    {(isAdmin || isTeacher) && <TableHead className="text-right">Ações</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleEvaluations.map((evaluation) => (
                                    <TableRow key={evaluation.id}>
                                        <TableCell className="font-medium">{evaluation.name}</TableCell>
                                        <TableCell>
                                            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs">
                                                {evaluationTypeLabels[evaluation.type]}
                                            </span>
                                        </TableCell>
                                        <TableCell>{getClassName(evaluation.classId)}</TableCell>
                                        <TableCell>{getSubjectName(evaluation.subjectId)}</TableCell>
                                        <TableCell>
                                            {evaluation.academicYear}/{evaluation.academicSemester}
                                        </TableCell>
                                        <TableCell>{evaluation.maxGrade.toFixed(1)}</TableCell>
                                        {(isAdmin || isTeacher) && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(evaluation)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(evaluation.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEvaluation ? 'Editar Avaliação' : 'Nova Avaliação'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingEvaluation
                                ? 'Atualize as informações da avaliação'
                                : 'Preencha os dados para criar uma nova avaliação'}
                        </DialogDescription>
                    </DialogHeader>
                    <EvaluationForm
                        initialData={editingEvaluation}
                        onSubmit={handleSubmit}
                        isLoading={submitting}
                        submitLabel={editingEvaluation ? 'Atualizar' : 'Criar'}
                        onCancel={() => {
                            setIsDialogOpen(false);
                            setEditingEvaluation(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function EvaluationsPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
            <EvaluationsPageContent />
        </ProtectedRoute>
    );
}

