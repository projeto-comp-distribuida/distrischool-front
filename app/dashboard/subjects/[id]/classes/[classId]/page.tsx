'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { evaluationService } from '@/services/evaluation.service';
import { gradeService } from '@/services/grade.service';
import { studentService } from '@/services/student.service';
import { scheduleService } from '@/services/schedule.service';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Evaluation, EvaluationType } from '@/types/evaluation.types';
import { GradeResponseDTO, GradeRequestDTO } from '@/types/grade.types';
import { Student } from '@/types/student.types';
import { Schedule } from '@/types/schedule.types';
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
import { Breadcrumbs } from '@/components/breadcrumbs';
import { EvaluationForm, EvaluationFormValues } from '@/components/evaluation-form';
import { GradeForm, GradeFormValues } from '@/components/grade-form';
import { BulkGradeEntry } from '@/components/bulk-grade-entry';
import { GradeStatusBadge } from '@/components/grade-status-badge';
import { AcademicPeriodSelector } from '@/components/academic-period-selector';
import { ProtectedRoute } from '@/components/protected-route';
import { getTeacherIdFromUser, getTeacherIdFromUserAsync } from '@/lib/grade-helpers';
import { getSchedulesForClass } from '@/lib/subject-class-helpers';
import { 
    Plus, 
    Edit, 
    Trash2, 
    Loader2, 
    FileText, 
    Users, 
    Clock, 
    Calendar,
    MapPin,
    ClipboardCheck,
    GraduationCap,
    BookOpen
} from 'lucide-react';
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

const dayLabels: Record<string, string> = {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
};

type TabType = 'evaluations' | 'grades' | 'students' | 'schedules';

