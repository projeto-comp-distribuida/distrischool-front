'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { gradeService } from '@/services/grade.service';
import { evaluationService } from '@/services/evaluation.service';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { studentService } from '@/services/student.service';
import { scheduleService } from '@/services/schedule.service';
import { teacherService } from '@/services/teacher.service';
import { GradeResponseDTO, GradeRequestDTO, GradeStatus } from '@/types/grade.types';
import { Evaluation } from '@/types/evaluation.types';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Student } from '@/types/student.types';
import { Schedule } from '@/types/schedule.types';
import { Teacher } from '@/types/teacher.types';
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
import { GradeForm, GradeFormValues } from '@/components/grade-form';
import { BulkGradeEntry } from '@/components/bulk-grade-entry';
import { GradeStatusBadge } from '@/components/grade-status-badge';
import { AcademicPeriodSelector } from '@/components/academic-period-selector';
import { ProtectedRoute } from '@/components/protected-route';
import { getTeacherClasses, getTeacherIdFromUser, getTeacherIdFromUserAsync } from '@/lib/grade-helpers';
import { Plus, Edit, Trash2, ArrowLeft, Loader2, FileText, Users, Download } from 'lucide-react';
import { toast } from 'sonner';

function GradeManagementContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [grades, setGrades] = useState<GradeResponseDTO[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [teacherClasses, setTeacherClasses] = useState<number[]>([]);
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Dialog states
    const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [editingGrade, setEditingGrade] = useState<GradeResponseDTO | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({
        classId: undefined as number | undefined,
        evaluationId: undefined as number | undefined,
        academicYear: new Date().getFullYear(),
        academicSemester: 1,
    });

    const isAdmin = user?.roles?.includes('ADMIN');
    const isTeacher = user?.roles?.includes('TEACHER');
    const teacherId = getTeacherIdFromUser(user);

    useEffect(() => {
        if (user) {
            loadInitialData();
        }
    }, [user]);

    useEffect(() => {
        if (filters.classId) {
            loadEvaluations();
            loadStudents();
        }
    }, [filters.classId]);

    useEffect(() => {
        if (filters.classId && filters.evaluationId) {
            loadGrades();
        }
    }, [filters.classId, filters.evaluationId, filters.academicYear, filters.academicSemester]);

    const loadInitialData = async () => {
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
            
            // If teacher, filter classes they teach
            if (isTeacher && teacherId) {
                try {
                    const teacherClassesList = await getTeacherClasses(teacherId);
                    setTeacherClasses(teacherClassesList);
                    
                    // Also try to get teacher object
                    try {
                        const teacherData = await teacherService.getById(teacherId);
                        setTeacher(teacherData);
                    } catch (e) {
                        // Try by email
                        if (user?.email) {
                            const allTeachers = await teacherService.getAll();
                            const teachersArray = Array.isArray(allTeachers)
                                ? allTeachers
                                : (allTeachers as any).content || [];
                            const foundTeacher = teachersArray.find(
                                (t: Teacher) => t.email?.trim().toLowerCase() === user.email?.trim().toLowerCase()
                            );
                            if (foundTeacher) {
                                setTeacher(foundTeacher);
                            }
                        }
                    }
                    
                    // Filter classes
                    const filteredClasses = classesList.filter((cls: ClassEntity) =>
                        teacherClassesList.includes(cls.id)
                    );
                    setClasses(filteredClasses);
                } catch (error) {
                    console.error('Error loading teacher data:', error);
                    setClasses(classesList);
                }
            } else {
                setClasses(classesList);
            }
            
            setSubjects(subjectsList);
        } catch (error) {
            console.error('Error loading initial data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const loadEvaluations = async () => {
        if (!filters.classId) return;
        
        try {
            const evaluationsList = await evaluationService.getByClass(filters.classId);
            setEvaluations(evaluationsList);
        } catch (error) {
            console.error('Error loading evaluations:', error);
        }
    };

    const loadStudents = async () => {
        if (!filters.classId) return;
        
        try {
            const classData = await classService.getById(filters.classId);
            if (classData.studentIds && classData.studentIds.length > 0) {
                const studentPromises = classData.studentIds.map(id =>
                    studentService.getById(id).catch(() => null)
                );
                const studentsList = (await Promise.all(studentPromises)).filter(Boolean) as Student[];
                setStudents(studentsList);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadGrades = async () => {
        if (!filters.classId || !filters.evaluationId) return;
        
        try {
            const gradesResponse = await gradeService.getByEvaluation(filters.evaluationId, {
                page: 0,
                size: 1000,
            });
            const gradesList = Array.isArray(gradesResponse)
                ? gradesResponse
                : gradesResponse.content || [];
            
            // Filter by academic period
            const filteredGrades = gradesList.filter(
                (grade: GradeResponseDTO) =>
                    grade.academicYear === filters.academicYear &&
                    grade.academicSemester === filters.academicSemester &&
                    grade.classId === filters.classId
            );
            
            setGrades(filteredGrades);
        } catch (error) {
            console.error('Error loading grades:', error);
            toast.error('Erro ao carregar notas');
        }
    };

    const handleCreateGrade = () => {
        setEditingGrade(null);
        setIsGradeDialogOpen(true);
    };

    const handleEditGrade = (grade: GradeResponseDTO) => {
        setEditingGrade(grade);
        setIsGradeDialogOpen(true);
    };

    const handleBulkEntry = () => {
        if (!filters.classId || !filters.evaluationId) {
            toast.error('Selecione uma turma e uma avaliação primeiro');
            return;
        }
        setIsBulkDialogOpen(true);
    };

    const handleDeleteGrade = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta nota?')) {
            return;
        }

        try {
            await gradeService.delete(id, user?.id ? String(user.id) : undefined);
            toast.success('Nota excluída com sucesso!');
            loadGrades();
        } catch (error) {
            console.error('Error deleting grade:', error);
            toast.error('Erro ao excluir nota');
        }
    };

    const handleSubmitGrade = async (values: GradeFormValues) => {
        try {
            setSubmitting(true);
            
            // Get the correct teacher ID from teacher service (not auth service)
            let correctTeacherId = values.teacherId;
            if (!correctTeacherId && user) {
                correctTeacherId = await getTeacherIdFromUserAsync(user);
            }
            
            if (!correctTeacherId) {
                toast.error('Não foi possível identificar o professor. Verifique se você está cadastrado como professor.');
                return;
            }
            
            const gradeData: GradeRequestDTO = {
                studentId: values.studentId,
                teacherId: correctTeacherId,
                classId: values.classId,
                evaluationId: values.evaluationId,
                gradeValue: values.gradeValue,
                gradeDate: values.gradeDate,
                notes: values.notes,
                status: values.status,
                isAutomatic: values.isAutomatic,
                academicYear: values.academicYear,
                academicSemester: values.academicSemester,
            };

            if (editingGrade) {
                await gradeService.update(editingGrade.id, gradeData, user?.id ? String(user.id) : undefined);
                toast.success('Nota atualizada com sucesso!');
            } else {
                await gradeService.create(gradeData, user?.id ? String(user.id) : undefined);
                toast.success('Nota criada com sucesso!');
            }
            
            setIsGradeDialogOpen(false);
            setEditingGrade(null);
            loadGrades();
        } catch (error) {
            console.error('Error saving grade:', error);
            toast.error(`Erro ao ${editingGrade ? 'atualizar' : 'criar'} nota`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkSubmit = async (gradesToSubmit: GradeRequestDTO[]) => {
        try {
            setSubmitting(true);
            
            // Get the correct teacher ID from teacher service (not auth service)
            let correctTeacherId: number | null = null;
            if (user) {
                correctTeacherId = await getTeacherIdFromUserAsync(user);
            }
            
            if (!correctTeacherId) {
                toast.error('Não foi possível identificar o professor. Verifique se você está cadastrado como professor.');
                return;
            }
            
            // Submit grades sequentially to avoid overwhelming the API
            for (const gradeData of gradesToSubmit) {
                // Ensure all grades have the correct teacher ID
                const gradeWithCorrectTeacherId: GradeRequestDTO = {
                    ...gradeData,
                    teacherId: correctTeacherId,
                };
                await gradeService.create(gradeWithCorrectTeacherId, user?.id ? String(user.id) : undefined);
            }
            
            setIsBulkDialogOpen(false);
            loadGrades();
        } catch (error) {
            console.error('Error submitting bulk grades:', error);
            throw error; // Re-throw to let BulkGradeEntry handle the error
        } finally {
            setSubmitting(false);
        }
    };

    const getStudentName = (studentId: number) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.fullName : `Aluno ${studentId}`;
    };

    const getEvaluationName = (evaluationId: number) => {
        const evaluation = evaluations.find(e => e.id === evaluationId);
        return evaluation ? evaluation.name : `Avaliação ${evaluationId}`;
    };

    const selectedEvaluation = evaluations.find(e => e.id === filters.evaluationId);
    const existingGradesMap = new Map(
        grades.map(g => [g.studentId, g.gradeValue])
    );

    return (
        <div className="space-y-6 p-6">
            <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/grades')}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Notas</h1>
                    <p className="text-muted-foreground">
                        {isAdmin ? 'Gerencie notas de todas as turmas' : 'Gerencie notas das suas turmas'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleBulkEntry} disabled={!filters.classId || !filters.evaluationId}>
                        <Users className="mr-2 h-4 w-4" />
                        Entrada em Lote
                    </Button>
                    <Button onClick={handleCreateGrade} disabled={!filters.classId || !filters.evaluationId}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Nota
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Turma</label>
                            <Select
                                value={filters.classId ? String(filters.classId) : undefined}
                                onValueChange={(value) => {
                                    setFilters({ ...filters, classId: value ? Number(value) : undefined, evaluationId: undefined });
                                    setGrades([]);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a turma" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={String(cls.id)}>
                                            {cls.name} ({cls.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Avaliação</label>
                            <Select
                                value={filters.evaluationId ? String(filters.evaluationId) : undefined}
                                onValueChange={(value) => setFilters({ ...filters, evaluationId: value ? Number(value) : undefined })}
                                disabled={!filters.classId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a avaliação" />
                                </SelectTrigger>
                                <SelectContent>
                                    {evaluations.map((evaluation) => (
                                        <SelectItem key={evaluation.id} value={String(evaluation.id)}>
                                            {evaluation.name} ({evaluation.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <AcademicPeriodSelector
                        academicYear={filters.academicYear}
                        academicSemester={filters.academicSemester}
                        onYearChange={(year) => setFilters({ ...filters, academicYear: year })}
                        onSemesterChange={(semester) => setFilters({ ...filters, academicSemester: semester })}
                    />
                </CardContent>
            </Card>

            {/* Grades Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Notas</CardTitle>
                    <CardDescription>
                        {grades.length} nota(s) encontrada(s)
                        {selectedEvaluation && ` para ${selectedEvaluation.name}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !filters.classId || !filters.evaluationId ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Selecione uma turma e uma avaliação para visualizar as notas</p>
                        </div>
                    ) : grades.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhuma nota encontrada para esta avaliação</p>
                            <Button variant="outline" className="mt-4" onClick={handleCreateGrade}>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar primeira nota
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Aluno</TableHead>
                                    <TableHead>Avaliação</TableHead>
                                    <TableHead>Nota</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Observações</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grades.map((grade) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-medium">
                                            {getStudentName(grade.studentId)}
                                        </TableCell>
                                        <TableCell>{getEvaluationName(grade.evaluationId)}</TableCell>
                                        <TableCell>
                                            <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-semibold">
                                                {grade.gradeValue.toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(grade.gradeDate).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>
                                            <GradeStatusBadge status={grade.status} />
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate">
                                            {grade.notes || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditGrade(grade)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteGrade(grade.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Grade Dialog */}
            <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingGrade ? 'Editar Nota' : 'Nova Nota'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingGrade
                                ? 'Atualize as informações da nota'
                                : 'Preencha os dados para criar uma nova nota'}
                        </DialogDescription>
                    </DialogHeader>
                    <GradeForm
                        initialData={editingGrade}
                        onSubmit={handleSubmitGrade}
                        isLoading={submitting}
                        submitLabel={editingGrade ? 'Atualizar' : 'Criar'}
                        teacherId={teacherId || undefined}
                        classId={filters.classId}
                        evaluationId={filters.evaluationId}
                        academicYear={filters.academicYear}
                        academicSemester={filters.academicSemester}
                        onCancel={() => {
                            setIsGradeDialogOpen(false);
                            setEditingGrade(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Bulk Entry Dialog */}
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Entrada em Lote de Notas</DialogTitle>
                        <DialogDescription>
                            Preencha as notas para todos os alunos de uma vez
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEvaluation && filters.classId && teacherId && (
                        <BulkGradeEntry
                            students={students}
                            evaluation={selectedEvaluation}
                            classId={filters.classId}
                            teacherId={teacherId}
                            academicYear={filters.academicYear}
                            academicSemester={filters.academicSemester}
                            onSubmit={handleBulkSubmit}
                            existingGrades={existingGradesMap}
                            onCancel={() => setIsBulkDialogOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function GradeManagementPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
            <GradeManagementContent />
        </ProtectedRoute>
    );
}

