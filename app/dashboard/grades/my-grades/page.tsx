'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { gradeService } from '@/services/grade.service';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { GradeResponseDTO } from '@/types/grade.types';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { StudentGradeCard } from '@/components/student-grade-card';
import { AcademicPeriodSelector } from '@/components/academic-period-selector';
import { ProtectedRoute } from '@/components/protected-route';
import { ArrowLeft, GraduationCap, FileText, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ClassGradesData {
    classEntity: ClassEntity;
    subject: Subject;
    grades: GradeResponseDTO[];
    average: number;
}

function MyGradesContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [allGrades, setAllGrades] = useState<GradeResponseDTO[]>([]);
    const [classesData, setClassesData] = useState<ClassGradesData[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [filters, setFilters] = useState({
        academicYear: new Date().getFullYear(),
        academicSemester: 1,
        classId: undefined as number | undefined,
    });

    const userId = user?.id ? Number(user.id) : null;

    useEffect(() => {
        if (user && userId) {
            loadGrades();
        }
    }, [user, userId, filters.academicYear, filters.academicSemester]);

    useEffect(() => {
        if (allGrades.length > 0) {
            organizeGradesByClass();
        }
    }, [allGrades, filters.classId]);

    const loadGrades = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const gradesResponse = await gradeService.getByUserId(userId, {
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
                    grade.academicSemester === filters.academicSemester
            );
            
            setAllGrades(filteredGrades);
        } catch (error) {
            console.error('Error loading grades:', error);
            toast.error('Erro ao carregar notas');
        } finally {
            setLoading(false);
        }
    };

    const organizeGradesByClass = async () => {
        try {
            // Group grades by classId
            const gradesByClass = new Map<number, GradeResponseDTO[]>();
            
            allGrades.forEach((grade) => {
                if (filters.classId && grade.classId !== filters.classId) {
                    return;
                }
                
                if (!gradesByClass.has(grade.classId)) {
                    gradesByClass.set(grade.classId, []);
                }
                gradesByClass.get(grade.classId)!.push(grade);
            });

            // Load class and subject data for each class
            const classesDataPromises = Array.from(gradesByClass.entries()).map(
                async ([classId, grades]) => {
                    try {
                        const [classEntity, subjectsResponse] = await Promise.all([
                            classService.getById(classId),
                            subjectService.getAll(),
                        ]);

                        const subjectsList = Array.isArray(subjectsResponse)
                            ? subjectsResponse
                            : (subjectsResponse as any).content || [];

                        // Find subject from first grade (assuming all grades in a class are for the same subject)
                        const subjectId = grades[0]?.evaluationId || 0;
                        // For now, we'll use the first subject or create a placeholder
                        const subject = subjectsList[0] || { id: 0, name: 'Disciplina' };

                        // Calculate average
                        const average =
                            grades.reduce((sum, g) => sum + g.gradeValue, 0) / grades.length;

                        return {
                            classEntity,
                            subject,
                            grades,
                            average,
                        };
                    } catch (error) {
                        console.error(`Error loading data for class ${classId}:`, error);
                        return null;
                    }
                }
            );

            const classesDataList = (await Promise.all(classesDataPromises)).filter(
                Boolean
            ) as ClassGradesData[];
            
            setClassesData(classesDataList);
        } catch (error) {
            console.error('Error organizing grades:', error);
        }
    };

    const overallAverage = useMemo(() => {
        if (allGrades.length === 0) return 0;
        const total = allGrades.reduce((sum, grade) => sum + grade.gradeValue, 0);
        return total / allGrades.length;
    }, [allGrades]);

    const approvedCount = useMemo(() => {
        return classesData.filter((cd) => cd.average >= 7.0).length;
    }, [classesData]);

    const recoveryCount = useMemo(() => {
        return classesData.filter((cd) => cd.average >= 5.0 && cd.average < 7.0).length;
    }, [classesData]);

    const failedCount = useMemo(() => {
        return classesData.filter((cd) => cd.average < 5.0).length;
    }, [classesData]);

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

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Minhas Notas</h1>
                <p className="text-muted-foreground">
                    Acompanhe seu desempenho acadêmico
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Média Geral</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallAverage.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Média de todas as disciplinas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aprovado</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Disciplinas aprovadas
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recuperação</CardTitle>
                        <FileText className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{recoveryCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Em recuperação
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reprovado</CardTitle>
                        <FileText className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Disciplinas reprovadas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <AcademicPeriodSelector
                        academicYear={filters.academicYear}
                        academicSemester={filters.academicSemester}
                        onYearChange={(year) => setFilters({ ...filters, academicYear: year })}
                        onSemesterChange={(semester) => setFilters({ ...filters, academicSemester: semester })}
                    />
                </CardContent>
            </Card>

            {/* Grades by Class */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : classesData.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                        <p className="text-muted-foreground">
                            Nenhuma nota encontrada para o período selecionado
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Notas por Disciplina</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {classesData.map((classData) => (
                            <StudentGradeCard
                                key={classData.classEntity.id}
                                classEntity={classData.classEntity}
                                subject={classData.subject}
                                grades={classData.grades}
                                average={classData.average}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MyGradesPage() {
    return (
        <ProtectedRoute allowedRoles={['STUDENT']}>
            <MyGradesContent />
        </ProtectedRoute>
    );
}


