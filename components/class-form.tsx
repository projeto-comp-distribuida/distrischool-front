'use client';

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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ClassEntity } from '@/types/class.types';
import { Student } from '@/types/student.types';
import { Teacher } from '@/types/teacher.types';
import { useEffect, useState } from 'react';
import { studentService } from '@/services/student.service';
import { teacherService } from '@/services/teacher.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres'),
    academicYear: z.string().min(4, 'Ano letivo inválido'),
    period: z.string().min(1, 'Período é obrigatório'),
    capacity: z.coerce.number().min(1, 'Capacidade deve ser maior que 0'),
    shiftId: z.coerce.number().min(1, 'Turno é obrigatório'),
    room: z.string().min(1, 'Sala é obrigatória'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de término é obrigatória'),
    studentIds: z.array(z.number()).optional(),
    teacherIds: z.array(z.number()).optional(),
});

export type ClassFormValues = z.infer<typeof formSchema>;

const shiftOptions = [
    { id: 1, label: 'Matutino' },
    { id: 2, label: 'Vespertino' },
    { id: 3, label: 'Noturno' },
];

interface ClassFormProps {
    initialData?: ClassEntity | null;
    onSubmit: (values: ClassFormValues) => Promise<void>;
    isLoading: boolean;
    submitLabel?: string;
}

export function ClassForm({ initialData, onSubmit, isLoading, submitLabel = 'Salvar' }: ClassFormProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [loadingTeachers, setLoadingTeachers] = useState(true);

    const form = useForm<ClassFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            academicYear: new Date().getFullYear().toString(),
            period: '1',
            capacity: 30,
            shiftId: 1,
            room: '',
            startDate: '',
            endDate: '',
            studentIds: [],
            teacherIds: [],
        },
    });

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const response = await studentService.getAll({ page: 0, size: 1000 });
                const studentsList = Array.isArray(response) ? response : response.content || [];
                setStudents(studentsList);
            } catch (error) {
                console.error('Erro ao carregar estudantes:', error);
            } finally {
                setLoadingStudents(false);
            }
        };

        const loadTeachers = async () => {
            try {
                const teachersList = await teacherService.getAll({ page: 0, size: 1000 });
                const teachersArray = Array.isArray(teachersList) ? teachersList : teachersList.content || [];
                setTeachers(teachersArray);
            } catch (error) {
                console.error('Erro ao carregar professores:', error);
            } finally {
                setLoadingTeachers(false);
            }
        };

        loadStudents();
        loadTeachers();
    }, []);

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                code: initialData.code,
                academicYear: initialData.academicYear.toString(),
                period: initialData.period.toString(),
                capacity: initialData.capacity,
                shiftId: initialData.shiftId || initialData.shift?.id || 1,
                room: initialData.room,
                startDate: initialData.startDate,
                endDate: initialData.endDate,
                studentIds: initialData.studentIds || [],
                teacherIds: initialData.teacherIds || [],
            });
        }
    }, [initialData, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Turma</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Turma A - 2024" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Código</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: TURMA-A" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="academicYear"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ano Letivo</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Capacidade</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
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

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="period"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Período</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: 1" {...field} />
                                </FormControl>
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
                                    <Input placeholder="Sala 101" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data Início</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data Término</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Seleção de Estudantes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Estudantes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingStudents ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Carregando estudantes...</span>
                            </div>
                        ) : (
                            <FormField
                                control={form.control}
                                name="studentIds"
                                render={() => (
                                    <FormItem>
                                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-4">
                                            {students.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">Nenhum estudante disponível</p>
                                            ) : (
                                                students.map((student) => (
                                                    <FormField
                                                        key={student.id}
                                                        control={form.control}
                                                        name="studentIds"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem
                                                                    key={student.id}
                                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                                >
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(student.id)}
                                                                            onCheckedChange={(checked) => {
                                                                                const currentIds = field.value || [];
                                                                                return checked
                                                                                    ? field.onChange([...currentIds, student.id])
                                                                                    : field.onChange(
                                                                                          currentIds.filter((id) => id !== student.id)
                                                                                      );
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal cursor-pointer flex-1">
                                                                        {student.fullName} - {student.registrationNumber}
                                                                        {student.course && ` (${student.course})`}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            );
                                                        }}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Seleção de Professores */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Professores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingTeachers ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Carregando professores...</span>
                            </div>
                        ) : (
                            <FormField
                                control={form.control}
                                name="teacherIds"
                                render={() => (
                                    <FormItem>
                                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-4">
                                            {teachers.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">Nenhum professor disponível</p>
                                            ) : (
                                                teachers.map((teacher) => (
                                                    <FormField
                                                        key={teacher.id}
                                                        control={form.control}
                                                        name="teacherIds"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem
                                                                    key={teacher.id}
                                                                    className="flex flex-row items-start space-x-3 space-y-0"
                                                                >
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(teacher.id)}
                                                                            onCheckedChange={(checked) => {
                                                                                const currentIds = field.value || [];
                                                                                return checked
                                                                                    ? field.onChange([...currentIds, teacher.id])
                                                                                    : field.onChange(
                                                                                          currentIds.filter((id) => id !== teacher.id)
                                                                                      );
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal cursor-pointer flex-1">
                                                                        {teacher.name || teacher.fullName} - {teacher.employeeId}
                                                                        {teacher.qualification && ` (${teacher.qualification})`}
                                                                    </FormLabel>
                                                                </FormItem>
                                                            );
                                                        }}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : submitLabel}
                </Button>
            </form>
        </Form>
    );
}
