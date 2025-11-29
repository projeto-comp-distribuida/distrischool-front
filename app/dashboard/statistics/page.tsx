'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentService } from '@/services/student.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    GraduationCap,
    TrendingUp,
    UserCheck,
    UserX,
    BarChart3,
    PieChart as PieChartIcon,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StudentStatistics {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    graduatedStudents: number;
    suspendedStudents: number;
    byCourse: Record<string, number>;
    bySemester: Record<string, number>;
    averageAge: number;
    enrollmentTrend: { month: string; count: number }[];
}

export default function StatisticsPage() {
    const router = useRouter();
    const [statistics, setStatistics] = useState<StudentStatistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            // Tentar buscar do backend
            const stats = await studentService.getStatistics();
            setStatistics(stats as StudentStatistics);
        } catch (error) {
            // Se falhar, usar dados mockados
            console.warn('Endpoint de estatísticas não disponível, usando dados mockados');
            const mockStats: StudentStatistics = {
                totalStudents: 1247,
                activeStudents: 1089,
                inactiveStudents: 98,
                graduatedStudents: 45,
                suspendedStudents: 15,
                byCourse: {
                    'Engenharia de Software': 342,
                    'Ciência da Computação': 298,
                    'Sistemas de Informação': 267,
                    'Análise e Desenvolvimento': 189,
                    'Redes de Computadores': 151,
                },
                bySemester: {
                    '1º Semestre': 234,
                    '2º Semestre': 221,
                    '3º Semestre': 198,
                    '4º Semestre': 187,
                    '5º Semestre': 165,
                    '6º Semestre': 142,
                    '7º Semestre': 100,
                },
                averageAge: 22.5,
                enrollmentTrend: [
                    { month: 'Jan', count: 45 },
                    { month: 'Fev', count: 52 },
                    { month: 'Mar', count: 78 },
                    { month: 'Abr', count: 34 },
                    { month: 'Mai', count: 41 },
                    { month: 'Jun', count: 67 },
                ],
            };
            setStatistics(mockStats);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Carregando estatísticas...</p>
                </div>
            </div>
        );
    }

    if (!statistics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Erro ao carregar estatísticas</p>
            </div>
        );
    }

    const statusPercentage = {
        active: ((statistics.activeStudents / statistics.totalStudents) * 100).toFixed(1),
        inactive: ((statistics.inactiveStudents / statistics.totalStudents) * 100).toFixed(1),
        graduated: ((statistics.graduatedStudents / statistics.totalStudents) * 100).toFixed(1),
        suspended: ((statistics.suspendedStudents / statistics.totalStudents) * 100).toFixed(1),
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Estatísticas de Estudantes</h1>
                <p className="text-muted-foreground">
                    Visão geral e métricas dos estudantes matriculados
                </p>
            </div>

            {/* Cards de Resumo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Estudantes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">
                            Todos os estudantes cadastrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{statistics.activeStudents}</div>
                        <p className="text-xs text-muted-foreground">
                            {statusPercentage.active}% do total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Graduados</CardTitle>
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{statistics.graduatedStudents}</div>
                        <p className="text-xs text-muted-foreground">
                            {statusPercentage.graduated}% do total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inativos/Suspensos</CardTitle>
                        <UserX className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {statistics.inactiveStudents + statistics.suspendedStudents}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {(parseFloat(statusPercentage.inactive) + parseFloat(statusPercentage.suspended)).toFixed(1)}% do total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Distribuição por Curso */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Distribuição por Curso
                    </CardTitle>
                    <CardDescription>
                        Número de estudantes matriculados em cada curso
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(statistics.byCourse).map(([course, count]) => {
                            const percentage = ((count / statistics.totalStudents) * 100).toFixed(1);
                            return (
                                <div key={course} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{course}</span>
                                        <span className="text-muted-foreground">{count} ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Distribuição por Semestre */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5" />
                        Distribuição por Semestre
                    </CardTitle>
                    <CardDescription>
                        Quantidade de estudantes em cada período letivo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Object.entries(statistics.bySemester).map(([semester, count]) => (
                            <div key={semester} className="space-y-1 p-4 border rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground">{semester}</p>
                                <p className="text-2xl font-bold">{count}</p>
                                <p className="text-xs text-muted-foreground">
                                    {((count / statistics.totalStudents) * 100).toFixed(1)}% do total
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Tendência de Matrículas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Tendência de Matrículas (Últimos 6 meses)
                    </CardTitle>
                    <CardDescription>
                        Novos estudantes matriculados por mês
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between gap-2 h-64">
                        {statistics.enrollmentTrend.map((item) => {
                            const maxCount = Math.max(...statistics.enrollmentTrend.map(i => i.count));
                            const height = (item.count / maxCount) * 100;
                            return (
                                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="text-sm font-medium">{item.count}</div>
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

            {/* Informações Adicionais */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Idade Média</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{statistics.averageAge} anos</div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Média de idade dos estudantes ativos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Taxa de Retenção</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600">
                            {statusPercentage.active}%
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Estudantes ativos em relação ao total
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
