'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { subjectService } from '@/services/subject.service';
import { classService } from '@/services/class.service';
import { scheduleService } from '@/services/schedule.service';
import { Subject } from '@/types/subject.types';
import { ClassEntity } from '@/types/class.types';
import { Schedule } from '@/types/schedule.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, BookOpen, Clock, Search, RefreshCw, GraduationCap, Loader2, ArrowLeft, School, Users } from 'lucide-react';
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
    const { user } = useAuth();
    const [courses, setCourses] = useState<Subject[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Subject | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    // Filters
    const [searchName, setSearchName] = useState('');
    const [searchCode, setSearchCode] = useState('');

    const isStudent = user?.roles?.includes('STUDENT');
    const studentId = user?.studentId ? Number(user.studentId) : null;

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
    }, [user]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            
            if (isStudent && studentId) {
                // Para estudantes, buscar apenas cursos em que estão matriculados
                await loadStudentCourses();
            } else {
                // Para admin/teacher, mostrar todos os cursos
                const data = await subjectService.getAll();
                setCourses(data);
                setFilteredCourses(data);
            }
        } catch (error) {
            toast.error('Erro ao carregar cursos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadStudentCourses = async () => {
        try {
            // Buscar todas as classes
            const allClasses = await classService.getAll();
            
            // Filtrar apenas classes em que o estudante está matriculado
            const studentClasses = allClasses.filter((cls: ClassEntity) => {
                return cls.studentIds && cls.studentIds.includes(studentId!);
            });
            
            // Extrair subjectIds únicos das classes do estudante
            const enrolledSubjectIds = new Set<number>();
            
            studentClasses.forEach((cls: ClassEntity) => {
                // Verificar subjectId direto na classe
                if (cls.subjectId) {
                    enrolledSubjectIds.add(cls.subjectId);
                }
                
                // Verificar subjects array
                if (cls.subjects && cls.subjects.length > 0) {
                    cls.subjects.forEach(subj => {
                        enrolledSubjectIds.add(subj.id);
                    });
                }
            });
            
            // Buscar schedules para encontrar mais conexões entre classes e subjects
            const schedulesResponse = await scheduleService.getAll();
            const schedulesData = (schedulesResponse as any).content || (Array.isArray(schedulesResponse) ? schedulesResponse : []);
            
            studentClasses.forEach((cls: ClassEntity) => {
                schedulesData.forEach((schedule: Schedule) => {
                    const scheduleClassId = schedule.classEntity?.id || schedule.classId;
                    const scheduleSubjectId = schedule.subjectId || schedule.subject?.id;
                    
                    if (scheduleClassId === cls.id && scheduleSubjectId) {
                        enrolledSubjectIds.add(scheduleSubjectId);
                    }
                });
            });
            
            // Buscar todos os subjects e filtrar apenas os que o estudante está matriculado
            const allSubjects = await subjectService.getAll();
            const enrolledSubjects = allSubjects.filter((subject: Subject) => {
                return enrolledSubjectIds.has(subject.id);
            });
            
            setCourses(enrolledSubjects);
            setFilteredCourses(enrolledSubjects);
        } catch (error) {
            console.error('Erro ao carregar cursos do estudante:', error);
            toast.error('Erro ao carregar seus cursos');
            setCourses([]);
            setFilteredCourses([]);
        }
    };

    const applyFilters = () => {
        let filtered = [...courses];

        if (searchName) {
            filtered = filtered.filter(course =>
                course.name.toLowerCase().includes(searchName.toLowerCase())
            );
        }

        if (searchCode) {
            filtered = filtered.filter(course =>
                course.code.toLowerCase().includes(searchCode.toLowerCase())
            );
        }

        setFilteredCourses(filtered);
    };

    const handleClearFilters = () => {
        setSearchName('');
        setSearchCode('');
        setFilteredCourses(courses);
    };

    const handleRefresh = () => {
        loadCourses();
    };

    useEffect(() => {
        applyFilters();
    }, [searchName, searchCode, courses]);

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
        <div className="space-y-8 p-6">
            <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
            </Button>
            {/* Header com gradiente */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                    <GraduationCap className="h-8 w-8" />
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight">Cursos e Disciplinas</h1>
                            </div>
                            <p className="text-emerald-100 text-lg">
                                {isStudent 
                                    ? 'Visualize os cursos e disciplinas em que você está matriculado'
                                    : 'Gerencie todos os cursos e disciplinas oferecidos'}
                            </p>
                        </div>
                        {!isStudent && (
                            <Button 
                                onClick={() => router.push('/dashboard/courses/create')}
                                size="lg"
                                className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Novo Curso
                            </Button>
                        )}
                    </div>
                    <div className="mt-6 flex items-center gap-6">
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <BookOpen className="h-5 w-5" />
                            <span className="font-semibold">{filteredCourses.length}</span>
                            <span className="text-emerald-100">cursos cadastrados</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Filters */}
            <Card className="border-2 shadow-lg transition-all duration-300 hover:shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">Filtros de Busca</CardTitle>
                    </div>
                    <CardDescription className="text-base">Busque e filtre cursos de forma rápida e eficiente</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Nome do Curso</label>
                            <Input
                                placeholder="Buscar por nome..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Código</label>
                            <Input
                                placeholder="Buscar por código..."
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="flex gap-2 items-end">
                            <Button type="submit" className="gap-2 h-11 flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-300">
                                <Search className="h-4 w-4" />
                                Buscar
                            </Button>
                            <Button type="button" variant="outline" onClick={handleClearFilters} className="h-11">
                                Limpar
                            </Button>
                            <Button type="button" variant="outline" onClick={handleRefresh} disabled={loading} className="h-11">
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Lista de Cursos */}
            <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Lista de Cursos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground text-lg">Carregando cursos...</p>
                        </div>
                    ) : filteredCourses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Nenhum curso encontrado</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                {courses.length === 0 
                                    ? isStudent 
                                        ? "Você ainda não está matriculado em nenhum curso."
                                        : "Comece criando seu primeiro curso para organizar as disciplinas oferecidas."
                                    : "Nenhum curso corresponde aos filtros aplicados. Tente ajustar sua busca."}
                            </p>
                            {courses.length === 0 && !isStudent && (
                                <Button onClick={() => router.push('/dashboard/courses/create')} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Criar Primeiro Curso
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Nome</TableHead>
                                        <TableHead className="font-semibold">Código</TableHead>
                                        <TableHead className="font-semibold">Carga Horária</TableHead>
                                        <TableHead className="font-semibold">Descrição</TableHead>
                                        <TableHead className="font-semibold">Turmas</TableHead>
                                        <TableHead className="text-right font-semibold">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCourses.map((course) => (
                                        <TableRow 
                                            key={course.id}
                                            className="transition-all duration-200 hover:bg-muted/50 cursor-pointer"
                                        >
                                            <TableCell className="font-semibold text-base">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                    <BookOpen className="h-5 w-5 text-primary" />
                                                    {course.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                                    {course.code}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                                                        {course.workloadHours}h
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <p className="truncate text-sm text-muted-foreground" title={course.description}>
                                                    {course.description || <span className="italic">Sem descrição</span>}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/dashboard/subjects/${course.id}/classes`)}
                                                        className="gap-2"
                                                    >
                                                        <School className="h-4 w-4" />
                                                        Ver Turmas
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {!isStudent && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(course)}
                                                            className="hover:bg-emerald-100 dark:hover:bg-emerald-900 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:bg-destructive/10 transition-colors"
                                                            onClick={() => handleDelete(course.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
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
