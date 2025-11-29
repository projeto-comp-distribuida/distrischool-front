'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { subjectService } from '@/services/subject.service';
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
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const formSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres'),
    workloadHours: z.coerce.number().min(1, 'Carga horária deve ser maior que 0'),
    description: z.string().optional(),
    academicCenterId: z.coerce.number().min(1, 'Centro acadêmico é obrigatório'),
});

export default function CreateCoursePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    
    const isStudent = user?.roles?.includes('STUDENT');
    
    useEffect(() => {
        // Redirecionar alunos que tentarem acessar esta página
        if (isStudent) {
            toast.error('Você não tem permissão para criar cursos');
            router.push('/dashboard/courses');
        }
    }, [isStudent, router]);
    
    // Não renderizar nada se for aluno (será redirecionado)
    if (isStudent) {
        return null;
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            workloadHours: 0,
            description: '',
            academicCenterId: 0, // Must be provided by user
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            await subjectService.create({
                ...values,
                description: values.description || '',
            });
            toast.success('Curso criado com sucesso!');
            router.push('/dashboard/courses'); // Assuming a list page exists or redirect back
        } catch (error) {
            toast.error('Erro ao criar curso');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/courses')}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>Criar Novo Curso</CardTitle>
                </CardHeader>
                <CardContent>
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

                            <FormField
                                control={form.control}
                                name="academicCenterId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Centro Acadêmico ID</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="Ex: 1" 
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Criando...' : 'Criar Curso'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
