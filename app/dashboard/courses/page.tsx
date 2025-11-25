'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { subjectService } from '@/services/subject.service';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus, Pencil, Trash2, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres'),
    workloadHours: z.coerce.number().min(1, 'Carga horária deve ser maior que 0'),
    description: z.string().optional(),
    academicCenterId: z.coerce.number().min(1, 'Centro acadêmico é obrigatório'),
});

export default function CoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Subject | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
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
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const response = await subjectService.getAll();
            // Handle paginated response or array
            const data = (response as any).content || (Array.isArray(response) ? response : []);
            setCourses(data);
        } catch (error) {
            toast.error('Erro ao carregar cursos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (course: Subject) => {
        setEditingCourse(course);
        form.reset({
            name: course.name,
            code: course.code,
            workloadHours: course.workloadHours,
            description: course.description || '',
            academicCenterId: course.academicCenterId || 1,
        });
        setEditDialogOpen(true);
    };

    const handleSubmitEdit = async (values: z.infer<typeof formSchema>) => {
        if (!editingCourse) return;

        setSubmitting(true);
        try {
            await subjectService.update(editingCourse.id, {
                ...values,
                description: values.description || '',
            });
            toast.success('Curso atualizado com sucesso!');
            setEditDialogOpen(false);
            setEditingCourse(null);
            loadCourses();
        } catch (error) {
            toast.error('Erro ao atualizar curso');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este curso?')) return;

        try {
            await subjectService.delete(id);
            toast.success('Curso excluído com sucesso');
            loadCourses();
        } catch (error) {
            toast.error('Erro ao excluir curso');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cursos e Disciplinas</h1>
                    <p className="text-muted-foreground">
                        Gerencie as disciplinas ofertadas pela instituição.
                    </p>
                </div>
                <Button onClick={() => router.push('/dashboard/courses/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Curso
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Cursos</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">Carregando...</div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhum curso encontrado.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Carga Horária</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {courses.map((course) => (
                                    <TableRow key={course.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center">
                                                <BookOpen className="mr-2 h-4 w-4 text-primary" />
                                                {course.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{course.code}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Clock className="mr-2 h-3 w-3 text-muted-foreground" />
                                                {course.workloadHours}h
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-md truncate" title={course.description}>
                                            {course.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(course)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(course.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Curso</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmitEdit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Curso</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                                <Input {...field} />
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
                                            <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Salvando...' : 'Salvar'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
