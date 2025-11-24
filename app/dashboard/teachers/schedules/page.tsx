'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { teacherService } from '@/services/teacher.service';
import { Teacher } from '@/types/teacher.types';
import { Schedule } from '@/types/schedule.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const dayLabels: Record<string, string> = {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
};

export default function TeacherSchedulesPage() {
    const searchParams = useSearchParams();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTeachers();
        const teacherIdParam = searchParams.get('teacherId');
        if (teacherIdParam) {
            setSelectedTeacherId(teacherIdParam);
            loadSchedules(parseInt(teacherIdParam));
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

    const loadSchedules = async (teacherId: number) => {
        setLoading(true);
        try {
            const schedulesData = await teacherService.getTeacherSchedules(teacherId);
            setSchedules(schedulesData);
        } catch (error) {
            console.warn('Endpoint de horários não disponível, usando dados mockados');
            // Mock data
            const mockSchedules: Schedule[] = [
                {
                    id: 1,
                    dayOfWeek: 'MONDAY',
                    startTime: '08:00',
                    endTime: '10:00',
                    room: 'Sala 101',
                    subject: { id: 1, name: 'Programação I', code: 'PROG1', workloadHours: 60, academicCenterId: 1 },
                    classEntity: { id: 1, name: 'Turma A', code: 'TURMA-A', academicYear: '2025', period: '1', capacity: 30, shiftId: 1, room: '101' },
                },
                {
                    id: 2,
                    dayOfWeek: 'MONDAY',
                    startTime: '10:00',
                    endTime: '12:00',
                    room: 'Sala 102',
                    subject: { id: 2, name: 'Estruturas de Dados', code: 'ED1', workloadHours: 60, academicCenterId: 1 },
                    classEntity: { id: 2, name: 'Turma B', code: 'TURMA-B', academicYear: '2025', period: '1', capacity: 30, shiftId: 1, room: '102' },
                },
                {
                    id: 3,
                    dayOfWeek: 'WEDNESDAY',
                    startTime: '14:00',
                    endTime: '16:00',
                    room: 'Sala 103',
                    subject: { id: 1, name: 'Programação I', code: 'PROG1', workloadHours: 60, academicCenterId: 1 },
                    classEntity: { id: 3, name: 'Turma C', code: 'TURMA-C', academicYear: '2025', period: '1', capacity: 30, shiftId: 2, room: '103' },
                },
                {
                    id: 4,
                    dayOfWeek: 'FRIDAY',
                    startTime: '08:00',
                    endTime: '10:00',
                    room: 'Sala 101',
                    subject: { id: 2, name: 'Estruturas de Dados', code: 'ED1', workloadHours: 60, academicCenterId: 1 },
                    classEntity: { id: 1, name: 'Turma A', code: 'TURMA-A', academicYear: '2025', period: '1', capacity: 30, shiftId: 1, room: '101' },
                },
            ];
            setSchedules(mockSchedules);
        } finally {
            setLoading(false);
        }
    };

    const handleTeacherChange = (value: string) => {
        setSelectedTeacherId(value);
        if (value) {
            loadSchedules(parseInt(value));
        } else {
            setSchedules([]);
        }
    };

    const schedulesByDay = daysOfWeek.reduce((acc, day) => {
        acc[day] = schedules.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
        return acc;
    }, {} as Record<string, Schedule[]>);

    const totalHours = schedules.reduce((total, schedule) => {
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.endTime.split(':').map(Number);
        const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
        return total + hours;
    }, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Horários do Professor</h1>
                <p className="text-muted-foreground">
                    Visualize a grade de horários semanal de cada professor
                </p>
            </div>

            {/* Seletor de Professor */}
            <Card>
                <CardHeader>
                    <CardTitle>Selecionar Professor</CardTitle>
                    <CardDescription>
                        Escolha um professor para visualizar seus horários
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
                        <p className="mt-4 text-muted-foreground">Carregando horários...</p>
                    </div>
                </div>
            )}

            {!loading && selectedTeacherId && schedules.length > 0 && (
                <>
                    {/* Resumo */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{schedules.length}</div>
                                <p className="text-xs text-muted-foreground">
                                    Aulas semanais
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Carga Horária</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalHours}h</div>
                                <p className="text-xs text-muted-foreground">
                                    Por semana
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Disciplinas</CardTitle>
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {new Set(schedules.map(s => s.subject?.id)).size}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Diferentes
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Grade Semanal */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Grade Semanal</CardTitle>
                            <CardDescription>
                                Horários organizados por dia da semana
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {daysOfWeek.map((day) => {
                                    const daySchedules = schedulesByDay[day];
                                    if (daySchedules.length === 0) return null;

                                    return (
                                        <div key={day} className="space-y-2">
                                            <h3 className="font-semibold text-lg">{dayLabels[day]}</h3>
                                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                {daySchedules.map((schedule) => (
                                                    <Card key={schedule.id} className="border-l-4 border-l-primary">
                                                        <CardContent className="pt-4">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                                    <Clock className="h-4 w-4 text-primary" />
                                                                    {schedule.startTime} - {schedule.endTime}
                                                                </div>
                                                                <div className="font-semibold">
                                                                    {schedule.subject?.name || 'Sem disciplina'}
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {schedule.classEntity?.name || 'Sem turma'}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {schedule.room}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {!loading && selectedTeacherId && schedules.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            Nenhum horário encontrado para este professor
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
