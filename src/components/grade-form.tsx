'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GradeResponseDTO, GradeRequestDTO, GradeStatus } from '@/types/grade.types';
import { GradeValueInput } from '@/components/grade-value-input';
import { AcademicPeriodSelector } from '@/components/academic-period-selector';
import { useEffect, useState } from 'react';
import { studentService } from '@/services/student.service';
import { classService } from '@/services/class.service';
import { evaluationService } from '@/services/evaluation.service';
import { Student } from '@/types/student.types';
import { ClassEntity } from '@/types/class.types';
import { Evaluation } from '@/types/evaluation.types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    studentId: z.coerce.number().min(1, 'Aluno é obrigatório'),
    teacherId: z.coerce.number().min(1, 'Professor é obrigatório'),
    classId: z.coerce.number().min(1, 'Turma é obrigatória'),
    evaluationId: z.coerce.number().min(1, 'Avaliação é obrigatória'),
    gradeValue: z.number().min(0, 'Nota deve ser maior ou igual a 0').max(10, 'Nota deve ser menor ou igual a 10'),
    gradeDate: z.string().min(1, 'Data da avaliação é obrigatória'),
    notes: z.string().optional(),
    status: z.nativeEnum(GradeStatus).default(GradeStatus.REGISTERED),
    isAutomatic: z.boolean().default(false),
    academicYear: z.number().min(2000, 'Ano letivo inválido'),
    academicSemester: z.number().min(1).max(2, 'Semestre deve ser 1 ou 2'),
});

export type GradeFormValues = z.infer<typeof formSchema>;

interface GradeFormProps {
    initialData?: GradeResponseDTO | null;
    onSubmit: (values: GradeFormValues) => Promise<void>;
    isLoading: boolean;
    submitLabel?: string;
    onCancel?: () => void;
    teacherId?: number;
    classId?: number;
    evaluationId?: number;
    academicYear?: number;
    academicSemester?: number;
}

export function GradeForm({
    initialData,
    onSubmit,
    isLoading,
    submitLabel = 'Salvar',
    onCancel,
    teacherId: defaultTeacherId,
    classId: defaultClassId,
    evaluationId: defaultEvaluationId,
    academicYear: defaultAcademicYear,
    academicSemester: defaultAcademicSemester,
}: GradeFormProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedClassId, setSelectedClassId] = useState<number | undefined>(defaultClassId);
    const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | undefined>(defaultEvaluationId);

    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];

    const form = useForm<GradeFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            studentId: initialData?.studentId || 0,
            teacherId: initialData?.teacherId || defaultTeacherId || 0,
            classId: initialData?.classId || defaultClassId || 0,
            evaluationId: initialData?.evaluationId || defaultEvaluationId || 0,
            gradeValue: initialData?.gradeValue || 0,
            gradeDate: initialData?.gradeDate || today,
            notes: initialData?.notes || '',
            status: initialData?.status || GradeStatus.REGISTERED,
            isAutomatic: initialData?.isAutomatic || false,
            academicYear: initialData?.academicYear || defaultAcademicYear || currentYear,
            academicSemester: initialData?.academicSemester || defaultAcademicSemester || 1,
        },
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingData(true);
                
                // Load classes
                const classesResponse = await classService.getAll();
                const classesList = Array.isArray(classesResponse)
                    ? classesResponse
                    : (classesResponse as any).content || [];
                setClasses(classesList);

                // Load students if class is selected
                if (selectedClassId) {
                    const classData = classesList.find(c => c.id === selectedClassId);
                    if (classData?.studentIds && classData.studentIds.length > 0) {
                        const studentPromises = classData.studentIds.map(id => 
                            studentService.getById(id).catch(() => null)
                        );
                        const studentsList = (await Promise.all(studentPromises)).filter(Boolean) as Student[];
                        setStudents(studentsList);
                    }
                }

                // Load evaluations if class is selected
                if (selectedClassId) {
                    const evaluationsList = await evaluationService.getByClass(selectedClassId);
                    setEvaluations(evaluationsList);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, [selectedClassId]);

    const handleClassChange = async (classId: number) => {
        setSelectedClassId(classId);
        form.setValue('classId', classId);
        form.setValue('studentId', 0);
        form.setValue('evaluationId', 0);

        try {
            const classData = classes.find(c => c.id === classId);
            if (classData?.studentIds && classData.studentIds.length > 0) {
                const studentPromises = classData.studentIds.map(id => 
                    studentService.getById(id).catch(() => null)
                );
                const studentsList = (await Promise.all(studentPromises)).filter(Boolean) as Student[];
                setStudents(studentsList);
            }

            const evaluationsList = await evaluationService.getByClass(classId);
            setEvaluations(evaluationsList);
        } catch (error) {
            console.error('Error loading class data:', error);
        }
    };

    const statusOptions = [
        { value: GradeStatus.REGISTERED, label: 'Registrada' },
        { value: GradeStatus.PENDING, label: 'Pendente' },
        { value: GradeStatus.CONFIRMED, label: 'Confirmada' },
        { value: GradeStatus.DISPUTED, label: 'Em Disputa' },
        { value: GradeStatus.CANCELLED, label: 'Cancelada' },
    ];

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="classId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Turma</FormLabel>
                                <Select
                                    onValueChange={(value) => handleClassChange(Number(value))}
                                    value={field.value ? String(field.value) : undefined}
                                    disabled={loadingData || !!defaultClassId}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a turma" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={String(cls.id)}>
                                                {cls.name} ({cls.code})
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
                        name="evaluationId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Avaliação</FormLabel>
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(Number(value));
                                        setSelectedEvaluationId(Number(value));
                                    }}
                                    value={field.value ? String(field.value) : undefined}
                                    disabled={loadingData || !selectedClassId || !!defaultEvaluationId}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a avaliação" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {evaluations.map((evaluation) => (
                                            <SelectItem key={evaluation.id} value={String(evaluation.id)}>
                                                {evaluation.name} ({evaluation.type})
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
                    name="studentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Aluno</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(Number(value))}
                                value={field.value ? String(field.value) : undefined}
                                disabled={loadingData || !selectedClassId}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o aluno" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {students.map((student) => (
                                        <SelectItem key={student.id} value={String(student.id)}>
                                            {student.fullName} ({student.registrationNumber})
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
                        name="gradeValue"
                        render={({ field }) => (
                            <FormItem>
                                <GradeValueInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    label="Nota"
                                    error={form.formState.errors.gradeValue?.message}
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="gradeDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data da Avaliação</FormLabel>
                                <FormControl>
                                    <input
                                        type="date"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <AcademicPeriodSelector
                    academicYear={form.watch('academicYear')}
                    academicSemester={form.watch('academicSemester')}
                    onYearChange={(year) => form.setValue('academicYear', year)}
                    onSemesterChange={(semester) => form.setValue('academicSemester', semester)}
                />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(value as GradeStatus)}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
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
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações (opcional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Observações sobre a nota..."
                                    {...field}
                                    rows={3}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                            Cancelar
                        </Button>
                    )}
                    <Button type="submit" disabled={isLoading || loadingData}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}


