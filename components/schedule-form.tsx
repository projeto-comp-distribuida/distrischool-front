'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { teacherService } from '@/services/teacher.service';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Teacher } from '@/types/teacher.types';
import { Schedule } from '@/types/schedule.types';

const formSchema = z.object({
    classId: z.string().min(1, 'Turma é obrigatória'),
    subjectId: z.string().min(1, 'Disciplina é obrigatória'),
    teacherId: z.string().min(1, 'Professor é obrigatório'),
    dayOfWeek: z.string().min(1, 'Dia da semana é obrigatório'),
    startTime: z.string().min(1, 'Horário de início é obrigatório'),
    endTime: z.string().min(1, 'Horário de término é obrigatório'),
    room: z.string().min(1, 'Sala é obrigatória'),
});

export type ScheduleFormValues = z.infer<typeof formSchema>;

interface ScheduleFormProps {
    initialData?: Schedule | null;
    onSubmit: (values: ScheduleFormValues) => Promise<void>;
    isLoading: boolean;
    submitLabel?: string;
    onCheckConflicts?: (values: ScheduleFormValues) => Promise<void>;
}

export function ScheduleForm({ initialData, onSubmit, isLoading, submitLabel = 'Salvar', onCheckConflicts }: ScheduleFormProps) {
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const form = useForm<ScheduleFormValues>({
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

    useEffect(() => {
        if (initialData) {
            form.reset({
                classId: initialData.classEntity?.id.toString() || '',
                subjectId: initialData.subject?.id.toString() || '',
                teacherId: initialData.teacher?.id.toString() || '',
                dayOfWeek: initialData.dayOfWeek,
                startTime: initialData.startTime,
                endTime: initialData.endTime,
                room: initialData.room,
            });
        }
    }, [initialData, form]);

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
        } finally {
            setLoadingData(false);
        }
    };

    const handleCheckConflicts = async () => {
        if (onCheckConflicts) {
            const values = form.getValues();
            // Validate basic fields before checking
            const isValid = await form.trigger(['dayOfWeek', 'startTime', 'endTime', 'room', 'teacherId']);
            if (isValid) {
                await onCheckConflicts(values);
            } else {
                toast.error('Preencha os campos de horário, sala e professor para verificar conflitos');
            }
        }
    };

    if (loadingData) {
        return <div>Carregando formulário...</div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="classId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Turma</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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

                <div className="flex gap-4">
                    {onCheckConflicts && (
                        <Button type="button" variant="outline" onClick={handleCheckConflicts} className="w-1/3">
                            Verificar Conflitos
                        </Button>
                    )}
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
