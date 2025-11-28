'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { gradeService } from '@/services/grade.service';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { evaluationService } from '@/services/evaluation.service';
import { GradeResponseDTO } from '@/types/grade.types';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Evaluation } from '@/types/evaluation.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { GradeStatusBadge } from '@/components/grade-status-badge';
import { ProtectedRoute } from '@/components/protected-route';
import { ArrowLeft, GraduationCap, FileText, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

function ClassGradesDetailContent() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const classId = params.classId ? Number(params.classId) : null;
    
    const [classEntity, setClassEntity] = useState<ClassEntity | null>(null);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [grades, setGrades] = useState<GradeResponseDTO[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentAverage, setStudentAverage] = useState<number | null>(null);
    const [classAverage, setClassAverage] = useState<number | null>(null);
    const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
    const [academicSemester, setAcademicSemester] = useState(1);

    const userId = user?.id ? Number(user.id) : null;

    useEffect(() => {
        if (classId && userId) {
            loadData();
        }
    }, [classId, userId, academicYear, academicSemester]);

    const loadData = async () => {
        if (!classId || !userId) return;

        try {
            setLoading(true);

            // Load class data
            const classData = await classService.getById(classId);
            setClassEntity(classData);

            // Load evaluations for this class
            const evaluationsList = await evaluationService.getByClass(classId);
            setEvaluations(evaluationsList);

            // Load subject (use first evaluation's subject or default)
            if (evaluationsList.length > 0) {
                const subjectId = evaluationsList[0].subjectId;
                try {
                    const subjectData = await subjectService.getById(subjectId);
                    setSubject(subjectData);
                } catch (e) {
                    console.error('Error loading subject:', e);
                }
            }

            // Load student's grades for this class
            const gradesResponse = await gradeService.getByUserId(userId, {
                page: 0,
                size: 1000,
            });
            const allGrades = Array.isArray(gradesResponse)
                ? gradesResponse
                : gradesResponse.content || [];
            
            const classGrades = allGrades.filter(
                (g: GradeResponseDTO) =>
                    g.classId === classId &&
                    g.academicYear === academicYear &&
                    g.academicSemester === academicSemester
            );
            setGrades(classGrades);

            // Calculate student average
            if (classGrades.length > 0) {
                const avg =
                    classGrades.reduce((sum, g) => sum + g.gradeValue, 0) / classGrades.length;
                setStudentAverage(avg);
            } else {
                setStudentAverage(null);
            }

            // Load class average
            try {
                const classAvg = await gradeService.getClassAverage(classId, {
                    academicYear,
                    academicSemester,
                });
                setClassAverage(classAvg);
            } catch (e) {
                console.error('Error loading class average:', e);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const getEvaluationName = (evaluationId: number) => {
        const evaluation = evaluations.find(e => e.id === evaluationId);
        return evaluation ? evaluation.name : `Avaliação ${evaluationId}`;
    };

    const getEvaluationType = (evaluationId: number) => {
        const evaluation = evaluations.find(e => e.id === evaluationId);
        return evaluation ? evaluation.type : '';
    };

    const gradesByEvaluation = grades.reduce((acc, grade) => {
        if (!acc[grade.evaluationId]) {
            acc[grade.evaluationId] = [];
        }
        acc[grade.evaluationId].push(grade);
        return acc;
    }, {} as Record<number, GradeResponseDTO[]>);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!classEntity) {
        return (
            <div className="space-y-6 p-6">
                <Button variant="ghost" onClick={() => router.push('/dashboard/grades/my-grades')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Turma não encontrada</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/grades/my-grades')}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">{classEntity.name}</h1>
                <p className="text-muted-foreground">
                    {subject?.name || 'Disciplina'} • {classEntity.code}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Minha Média</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {studentAverage !== null ? studentAverage.toFixed(2) : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Média das suas notas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Média da Turma</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {classAverage !== null ? classAverage.toFixed(2) : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Média geral da turma
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total de Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{grades.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Notas registradas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Academic Period Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Período Letivo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Ano Letivo</label>
                            <input
                                type="number"
                                min="2000"
                                value={academicYear}
                                onChange={(e) => setAcademicYear(Number(e.target.value))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Semestre</label>
                            <select
                                value={academicSemester}
                                onChange={(e) => setAcademicSemester(Number(e.target.value))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value={1}>1º Semestre</option>
                                <option value={2}>2º Semestre</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Grades by Evaluation */}
            {grades.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                        <p className="text-muted-foreground">
                            Nenhuma nota encontrada para este período
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {Object.entries(gradesByEvaluation).map(([evaluationId, evalGrades]) => (
                        <Card key={evaluationId}>
                            <CardHeader>
                                <CardTitle>{getEvaluationName(Number(evaluationId))}</CardTitle>
                                <CardDescription>
                                    {getEvaluationType(Number(evaluationId))} • {evalGrades.length} nota(s)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Nota</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Observações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {evalGrades.map((grade) => (
                                            <TableRow key={grade.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {new Date(grade.gradeDate).toLocaleDateString('pt-BR')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-semibold">
                                                        {grade.gradeValue.toFixed(2)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <GradeStatusBadge status={grade.status} />
                                                </TableCell>
                                                <TableCell className="max-w-[300px]">
                                                    {grade.notes || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ClassGradesDetailPage() {
    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <ClassGradesDetailContent />
        </ProtectedRoute>
    );
}


