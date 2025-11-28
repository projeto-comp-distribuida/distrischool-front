'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { scheduleService } from '@/services/schedule.service';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { teacherService } from '@/services/teacher.service';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { DayOfWeek } from '@/types/schedule.types';
import { Teacher } from '@/types/teacher.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    dayOfWeek: z.string().min(1, 'Dia da semana é obrigatório'),
    startTime: z.string().min(1, 'Horário de início é obrigatório'),
    endTime: z.string().min(1, 'Horário de término é obrigatório'),
    room: z.string().min(1, 'Sala é obrigatória'),
    shiftId: z.coerce.number().min(1, 'Turno é obrigatório'),
    teacherId: z.coerce.number().min(1, 'Professor é obrigatório'),
    active: z.boolean().default(true),
});

const shiftOptions = [
    { id: 1, label: 'Matutino' },
    { id: 2, label: 'Vespertino' },
    { id: 3, label: 'Noturno' },
];

const daysOfWeek: DayOfWeek[] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
];

const dayLabels: Record<string, string> = {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
};

export default function CreateSchedulePage() {
    const router = useRouter();
    const params = useParams();
    const subjectId = Number(params.id);
    const classId = Number(params.classId);
    const [loading, setLoading] = useState(false);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classEntity, setClassEntity] = useState<ClassEntity | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(true);

    useEffect(() => {
        if (subjectId && classId) {
            loadData();
        }
    }, [subjectId, classId]);

    const loadData = async () => {
        try {
            const [subjectData, classData] = await Promise.all([
                subjectService.getById(subjectId),
                classService.getById(classId),
            ]);
            setSubject(subjectData);
            setClassEntity(classData);
        } catch (error) {
            toast.error('Erro ao carregar dados');
            console.error(error);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        const loadTeachers = async () => {
            try {
                const response = await teacherService.getAll({ page: 0, size: 1000 });
                const teachersList = Array.isArray(response) ? response : response?.content || [];
                setTeachers(teachersList);
            } catch (error) {
                toast.error('Erro ao carregar professores');
                console.error(error);
            } finally {
                setLoadingTeachers(false);
            }
        };

        loadTeachers();
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            room: classEntity?.room || '',
            shiftId: classEntity?.shiftId || 1,
            teacherId: 0,
            active: true,
        },
    });

    // Update room when classEntity loads
    useEffect(() => {
        if (classEntity) {
            form.setValue('room', classEntity.room);
            form.setValue('shiftId', classEntity.shiftId);
        }
    }, [classEntity, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!subject || !classEntity) return;

        setLoading(true);
        try {
            await scheduleService.create({
                classEntity: { id: classId },
                subject: { id: subjectId },
                shift: { id: values.shiftId },
                dayOfWeek: values.dayOfWeek as DayOfWeek,
                startTime: values.startTime,
                endTime: values.endTime,
                room: values.room,
                teacherId: values.teacherId,
                active: values.active,
            });
            toast.success('Horário criado com sucesso!');
            router.push(`/dashboard/subjects/${subjectId}/classes/${classId}/schedules`);
        } catch (error) {
            toast.error('Erro ao criar horário');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loadingData) {
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
        <div className="max-w-2xl mx-auto p-6">
            <Breadcrumbs
                items={[
                    { label: 'Cursos', href: '/dashboard/courses' },
                    { label: subject.name, href: `/dashboard/subjects/${subjectId}/classes` },
                    { label: classEntity.name, href: `/dashboard/subjects/${subjectId}/classes/${classId}/schedules` },
                    { label: 'Novo Horário' },
                ]}
            />

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Criar Novo Horário</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        Curso: <span className="font-medium">{subject.name}</span> | Turma: <span className="font-medium">{classEntity.name}</span>
                    </p>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="dayOfWeek"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dia da Semana</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o dia" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {daysOfWeek.map((day) => (
                                                    <SelectItem key={day} value={day}>
                                                        {dayLabels[day]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horário de Início</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horário de Término</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="room"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sala</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Sala 101" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="shiftId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Turno</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                value={field.value ? String(field.value) : undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o turno" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {shiftOptions.map((shift) => (
                                                        <SelectItem key={shift.id} value={shift.id.toString()}>
                                                            {shift.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="teacherId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Professor</FormLabel>
                                        <Select
                                            disabled={loadingTeachers}
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            value={field.value ? String(field.value) : undefined}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingTeachers ? 'Carregando professores...' : 'Selecione o professor'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {teachers.length === 0 ? (
                                                    <SelectItem value="0" disabled>
                                                        Nenhum professor disponível
                                                    </SelectItem>
                                                ) : (
                                                    teachers.map((teacher) => (
                                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                            {teacher.name || teacher.fullName || `Professor #${teacher.id}`} - {teacher.employeeId}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex gap-2 pt-4">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes/${classId}/schedules`)}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? 'Criando...' : 'Criar Horário'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

