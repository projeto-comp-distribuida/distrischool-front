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
import { Evaluation, EvaluationType, CreateEvaluationRequest } from '@/types/evaluation.types';
import { useEffect, useState } from 'react';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    type: z.nativeEnum(EvaluationType, {
        required_error: 'Tipo de avaliação é obrigatório',
    }),
    description: z.string().optional(),
    classId: z.coerce.number().min(1, 'Turma é obrigatória'),
    subjectId: z.coerce.number().min(1, 'Disciplina é obrigatória'),
    academicYear: z.coerce.number().min(2000, 'Ano letivo inválido'),
    academicSemester: z.coerce.number().min(1).max(2, 'Semestre deve ser 1 ou 2'),
    maxGrade: z.coerce.number().min(0).max(10, 'Nota máxima deve ser entre 0 e 10').default(10),
    weight: z.coerce.number().min(0).max(100, 'Peso deve ser entre 0 e 100').optional(),
});

export type EvaluationFormValues = z.infer<typeof formSchema>;

const evaluationTypeLabels: Record<EvaluationType, string> = {
    [EvaluationType.EXAM]: 'Prova',
    [EvaluationType.QUIZ]: 'Quiz',
    [EvaluationType.ASSIGNMENT]: 'Trabalho',
    [EvaluationType.PROJECT]: 'Projeto',
    [EvaluationType.PRESENTATION]: 'Apresentação',
    [EvaluationType.PARTICIPATION]: 'Participação',
    [EvaluationType.FINAL]: 'Prova Final',
    [EvaluationType.OTHER]: 'Outro',
};

interface EvaluationFormProps {
    initialData?: Evaluation | null;
    onSubmit: (values: EvaluationFormValues) => Promise<void>;
    isLoading: boolean;
    submitLabel?: string;
    onCancel?: () => void;
    defaultClassId?: number;
    defaultSubjectId?: number;
}

export function EvaluationForm({ 
    initialData, 
    onSubmit, 
    isLoading, 
    submitLabel = 'Salvar',
    onCancel,
    defaultClassId,
    defaultSubjectId,
}: EvaluationFormProps) {
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingSubjects, setLoadingSubjects] = useState(true);

    const currentYear = new Date().getFullYear();

    const form = useForm<EvaluationFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || '',
            type: initialData?.type || EvaluationType.EXAM,
            description: initialData?.description || '',
            classId: initialData?.classId || defaultClassId || 0,
            subjectId: initialData?.subjectId || defaultSubjectId || 0,
            academicYear: initialData?.academicYear || currentYear,
            academicSemester: initialData?.academicSemester || 1,
            maxGrade: initialData?.maxGrade || 10,
            weight: initialData?.weight,
        },
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load classes
                const classesResponse = await classService.getAll();
                const classesList = Array.isArray(classesResponse) 
                    ? classesResponse 
                    : (classesResponse as any).content || [];
                setClasses(classesList);
                setLoadingClasses(false);

                // Load subjects
                const subjectsResponse = await subjectService.getAll();
                const subjectsList = Array.isArray(subjectsResponse)
                    ? subjectsResponse
                    : (subjectsResponse as any).content || [];
                setSubjects(subjectsList);
                setLoadingSubjects(false);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                setLoadingClasses(false);
                setLoadingSubjects(false);
            }
        };

        loadData();
    }, []);

    // Update form values when defaultClassId or defaultSubjectId change
    useEffect(() => {
        if (defaultClassId && !initialData?.classId) {
            form.setValue('classId', defaultClassId);
        }
        if (defaultSubjectId && !initialData?.subjectId) {
            form.setValue('subjectId', defaultSubjectId);
        }
    }, [defaultClassId, defaultSubjectId, form, initialData]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Avaliação</FormLabel>
                            <FormControl>
                                <Input 
                                    placeholder="Ex: Prova 1 - Unidade 1" 
                                    {...field} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de Avaliação</FormLabel>
                            <Select 
                                onValueChange={(value) => field.onChange(value as EvaluationType)}
                                defaultValue={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(evaluationTypeLabels).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
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
                        name="classId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Turma</FormLabel>
                                <Select 
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    value={field.value ? String(field.value) : undefined}
                                    disabled={loadingClasses || !!defaultClassId}
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
                        name="subjectId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Disciplina</FormLabel>
                                <Select 
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    value={field.value ? String(field.value) : undefined}
                                    disabled={loadingSubjects || !!defaultSubjectId}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a disciplina" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {subjects.map((subject) => (
                                            <SelectItem key={subject.id} value={String(subject.id)}>
                                                {subject.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="academicYear"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ano Letivo</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number"
                                        min="2000"
                                        placeholder={String(currentYear)}
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="academicSemester"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Semestre</FormLabel>
                                <Select 
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    value={String(field.value)}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1">1º Semestre</SelectItem>
                                        <SelectItem value="2">2º Semestre</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="maxGrade"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nota Máxima</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        placeholder="10.0"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Peso (opcional)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Ex: 30"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                    value={field.value || ''}
                                />
                            </FormControl>
                            <FormDescription>
                                Peso da avaliação no cálculo da média (0-100)
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição (opcional)</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Descrição adicional da avaliação..."
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
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

