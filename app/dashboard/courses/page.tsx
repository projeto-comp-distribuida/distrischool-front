'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus, Pencil, Trash2, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function CoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

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
                                                    onClick={() => toast.info('Edição em breve')}
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
        </div>
    );
}
