'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Subject } from '@/types/subject.types';
import { useEffect } from 'react';

const formSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres'),
    workloadHours: z.coerce.number().min(1, 'Carga horária deve ser maior que 0'),
    description: z.string().optional(),
    academicCenterId: z.coerce.number().min(1, 'Centro acadêmico é obrigatório'),
});

export type CourseFormValues = z.infer<typeof formSchema>;

interface CourseFormProps {
    initialData?: Subject | null;
    onSubmit: (values: CourseFormValues) => Promise<void>;
    isLoading: boolean;
    submitLabel?: string;
}

export function CourseForm({ initialData, onSubmit, isLoading, submitLabel = 'Salvar' }: CourseFormProps) {
    const form = useForm<CourseFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            workloadHours: 0,
            description: '',
            academicCenterId: 1,
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                code: initialData.code,
                workloadHours: initialData.workloadHours,
                description: initialData.description || '',
                academicCenterId: initialData.academicCenter?.id || 1,
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
                            <FormLabel>Nome do Curso</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Matemática Avançada" {...field} />
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
                                    <Input placeholder="Ex: MAT-001" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="workloadHours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Carga Horária (h)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Descrição do curso..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : submitLabel}
                </Button>
            </form>
        </Form>
    );
}
