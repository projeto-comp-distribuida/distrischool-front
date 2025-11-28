'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { subjectService } from '@/services/subject.service';
import { scheduleService } from '@/services/schedule.service';
import { classService } from '@/services/class.service';
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
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Plus, School, Calendar, Users, MapPin, Loader2, Pencil, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getClassesForSubject, countSchedulesForClass } from '@/lib/subject-class-helpers';

export default function SubjectClassesPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const subjectId = Number(params.id);
    
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (subjectId) {
            loadData();
        }
    }, [subjectId, user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [subjectData, schedulesResponse, classesResponse] = await Promise.all([
                subjectService.getById(subjectId),
                scheduleService.getAll(),
                classService.getAll(),
            ]);

            setSubject(subjectData);
            
            const schedulesData = (schedulesResponse as any).content || (Array.isArray(schedulesResponse) ? schedulesResponse : []);
            setSchedules(schedulesData);

            // classService.getAll() now returns ClassEntity[] directly
            const allClasses = classesResponse;
            
            // Filtrar classes que pertencem ao subject através de:
            // 1. subjectId direto na classe
            // 2. subjects array contendo o subject
            // 3. schedules que referenciam o subject
            let filteredClasses = allClasses.filter((cls: ClassEntity) => {
                // Verifica se a classe tem subjectId direto
                if (cls.subjectId === subjectId) {
                    return true;
                }
                
                // Verifica se a classe tem o subject no array subjects
                if (cls.subjects && cls.subjects.some(subj => subj.id === subjectId)) {
                    return true;
                }
                
                // Verifica se há schedules que conectam a classe ao subject
                const hasScheduleForSubject = schedulesData.some((schedule: any) => {
                    // Verifica se o schedule tem subjectId ou subject.id igual ao subjectId procurado
                    const scheduleSubjectId = schedule.subjectId || schedule.subject?.id;
                    const scheduleClassId = schedule.classEntity?.id || schedule.classId;
                    return scheduleSubjectId === subjectId && scheduleClassId === cls.id;
                });
                
                return hasScheduleForSubject;
            });

            // Se o usuário for estudante, filtrar apenas classes em que ele está matriculado
            const isStudent = user?.roles?.includes('STUDENT');
            if (isStudent && user?.studentId) {
                const studentId = Number(user.studentId);
                filteredClasses = filteredClasses.filter((cls: ClassEntity) => {
                    return cls.studentIds && cls.studentIds.includes(studentId);
                });
            }
            
            setClasses(filteredClasses);
        } catch (error) {
            toast.error('Erro ao carregar dados');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (classId: number) => {
        if (!confirm('Tem certeza que deseja excluir esta turma?')) return;

        try {
            await classService.delete(classId);
            toast.success('Turma excluída com sucesso');
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir turma');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-lg">Carregando...</p>
            </div>
        );
    }

    if (!subject) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-muted-foreground text-lg">Curso não encontrado</p>
                <Button onClick={() => router.push('/dashboard/courses')} className="mt-4">
                    Voltar para Cursos
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6">
            <Breadcrumbs
                items={[
                    { label: 'Cursos', href: '/dashboard/courses' },
                    { label: subject.name },
                    { label: 'Turmas' },
                ]}
            />

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                    <School className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">Turmas</h1>
                                    <p className="text-blue-100 text-lg mt-1">{subject.name}</p>
                                </div>
                            </div>
                        </div>
                        {user?.roles?.includes('ADMIN') && (
                            <Button 
                                onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes/create`)}
                                size="lg"
                                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                Nova Turma
                            </Button>
                        )}
                    </div>
                    <div className="mt-6 flex items-center gap-6">
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <Users className="h-5 w-5" />
                            <span className="font-semibold">{classes.length}</span>
                            <span className="text-blue-100">turmas cadastradas</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Lista de Turmas */}
            <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <School className="h-5 w-5 text-primary" />
                        Lista de Turmas
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {classes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <School className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Nenhuma turma encontrada</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                Comece criando sua primeira turma para este curso.
                            </p>
                            <Button onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes/create`)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Criar Primeira Turma
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Nome</TableHead>
                                        <TableHead className="font-semibold">Código</TableHead>
                                        <TableHead className="font-semibold">Ano Letivo</TableHead>
                                        <TableHead className="font-semibold">Período</TableHead>
                                        <TableHead className="font-semibold">Sala</TableHead>
                                        <TableHead className="font-semibold">Capacidade</TableHead>
                                        <TableHead className="font-semibold">Horários</TableHead>
                                        <TableHead className="text-right font-semibold">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classes.map((classItem) => {
                                        const scheduleCount = countSchedulesForClass(classItem.id, schedules);
                                        return (
                                            <TableRow 
                                                key={classItem.id}
                                                className="transition-all duration-200 hover:bg-muted/50 cursor-pointer"
                                                onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes/${classItem.id}`)}
                                            >
                                                <TableCell className="font-semibold text-base">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                        {classItem.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                                        {classItem.code}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-primary" />
                                                        <span className="font-medium">{classItem.academicYear}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium">
                                                        {classItem.period}º Período
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{classItem.room}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{classItem.capacity}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{scheduleCount}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/dashboard/subjects/${subjectId}/classes/${classItem.id}`);
                                                            }}
                                                            className="hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                                            title="Ver detalhes da turma"
                                                        >
                                                            <Clock className="h-4 w-4" />
                                                        </Button>
                                                        {user?.roles?.includes('ADMIN') && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes/${classItem.id}/edit`)}
                                                                    className="hover:bg-green-100 dark:hover:bg-green-900 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                                                                    title="Editar turma"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:bg-destructive/10 transition-colors"
                                                                    onClick={() => handleDelete(classItem.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

