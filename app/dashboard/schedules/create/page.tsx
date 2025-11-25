'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { scheduleService } from '@/services/schedule.service';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { teacherService } from '@/services/teacher.service';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
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

const formSchema = z.object({
    classId: z.string().min(1, 'Turma é obrigatória'),
    subjectId: z.string().min(1, 'Disciplina é obrigatória'),
    teacherId: z.string().min(1, 'Professor é obrigatório'),
    dayOfWeek: z.string().min(1, 'Dia da semana é obrigatório'),
    startTime: z.string().min(1, 'Horário de início é obrigatório'),
    endTime: z.string().min(1, 'Horário de término é obrigatório'),
    room: z.string().min(1, 'Sala é obrigatória'),
});

export default function CreateSchedulePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            classId: '',
            subjectId: '',
            teacherId: '',
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            room: '',
        },
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [classesRes, subjectsRes, teachersRes] = await Promise.all([
                classService.getAll(),
                subjectService.getAll(),
                teacherService.getAll(),
            ]);

            setClasses((classesRes as any).content || (Array.isArray(classesRes) ? classesRes : []));
            setSubjects((subjectsRes as any).content || (Array.isArray(subjectsRes) ? subjectsRes : []));
            setTeachers((teachersRes as any).content || (Array.isArray(teachersRes) ? teachersRes : []));
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados necessários');
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            // Get the selected class to retrieve its shiftId
            const selectedClass = classes.find(c => c.id.toString() === values.classId);
            if (!selectedClass) {
                toast.error('Turma selecionada não encontrada');
                setLoading(false);
                return;
            }

            await scheduleService.create({
                classEntity: { id: parseInt(values.classId) },
                subject: { id: parseInt(values.subjectId) },
                teacherId: parseInt(values.teacherId),
                dayOfWeek: values.dayOfWeek as any,
                startTime: values.startTime,
                endTime: values.endTime,
                room: values.room,
                shift: { id: selectedClass.shiftId },
                active: true,
            });
            toast.success('Horário criado com sucesso!');
            router.push('/dashboard/schedules');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar horário');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Adicionar Novo Horário</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="classId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Turma</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione a turma" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {classes.map((c) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="subjectId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Disciplina</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione a disciplina" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {subjects.map((s) => (
                                                        <SelectItem key={s.id} value={s.id.toString()}>
                                                            {s.name}
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o professor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {teachers.map((t) => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>
                                                        {t.name}
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
                                                    <SelectItem value="MONDAY">Segunda-feira</SelectItem>
                                                    <SelectItem value="TUESDAY">Terça-feira</SelectItem>
                                                    <SelectItem value="WEDNESDAY">Quarta-feira</SelectItem>
                                                    <SelectItem value="THURSDAY">Quinta-feira</SelectItem>
                                                    <SelectItem value="FRIDAY">Sexta-feira</SelectItem>
                                                    <SelectItem value="SATURDAY">Sábado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="room"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sala</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Sala 101" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Início</FormLabel>
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
                                            <FormLabel>Término</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Criando...' : 'Criar Horário'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
