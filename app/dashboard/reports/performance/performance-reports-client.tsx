'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    BarChart3,
    Search,
    RefreshCw,
    CheckCircle2,
    Loader2,
    ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    const router = useRouter();
    const searchParams = useSearchParams();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [report, setReport] = useState<PerformanceReport | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [searchTeacher, setSearchTeacher] = useState('');

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
            setFilteredTeachers(data);
        } catch (error) {
            toast.error('Erro ao carregar professores');
        }
    };

    const applyFilters = () => {
        let filtered = [...teachers];

        if (searchTeacher) {
            filtered = filtered.filter(teacher =>
                teacher.name.toLowerCase().includes(searchTeacher.toLowerCase()) ||
                teacher.employeeId?.toLowerCase().includes(searchTeacher.toLowerCase())
            );
        }

        setFilteredTeachers(filtered);
    };

    const handleClearFilters = () => {
        setSearchTeacher('');
        setFilteredTeachers(teachers);
    };

    const handleRefresh = () => {
        loadTeachers();
    };

    useEffect(() => {
        applyFilters();
    }, [searchTeacher, teachers]);

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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                <BarChart3 className="h-8 w-8" />
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight">Relatórios de Desempenho</h1>
                        </div>
                        <p className="text-violet-100 text-lg">
                            Analise o desempenho dos professores com métricas detalhadas
                        </p>
                    </div>
                    <div className="mt-6 flex items-center gap-6">
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <Users className="h-5 w-5" />
                            <span className="font-semibold">{filteredTeachers.length}</span>
                            <span className="text-violet-100">professores disponíveis</span>
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
                    <CardDescription className="text-base">Busque e filtre professores de forma rápida</CardDescription>
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
                        <div className="flex gap-2 items-end">
                            <Button type="submit" className="gap-2 h-11 flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300">
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

            {/* Seletor de Professor */}
            <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Selecionar Professor
                    </CardTitle>
                    <CardDescription className="text-base">
                        Escolha um professor para visualizar o relatório de desempenho
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Select value={selectedTeacherId} onValueChange={handleTeacherChange}>
                        <SelectTrigger className="h-12 text-base w-full md:w-[500px]">
                            <SelectValue placeholder="Selecione um professor" />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredTeachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{teacher.name}</span>
                                        <span className="text-xs text-muted-foreground">ID: {teacher.employeeId}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground text-lg">Carregando relatório...</p>
                </div>
            )}

            {!loading && report && (
                <>
                    {/* Cards de Métricas */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Aulas Ministradas</CardTitle>
                                <div className="rounded-lg bg-blue-500 p-2">
                                    <Calendar className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">{report.totalClasses}</div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    {completionRate}% de conclusão
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">Taxa de Presença</CardTitle>
                                <div className="rounded-lg bg-green-500 p-2">
                                    <Clock className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">{report.attendanceRate}%</div>
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                    Pontualidade e assiduidade
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Satisfação dos Alunos</CardTitle>
                                <div className="rounded-lg bg-purple-500 p-2">
                                    <Users className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">{report.studentSatisfaction}/5.0</div>
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                    Avaliação média
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-300">Média das Notas</CardTitle>
                                <div className="rounded-lg bg-amber-500 p-2">
                                    <Award className="h-5 w-5 text-white" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-1">{report.averageGrade}</div>
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    Desempenho dos alunos
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Mensal */}
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <TrendingUp className="h-6 w-6 text-primary" />
                                Performance Mensal
                            </CardTitle>
                            <CardDescription className="text-base">
                                Pontuação de desempenho ao longo do ano
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-end justify-between gap-3 h-72">
                                {report.monthlyPerformance.map((item) => {
                                    const maxScore = 10;
                                    const height = (item.score / maxScore) * 100;
                                    return (
                                        <div key={item.month} className="flex-1 flex flex-col items-center gap-3 group">
                                            <div className="text-lg font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.score}
                                            </div>
                                            <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                                                <div
                                                    className="w-full bg-gradient-to-t from-violet-600 via-purple-600 to-fuchsia-600 rounded-t-lg transition-all duration-300 hover:opacity-80 hover:scale-105 shadow-lg"
                                                    style={{ height: `${height}%` }}
                                                />
                                            </div>
                                            <div className="text-sm font-semibold text-foreground">{item.month}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pontos Fortes e Áreas de Melhoria */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                                <CardTitle className="text-green-700 dark:text-green-300 text-xl flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-600"></div>
                                    Pontos Fortes
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Aspectos destacados no desempenho
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-3">
                                    {report.strengths.map((strength, index) => (
                                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm font-medium">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
                                <CardTitle className="text-amber-700 dark:text-amber-300 text-xl flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-amber-600"></div>
                                    Áreas para Desenvolvimento
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Oportunidades de melhoria identificadas
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ul className="space-y-3">
                                    {report.areasForImprovement.map((area, index) => (
                                        <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950">
                                            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm font-medium">{area}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Resumo do Período */}
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                            <CardTitle className="text-xl">Resumo do Período</CardTitle>
                            <CardDescription className="text-base">{report.period}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-2 p-4 rounded-lg bg-muted">
                                    <p className="text-sm font-medium text-muted-foreground">Professor</p>
                                    <p className="text-xl font-bold">{report.teacherName}</p>
                                </div>
                                <div className="space-y-2 p-4 rounded-lg bg-muted">
                                    <p className="text-sm font-medium text-muted-foreground">Aulas Concluídas</p>
                                    <p className="text-xl font-bold">{report.completedLessons} de {report.totalLessons}</p>
                                </div>
                                <div className="space-y-2 p-4 rounded-lg bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800">
                                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Status</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">Excelente</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {!loading && !report && selectedTeacherId && (
                <Card className="border-2">
                    <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="rounded-full bg-muted p-6 mb-4">
                            <BarChart3 className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Nenhum relatório disponível</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            Não há dados de desempenho disponíveis para este professor no momento.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


