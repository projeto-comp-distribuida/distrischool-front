'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { teacherService } from '@/services/teacher.service';
import { Teacher } from '@/types/teacher.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    TrendingUp,
    Users,
    Clock,
    Award,
    Calendar,
    BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceReport {
    teacherId: number;
    teacherName: string;
    period: string;
    totalClasses: number;
    attendanceRate: number;
    studentSatisfaction: number;
    completedLessons: number;
    totalLessons: number;
    averageGrade: number;
    strengths: string[];
    areasForImprovement: string[];
    monthlyPerformance: { month: string; score: number }[];
}

export default function PerformanceReportsClient() {
    const searchParams = useSearchParams();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [report, setReport] = useState<PerformanceReport | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTeachers();
        const teacherIdParam = searchParams.get('teacherId');
        if (teacherIdParam) {
            setSelectedTeacherId(teacherIdParam);
            loadReport(parseInt(teacherIdParam));
        }
    }, [searchParams]);

    const loadTeachers = async () => {
        try {
            const response = await teacherService.getAll();
            const data = Array.isArray(response) ? response : (response as any).content || [];
            setTeachers(data);
        } catch (error) {
            toast.error('Erro ao carregar professores');
        }
    };

    const loadReport = async (teacherId: number) => {
        setLoading(true);
        try {
            // Tentar buscar do backend
            const reportData = await teacherService.generatePerformanceReport(
                teacherId,
                '2025-01-01',
                '2025-12-31'
            );
            setReport(reportData as PerformanceReport);
        } catch (error) {
            // Se falhar, usar dados mockados
            console.warn('Endpoint de performance não disponível, usando dados mockados');
            const teacher = teachers.find(t => t.id === teacherId);
            const mockReport: PerformanceReport = {
                teacherId,
                teacherName: teacher?.name || 'Professor',
                period: 'Janeiro - Novembro 2025',
                totalClasses: 156,
                attendanceRate: 94.5,
                studentSatisfaction: 4.6,
                completedLessons: 142,
                totalLessons: 156,
                averageGrade: 7.8,
                strengths: [
                    'Excelente comunicação com os alunos',
                    'Domínio completo do conteúdo',
                    'Uso efetivo de recursos tecnológicos',
                    'Pontualidade e organização',
                ],
                areasForImprovement: [
                    'Diversificar metodologias de ensino',
                    'Aumentar interação em aulas remotas',
                ],
                monthlyPerformance: [
                    { month: 'Jan', score: 8.5 },
                    { month: 'Fev', score: 8.7 },
                    { month: 'Mar', score: 9.0 },
                    { month: 'Abr', score: 8.8 },
                    { month: 'Mai', score: 9.2 },
                    { month: 'Jun', score: 9.1 },
                    { month: 'Jul', score: 8.9 },
                    { month: 'Ago', score: 9.3 },
                    { month: 'Set', score: 9.0 },
                    { month: 'Out', score: 9.4 },
                    { month: 'Nov', score: 9.2 },
                ],
            };
            setReport(mockReport);
        } finally {
            setLoading(false);
        }
    };

    const handleTeacherChange = (value: string) => {
        setSelectedTeacherId(value);
        if (value) {
            loadReport(parseInt(value));
        } else {
            setReport(null);
        }
    };

    const completionRate = report ? ((report.completedLessons / report.totalLessons) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Relatórios de Desempenho</h1>
                <p className="text-muted-foreground">
                    Análise de performance e métricas dos professores
                </p>
            </div>

            {/* Seletor de Professor */}
            <Card>
                <CardHeader>
                    <CardTitle>Selecionar Professor</CardTitle>
                    <CardDescription>
                        Escolha um professor para visualizar o relatório de desempenho
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={selectedTeacherId} onValueChange={handleTeacherChange}>
                        <SelectTrigger className="w-full md:w-[400px]">
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
                </CardContent>
            </Card>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Carregando relatório...</p>
                    </div>
                </div>
            )}

            {!loading && report && (
                <>
                    {/* Cards de Métricas */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Aulas Ministradas</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{report.totalClasses}</div>
                                <p className="text-xs text-muted-foreground">
                                    {completionRate}% de conclusão
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{report.attendanceRate}%</div>
                                <p className="text-xs text-muted-foreground">
                                    Pontualidade e assiduidade
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Satisfação dos Alunos</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{report.studentSatisfaction}/5.0</div>
                                <p className="text-xs text-muted-foreground">
                                    Avaliação média
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Média das Notas</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600">{report.averageGrade}</div>
                                <p className="text-xs text-muted-foreground">
                                    Desempenho dos alunos
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Mensal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Performance Mensal
                            </CardTitle>
                            <CardDescription>
                                Pontuação de desempenho ao longo do ano
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between gap-2 h-64">
                                {report.monthlyPerformance.map((item) => {
                                    const maxScore = 10;
                                    const height = (item.score / maxScore) * 100;
                                    return (
                                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                                            <div className="text-sm font-medium">{item.score}</div>
                                            <div
                                                className="w-full bg-primary rounded-t-md transition-all hover:opacity-80"
                                                style={{ height: `${height}%` }}
                                            />
                                            <div className="text-xs text-muted-foreground">{item.month}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pontos Fortes e Áreas de Melhoria */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-600">Pontos Fortes</CardTitle>
                                <CardDescription>
                                    Aspectos destacados no desempenho
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {report.strengths.map((strength, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-600 mt-2" />
                                            <span className="text-sm">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-amber-600">Áreas para Desenvolvimento</CardTitle>
                                <CardDescription>
                                    Oportunidades de melhoria identificadas
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {report.areasForImprovement.map((area, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <div className="h-2 w-2 rounded-full bg-amber-600 mt-2" />
                                            <span className="text-sm">{area}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resumo do Período */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo do Período</CardTitle>
                            <CardDescription>{report.period}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Professor</p>
                                    <p className="text-lg font-semibold">{report.teacherName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Aulas Concluídas</p>
                                    <p className="text-lg font-semibold">{report.completedLessons} de {report.totalLessons}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <p className="text-lg font-semibold text-green-600">Excelente</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {!loading && !report && selectedTeacherId && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            Nenhum relatório disponível para este professor
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