function ClassDetailContent() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const subjectId = Number(params.id);
    const classId = Number(params.classId);
    
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classEntity, setClassEntity] = useState<ClassEntity | null>(null);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [grades, setGrades] = useState<GradeResponseDTO[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('evaluations');
    
    // Dialog states
    const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
    const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
    const [editingGrade, setEditingGrade] = useState<GradeResponseDTO | null>(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Filters
    const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
    const [academicSemester, setAcademicSemester] = useState(1);
    const [evaluationFilter, setEvaluationFilter] = useState<number | undefined>(undefined);

    const isAdmin = user?.roles?.includes('ADMIN');
    const isTeacher = user?.roles?.includes('TEACHER');
    const teacherId = getTeacherIdFromUser(user);

    useEffect(() => {
        if (subjectId && classId) {
            loadData();
        }
    }, [subjectId, classId, academicYear, academicSemester, evaluationFilter]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [subjectData, classData, schedulesResponse] = await Promise.all([
                subjectService.getById(subjectId),
                classService.getById(classId),
                scheduleService.getAll(),
            ]);

            setSubject(subjectData);
            setClassEntity(classData);
            
            const schedulesData = (schedulesResponse as any).content || (Array.isArray(schedulesResponse) ? schedulesResponse : []);
            const classSchedules = getSchedulesForClass(classId, schedulesData);
            setSchedules(classSchedules);

            // Load students
            if (classData.studentIds && classData.studentIds.length > 0) {
                const studentPromises = classData.studentIds.map(id =>
                    studentService.getById(id).catch(() => null)
                );
                const studentsList = (await Promise.all(studentPromises)).filter(Boolean) as Student[];
                setStudents(studentsList);
            }

            // Load evaluations
            const evaluationsList = await evaluationService.getByClass(classId);
            const filteredEvaluations = evaluationsList.filter(
                e => e.academicYear === academicYear && e.academicSemester === academicSemester
            );
            setEvaluations(filteredEvaluations);

            // Load grades if evaluation is selected
            if (evaluationFilter) {
                const gradesResponse = await gradeService.getByEvaluation(evaluationFilter, {
                    page: 0,
                    size: 1000,
                });
                const gradesList = Array.isArray(gradesResponse)
                    ? gradesResponse
                    : gradesResponse.content || [];
                
                const filteredGrades = gradesList.filter(
                    (grade: GradeResponseDTO) =>
                        grade.academicYear === academicYear &&
                        grade.academicSemester === academicSemester &&
                        grade.classId === classId
                );
                setGrades(filteredGrades);
            } else {
                setGrades([]);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvaluation = () => {
        setEditingEvaluation(null);
        setIsEvaluationDialogOpen(true);
    };

    const handleEditEvaluation = (evaluation: Evaluation) => {
        setEditingEvaluation(evaluation);
        setIsEvaluationDialogOpen(true);
    };

    const handleDeleteEvaluation = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

        try {
            await evaluationService.delete(id);
            toast.success('Avaliação excluída com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error deleting evaluation:', error);
            toast.error('Erro ao excluir avaliação');
        }
    };

    const handleSubmitEvaluation = async (values: EvaluationFormValues) => {
        try {
            setSubmitting(true);
            
            if (editingEvaluation) {
                await evaluationService.update(editingEvaluation.id, values);
                toast.success('Avaliação atualizada com sucesso!');
            } else {
                await evaluationService.create(values);
                toast.success('Avaliação criada com sucesso!');
            }
            
            setIsEvaluationDialogOpen(false);
            setEditingEvaluation(null);
            loadData();
        } catch (error) {
            console.error('Error saving evaluation:', error);
            toast.error(`Erro ao ${editingEvaluation ? 'atualizar' : 'criar'} avaliação`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateGrade = () => {
        if (!evaluationFilter) {
            toast.error('Selecione uma avaliação primeiro');
            return;
        }
        setEditingGrade(null);
        setIsGradeDialogOpen(true);
    };

    const handleEditGrade = (grade: GradeResponseDTO) => {
        setEditingGrade(grade);
        setIsGradeDialogOpen(true);
    };

    const handleDeleteGrade = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta nota?')) return;

        try {
            await gradeService.delete(id, user?.id ? String(user.id) : undefined);
            toast.success('Nota excluída com sucesso!');
            loadData();
        } catch (error) {
            console.error('Error deleting grade:', error);
            toast.error('Erro ao excluir nota');
        }
    };

    const handleBulkEntry = () => {
        if (!evaluationFilter) {
            toast.error('Selecione uma avaliação primeiro');
            return;
        }
        setIsBulkDialogOpen(true);
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
            loadData();
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
            
            for (const gradeData of gradesToSubmit) {
                // Ensure all grades have the correct teacher ID
                const gradeWithCorrectTeacherId: GradeRequestDTO = {
                    ...gradeData,
                    teacherId: correctTeacherId,
                };
                await gradeService.create(gradeWithCorrectTeacherId, user?.id ? String(user.id) : undefined);
            }
            
            setIsBulkDialogOpen(false);
            loadData();
            toast.success(`${gradesToSubmit.length} nota(s) salva(s) com sucesso!`);
        } catch (error) {
            console.error('Error submitting bulk grades:', error);
            toast.error('Erro ao salvar notas');
        } finally {
            setSubmitting(false);
        }
    };

    const getStudentName = (studentId: number) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.fullName : `Aluno ${studentId}`;
    };

    const existingGradesMap = new Map(
        grades.map(g => [g.studentId, g.gradeValue])
    );

    const selectedEvaluationObj = evaluations.find(e => e.id === evaluationFilter);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-lg">Carregando...</p>
            </div>
        );
    }

    if (!subject || !classEntity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-muted-foreground text-lg">Dados não encontrados</p>
                <Button onClick={() => router.push('/dashboard/courses')} className="mt-4">
                    Voltar para Cursos
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6">
            <Breadcrumbs
                items={[
                    { label: 'Cursos', href: '/dashboard/courses' },
                    { label: subject.name, href: `/dashboard/subjects/${subjectId}/classes` },
                    { label: classEntity.name },
                ]}
            />

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                    <BookOpen className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">{classEntity.name}</h1>
                                    <p className="text-blue-100 text-lg mt-1">{subject.name} • {classEntity.code}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <Users className="h-5 w-5" />
                            <span className="font-semibold">{students.length}</span>
                            <span className="text-blue-100">alunos</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <FileText className="h-5 w-5" />
                            <span className="font-semibold">{evaluations.length}</span>
                            <span className="text-blue-100">avaliações</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <Clock className="h-5 w-5" />
                            <span className="font-semibold">{schedules.length}</span>
                            <span className="text-blue-100">horários</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <Button
                    variant={activeTab === 'evaluations' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('evaluations')}
                    className="rounded-b-none"
                >
                    <FileText className="mr-2 h-4 w-4" />
                    Avaliações
                </Button>
                <Button
                    variant={activeTab === 'grades' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('grades')}
                    className="rounded-b-none"
                >
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Notas
                </Button>
                <Button
                    variant={activeTab === 'students' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('students')}
                    className="rounded-b-none"
                >
                    <Users className="mr-2 h-4 w-4" />
                    Alunos
                </Button>
                <Button
                    variant={activeTab === 'schedules' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('schedules')}
                    className="rounded-b-none"
                >
                    <Clock className="mr-2 h-4 w-4" />
                    Horários
                </Button>
            </div>

            {/* Academic Period Selector */}
            <Card>
                <CardContent className="pt-6">
                    <AcademicPeriodSelector
                        academicYear={academicYear}
                        academicSemester={academicSemester}
                        onYearChange={setAcademicYear}
                        onSemesterChange={setAcademicSemester}
                    />
                </CardContent>
            </Card>

            {/* Evaluations Tab */}
            {activeTab === 'evaluations' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Avaliações</CardTitle>
                                <CardDescription>
                                    {evaluations.length} avaliação(ões) cadastrada(s) para {academicYear}/{academicSemester}º semestre
                                </CardDescription>
                            </div>
                            {(isAdmin || isTeacher) && (
                                <Button onClick={handleCreateEvaluation}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova Avaliação
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {evaluations.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhuma avaliação encontrada</p>
                                {(isAdmin || isTeacher) && (
                                    <Button variant="outline" className="mt-4" onClick={handleCreateEvaluation}>
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
                                        <TableHead>Nota Máx.</TableHead>
                                        <TableHead>Peso</TableHead>
                                        {(isAdmin || isTeacher) && <TableHead className="text-right">Ações</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {evaluations.map((evaluation) => (
                                        <TableRow key={evaluation.id}>
                                            <TableCell className="font-medium">{evaluation.name}</TableCell>
                                            <TableCell>
                                                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs">
                                                    {evaluationTypeLabels[evaluation.type]}
                                                </span>
                                            </TableCell>
                                            <TableCell>{evaluation.maxGrade.toFixed(1)}</TableCell>
                                            <TableCell>{evaluation.weight ? `${evaluation.weight}%` : '-'}</TableCell>
                                            {(isAdmin || isTeacher) && (
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditEvaluation(evaluation)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteEvaluation(evaluation.id)}
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
            )}

            {/* Grades Tab */}
            {activeTab === 'grades' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Notas</CardTitle>
                                <CardDescription>
                                    Gerencie as notas dos alunos para esta turma
                                </CardDescription>
                            </div>
                            {(isAdmin || isTeacher) && (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleBulkEntry} disabled={!evaluationFilter}>
                                        <Users className="mr-2 h-4 w-4" />
                                        Entrada em Lote
                                    </Button>
                                    <Button onClick={handleCreateGrade} disabled={!evaluationFilter}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nova Nota
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Evaluation Selector */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Selecione a Avaliação</label>
                            <Select
                                value={evaluationFilter ? String(evaluationFilter) : undefined}
                                onValueChange={(value) => {
                                    const evalId = value ? Number(value) : undefined;
                                    setEvaluationFilter(evalId);
                                    setSelectedEvaluation(evalId ? evaluations.find(e => e.id === evalId) || null : null);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma avaliação" />
                                </SelectTrigger>
                                <SelectContent>
                                    {evaluations.map((evaluation) => (
                                        <SelectItem key={evaluation.id} value={String(evaluation.id)}>
                                            {evaluation.name} ({evaluationTypeLabels[evaluation.type]})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {!evaluationFilter ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Selecione uma avaliação para visualizar as notas</p>
                            </div>
                        ) : grades.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhuma nota encontrada para esta avaliação</p>
                                {(isAdmin || isTeacher) && (
                                    <Button variant="outline" className="mt-4" onClick={handleCreateGrade}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar primeira nota
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aluno</TableHead>
                                        <TableHead>Nota</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Observações</TableHead>
                                        {(isAdmin || isTeacher) && <TableHead className="text-right">Ações</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {grades.map((grade) => (
                                        <TableRow key={grade.id}>
                                            <TableCell className="font-medium">
                                                {getStudentName(grade.studentId)}
                                            </TableCell>
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
                                            {(isAdmin || isTeacher) && (
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
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Alunos</CardTitle>
                        <CardDescription>
                            {students.length} aluno(s) matriculado(s) nesta turma
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {students.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum aluno matriculado nesta turma</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Matrícula</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.fullName}</TableCell>
                                            <TableCell className="font-mono text-sm">{student.registrationNumber}</TableCell>
                                            <TableCell>{student.email || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Schedules Tab */}
            {activeTab === 'schedules' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Horários</CardTitle>
                                <CardDescription>
                                    {schedules.length} horário(s) cadastrado(s)
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes/${classId}/schedules`)}
                            >
                                Ver Todos os Horários
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {schedules.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhum horário cadastrado</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Dia</TableHead>
                                        <TableHead>Horário</TableHead>
                                        <TableHead>Sala</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedules.slice(0, 5).map((schedule) => (
                                        <TableRow key={schedule.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    {dayLabels[schedule.dayOfWeek] || schedule.dayOfWeek}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    {schedule.startTime} - {schedule.endTime}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    {schedule.room}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Create/Edit Evaluation Dialog */}
            <Dialog open={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen}>
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
                        onSubmit={handleSubmitEvaluation}
                        isLoading={submitting}
                        submitLabel={editingEvaluation ? 'Atualizar' : 'Criar'}
                        defaultClassId={classId}
                        defaultSubjectId={subjectId}
                        onCancel={() => {
                            setIsEvaluationDialogOpen(false);
                            setEditingEvaluation(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

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
                        classId={classId}
                        evaluationId={evaluationFilter}
                        academicYear={academicYear}
                        academicSemester={academicSemester}
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
                    {selectedEvaluationObj && evaluationFilter && teacherId && (
                        <BulkGradeEntry
                            students={students}
                            evaluation={selectedEvaluationObj}
                            classId={classId}
                            teacherId={teacherId}
                            academicYear={academicYear}
                            academicSemester={academicSemester}
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

export default function ClassDetailPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']}>
            <ClassDetailContent />
        </ProtectedRoute>
    );
}

