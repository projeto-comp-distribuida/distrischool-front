'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { scheduleService } from '@/services/schedule.service';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { teacherService } from '@/services/teacher.service';
import { Schedule } from '@/types/schedule.types';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Teacher } from '@/types/teacher.types';
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
import { School, Calendar, Users, MapPin, Loader2, Clock, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/protected-route';

interface TeacherClassInfo {
    classEntity: ClassEntity;
    subject: Subject;
    schedules: Schedule[];
}

const dayLabels: Record<string, string> = {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
};

function TeacherClassesContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [classes, setClasses] = useState<TeacherClassInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadTeacherData();
        }
    }, [user]);

    const loadTeacherData = async () => {
        try {
            setLoading(true);
            
            let foundTeacher: Teacher | null = null;
            
            // Estratégia 1: Tentar buscar pelo ID do usuário diretamente
            if (user?.id) {
                try {
                    const userId = Number(user.id);
                    if (!isNaN(userId)) {
                        foundTeacher = await teacherService.getById(userId);
                    }
                } catch (error) {
                    // Se não encontrar pelo ID, continuar para próxima estratégia
                    console.log('Professor não encontrado pelo ID, tentando por email...');
                }
            }
            
            // Estratégia 2: Buscar pelo email (case insensitive)
            if (!foundTeacher && user?.email) {
                try {
                    const allTeachers = await teacherService.getAll();
                    const teachersArray = Array.isArray(allTeachers) 
                        ? allTeachers 
                        : (allTeachers as any).content || [];
                    
                    // Buscar por email (case insensitive e removendo espaços)
                    const userEmail = user.email.trim().toLowerCase();
                    foundTeacher = teachersArray.find((t: Teacher) => 
                        t.email?.trim().toLowerCase() === userEmail
                    ) || null;
                } catch (error) {
                    console.error('Erro ao buscar professores:', error);
                }
            }
            
            if (!foundTeacher) {
                // Não redirecionar imediatamente, mostrar mensagem na tela
                setTeacher(null);
                setClasses([]);
                setLoading(false);
                toast.warning('Professor não encontrado. Verifique se seu cadastro está completo.');
                return;
            }
            
            setTeacher(foundTeacher);
            
            // Buscar todos os dados necessários em paralelo
            const [schedulesResponse, allClassesResponse, allSubjectsResponse] = await Promise.all([
                scheduleService.getAll(),
                classService.getAll(),
                subjectService.getAll(),
            ]);
            
            // Processar respostas
            const allSchedules = (schedulesResponse as any).content || (Array.isArray(schedulesResponse) ? schedulesResponse : []);
            const allClasses = Array.isArray(allClassesResponse) ? allClassesResponse : (allClassesResponse as any).content || [];
            const allSubjects = Array.isArray(allSubjectsResponse) ? allSubjectsResponse : (allSubjectsResponse as any).content || [];
            
            // Criar mapas para acesso rápido
            const classesMap = new Map<number, ClassEntity>();
            allClasses.forEach((cls: ClassEntity) => {
                classesMap.set(cls.id, cls);
            });
            
            const subjectsMap = new Map<number, Subject>();
            allSubjects.forEach((subj: Subject) => {
                subjectsMap.set(subj.id, subj);
            });
            
            // Filtrar schedules do professor
            const teacherSchedules = allSchedules.filter((schedule: Schedule) => 
                schedule.teacherId === foundTeacher.id
            );
            
            if (teacherSchedules.length === 0) {
                setClasses([]);
                setLoading(false);
                return;
            }
            
            // Agrupar por classe e disciplina
            const classMap = new Map<string, TeacherClassInfo>();
            
            for (const schedule of teacherSchedules) {
                const classId = schedule.classEntity?.id || schedule.classId;
                const subjectId = schedule.subject?.id || schedule.subjectId;
                
                if (!classId || !subjectId) continue;
                
                const key = `${classId}-${subjectId}`;
                
                if (!classMap.has(key)) {
                    // Buscar dados da classe e disciplina dos mapas
                    const classData = classesMap.get(classId);
                    const subjectData = subjectsMap.get(subjectId);
                    
                    if (!classData || !subjectData) {
                        console.warn(`Classe ${classId} ou disciplina ${subjectId} não encontrada nos dados carregados`);
                        continue;
                    }
                    
                    classMap.set(key, {
                        classEntity: classData,
                        subject: subjectData,
                        schedules: [],
                    });
                }
                
                const classInfo = classMap.get(key)!;
                classInfo.schedules.push(schedule);
            }
            
            setClasses(Array.from(classMap.values()));
        } catch (error) {
            toast.error('Erro ao carregar turmas');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-lg">Carregando suas turmas...</p>
            </div>
        );
    }

    // Se professor não foi encontrado
    if (!teacher) {
        return (
            <div className="space-y-8 p-6">
                <Breadcrumbs
                    items={[
                        { label: 'Dashboard', href: '/dashboard' },
                        { label: 'Minhas Turmas' },
                    ]}
                />
                <Card className="border-2 shadow-lg">
                    <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-6 mb-4">
                            <School className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Professor não encontrado</h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                            Não foi possível encontrar seu cadastro como professor no sistema. 
                            Verifique se seu email ({user?.email}) está cadastrado corretamente ou entre em contato com o administrador.
                        </p>
                        <Button onClick={() => router.push('/dashboard')} variant="outline">
                            Voltar ao Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6">
            <Breadcrumbs
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Minhas Turmas' },
                ]}
            />

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                    <School className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">Minhas Turmas</h1>
                                    <p className="text-indigo-100 text-lg mt-1">
                                        {teacher.fullName || teacher.name || 'Professor'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-6">
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <School className="h-5 w-5" />
                            <span className="font-semibold">{classes.length}</span>
                            <span className="text-indigo-100">turma{classes.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Lista de Turmas */}
            {classes.length === 0 ? (
                <Card className="border-2 shadow-lg">
                    <CardContent className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="rounded-full bg-muted p-6 mb-4">
                            <School className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Nenhuma turma encontrada</h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                            Você ainda não foi atribuído a nenhuma turma. Entre em contato com o administrador.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {classes.map((classInfo) => {
                        const { classEntity, subject, schedules } = classInfo;
                        return (
                            <Card key={`${classEntity.id}-${subject.id}`} className="border-2 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                <School className="h-5 w-5 text-primary" />
                                                {classEntity.name}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {subject.name} • {classEntity.code} • {classEntity.academicYear}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{schedules.length} horário{schedules.length !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                <strong>Sala:</strong> {classEntity.room}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                <strong>Capacidade:</strong> {classEntity.capacity} alunos
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                <strong>Período:</strong> {classEntity.period}º Período
                                            </span>
                                        </div>
                                    </div>

                                    {/* Horários */}
                                    <div className="mt-6">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Horários
                                        </h4>
                                        <div className="space-y-2">
                                            {schedules.map((schedule) => (
                                                <div
                                                    key={schedule.id}
                                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                            <span className="font-medium">
                                                                {dayLabels[schedule.dayOfWeek] || schedule.dayOfWeek}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">
                                                                {schedule.startTime} - {schedule.endTime}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm">{schedule.room}</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => 
                                                            router.push(
                                                                `/dashboard/subjects/${subject.id}/classes/${classEntity.id}/schedules/${schedule.id}/attendance`
                                                            )
                                                        }
                                                        className="gap-2"
                                                    >
                                                        <ClipboardCheck className="h-4 w-4" />
                                                        Fazer Chamada
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function TeacherClassesPage() {
    return (
        <ProtectedRoute allowedRoles={['TEACHER']}>
            <TeacherClassesContent />
        </ProtectedRoute>
    );
}

