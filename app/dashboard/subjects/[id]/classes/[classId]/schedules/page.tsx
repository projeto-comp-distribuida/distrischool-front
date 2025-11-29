'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { scheduleService } from '@/services/schedule.service';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { Schedule } from '@/types/schedule.types';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Plus, Clock, Calendar, MapPin, Loader2, Pencil, Trash2, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getSchedulesForClass } from '@/lib/subject-class-helpers';

const dayLabels: Record<string, string> = {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
};

export default function ClassSchedulesPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const subjectId = Number(params.id);
    const classId = Number(params.classId);
    
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classEntity, setClassEntity] = useState<ClassEntity | null>(null);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);

    const isStudent = user?.roles?.includes('STUDENT');
    const studentId = user?.studentId ? Number(user.studentId) : null;

    useEffect(() => {
        if (subjectId && classId) {
            // Verificar se o estudante está matriculado na classe
            if (isStudent && studentId) {
                checkStudentEnrollment();
            } else {
                loadData();
            }
        }
    }, [subjectId, classId, user]);

    const checkStudentEnrollment = async () => {
        try {
            const classData = await classService.getById(classId);
            
            // Verificar se o estudante está matriculado
            if (!classData.studentIds || !classData.studentIds.includes(studentId!)) {
                toast.error('Você não está matriculado nesta turma');
                router.push('/dashboard');
                return;
            }
            
            // Estudante está matriculado, carregar dados
            loadData();
        } catch (error) {
            toast.error('Erro ao verificar matrícula');
            console.error(error);
            router.push('/dashboard');
        }
    };

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
        } catch (error) {
            toast.error('Erro ao carregar dados');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (scheduleId: number) => {
        if (!confirm('Tem certeza que deseja excluir este horário?')) return;

        try {
            await scheduleService.delete(scheduleId);
            toast.success('Horário excluído com sucesso');
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir horário');
        }
    };

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
                    { label: 'Horários' },
                ]}
            />

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                    <Clock className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">Horários</h1>
                                    <p className="text-purple-100 text-lg mt-1">{classEntity.name} - {subject.name}</p>
                                </div>
                            </div>
                        </div>
                        {user?.roles?.includes('ADMIN') && (
                            <Button 
                                onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes/${classId}/schedules/create`)}
                                size="lg"
                                className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Novo Horário
                            </Button>
                        )}
                    </div>
                    <div className="mt-6 flex items-center gap-6">
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <Clock className="h-5 w-5" />
                            <span className="font-semibold">{schedules.length}</span>
                            <span className="text-purple-100">horários cadastrados</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Lista de Horários */}
            <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Lista de Horários
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {schedules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <Clock className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Nenhum horário encontrado</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                Comece criando o primeiro horário para esta turma.
                            </p>
                            <Button onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes/${classId}/schedules/create`)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Criar Primeiro Horário
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Dia da Semana</TableHead>
                                        <TableHead className="font-semibold">Horário</TableHead>
                                        <TableHead className="font-semibold">Disciplina</TableHead>
                                        <TableHead className="font-semibold">Sala</TableHead>
                                        <TableHead className="text-right font-semibold">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schedules.map((schedule) => (
                                        <TableRow 
                                            key={schedule.id}
                                            className="transition-all duration-200 hover:bg-muted/50"
                                        >
                                            <TableCell className="font-semibold text-base">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    {dayLabels[schedule.dayOfWeek] || schedule.dayOfWeek}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {schedule.startTime} - {schedule.endTime}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">
                                                    {schedule.subject?.name || schedule.subjectName || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{schedule.room}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes/${classId}/schedules/${schedule.id}/attendance`)}
                                                        className="hover:bg-purple-100 dark:hover:bg-purple-900 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                                        title="Fazer Chamada"
                                                    >
                                                        <ClipboardCheck className="h-4 w-4" />
                                                    </Button>
                                                    {user?.roles?.includes('ADMIN') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:bg-destructive/10 transition-colors"
                                                            onClick={() => handleDelete(schedule.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

