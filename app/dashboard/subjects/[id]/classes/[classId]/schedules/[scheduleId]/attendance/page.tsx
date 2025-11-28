'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { attendanceService } from '@/services/attendance.service';
import { scheduleService } from '@/services/schedule.service';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { studentService } from '@/services/student.service';
import { teacherService } from '@/services/teacher.service';
import { Schedule } from '@/types/schedule.types';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Student } from '@/types/student.types';
import { Attendance } from '@/types/attendance.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Loader2, CheckCircle2, XCircle, Calendar, Clock, MapPin, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';

const dayLabels: Record<string, string> = {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
};

export default function ScheduleAttendancePage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const subjectId = params?.id ? Number(params.id) : 0;
    const classId = params?.classId ? Number(params.classId) : 0;
    const scheduleId = params?.scheduleId ? Number(params.scheduleId) : 0;
    
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classEntity, setClassEntity] = useState<ClassEntity | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [attendance, setAttendance] = useState<Record<number, boolean>>({});
    const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const isStudent = user?.roles?.includes('STUDENT');
    const isTeacher = user?.roles?.includes('TEACHER');
    const studentId = user?.studentId ? Number(user.studentId) : null;

    useEffect(() => {
        if (subjectId && classId && scheduleId) {
            // Verificar se o estudante está matriculado na classe
            if (isStudent && studentId) {
                checkStudentEnrollment();
            } else if (isTeacher) {
                // Verificar se o professor é o responsável pelo schedule
                checkTeacherAccess();
            } else {
                loadData();
                loadAttendanceHistory();
            }
        }
    }, [subjectId, classId, scheduleId, user]);

    const checkStudentEnrollment = async () => {
        try {
            const classData = await classService.getById(classId);
            
            // Verificar se o estudante está matriculado
            if (!classData.studentIds || !classData.studentIds.includes(studentId!)) {
                toast.error('Você não está matriculado nesta turma');
                router.push('/dashboard');
                return;
            }
            
            // Estudante está matriculado, carregar dados
            loadData();
            loadAttendanceHistory();
        } catch (error) {
            toast.error('Erro ao verificar matrícula');
            console.error(error);
            router.push('/dashboard');
        }
    };

    const checkTeacherAccess = async () => {
        try {
            let foundTeacher: any = null;
            
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
                    foundTeacher = teachersArray.find((t: any) => 
                        t.email?.trim().toLowerCase() === userEmail
                    ) || null;
                } catch (error) {
                    console.error('Erro ao buscar professores:', error);
                }
            }
            
            if (!foundTeacher) {
                toast.error('Professor não encontrado. Verifique se seu cadastro está completo.');
                router.push('/dashboard/teacher/classes');
                return;
            }
            
            // Buscar o schedule para verificar o teacherId
            const scheduleData = await scheduleService.getById(scheduleId);
            
            if (scheduleData.teacherId !== foundTeacher.id) {
                toast.error('Você não tem permissão para acessar esta turma');
                router.push('/dashboard/teacher/classes');
                return;
            }
            
            // Professor tem acesso, carregar dados
            loadData();
            loadAttendanceHistory();
        } catch (error) {
            toast.error('Erro ao verificar acesso');
            console.error(error);
            router.push('/dashboard/teacher/classes');
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Step 1: Fetch all students
            console.log('Step 1: Fetching all students...');
            const allStudents: Student[] = [];
            let page = 0;
            let hasMorePages = true;
            
            while (hasMorePages) {
                const studentsResponse = await studentService.getAll({
                    page,
                    size: 20,
                    sortBy: 'id',
                    direction: 'ASC'
                });
                
                console.log(`Fetched page ${page}: ${studentsResponse.content.length} students`);
                allStudents.push(...studentsResponse.content);
                
                hasMorePages = !studentsResponse.last && studentsResponse.content.length > 0;
                page++;
            }
            
            console.log(`Total students fetched: ${allStudents.length}`);
            
            // Step 2: Fetch class data to get studentIds
            console.log('Step 2: Fetching class data...');
            const [scheduleData, classData, subjectData] = await Promise.all([
                scheduleService.getById(scheduleId),
                classService.getById(classId),
                subjectService.getById(subjectId),
            ]);

            setSchedule(scheduleData);
            setClassEntity(classData);
            setSubject(subjectData);

            // Step 3: Filter students by class studentIds
            console.log('Step 3: Filtering students by class studentIds...');
            console.log('Class studentIds:', classData.studentIds);
            
            if (classData.studentIds && classData.studentIds.length > 0) {
                const classStudentIdsSet = new Set(classData.studentIds);
                const validStudents = allStudents.filter(student => 
                    classStudentIdsSet.has(student.id)
                );
                
                console.log(`Filtered to ${validStudents.length} students matching class`);
                
                setStudents(validStudents);

                // Initialize attendance
                const initialAttendance: Record<number, boolean> = {};
                validStudents.forEach((s: Student) => {
                    initialAttendance[s.id] = false;
                });
                setAttendance(initialAttendance);
            } else {
                // No students in class
                console.log('No studentIds found in class data');
                setStudents([]);
                setAttendance({});
            }
        } catch (error) {
            toast.error('Erro ao carregar dados');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadAttendanceHistory = async () => {
        try {
            // Get all attendance records for this schedule (without date filter)
            let attendanceData = await attendanceService.getBySchedule(scheduleId);
            
            // Se for estudante, filtrar apenas suas presenças
            if (isStudent && studentId) {
                attendanceData = attendanceData.filter(att => att.studentId === studentId);
            }
            
            // Sort by date descending (most recent first)
            const sorted = attendanceData.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setAttendanceHistory(sorted);
        } catch (error) {
            console.error('Error loading attendance history:', error);
            setAttendanceHistory([]);
        }
    };

    const handleAttendanceChange = (studentId: number, present: boolean) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: present,
        }));
    };

    const handleOpenModal = () => {
        // Reset form
        const initialAttendance: Record<number, boolean> = {};
        students.forEach((s: Student) => {
            initialAttendance[s.id] = false;
        });
        setAttendance(initialAttendance);
        setAttendanceDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!scheduleId || !attendanceDate) {
            toast.error('Data é obrigatória');
            return;
        }

        setSubmitting(true);
        try {
            const studentPresence: Record<number, boolean> = {};
            students.forEach(student => {
                studentPresence[student.id] = attendance[student.id] || false;
            });

            await attendanceService.markAttendance({
                scheduleId,
                date: attendanceDate,
                studentPresence,
                notes: notes || undefined,
            });

            toast.success('Chamada registrada com sucesso!');
            setIsModalOpen(false);
            loadAttendanceHistory();
        } catch (error) {
            toast.error('Erro ao registrar chamada');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    // Group attendance by date
    const attendanceByDate = attendanceHistory.reduce((acc, att) => {
        const date = att.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(att);
        return acc;
    }, {} as Record<string, Attendance[]>);

    const sortedDates = Object.keys(attendanceByDate).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-lg">Carregando...</p>
            </div>
        );
    }

    if (!schedule || !subject || !classEntity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-muted-foreground text-lg">Dados não encontrados</p>
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
                    { label: subject.name, href: `/dashboard/subjects/${subjectId}/classes` },
                    { label: classEntity.name, href: `/dashboard/subjects/${subjectId}/classes/${classId}/schedules` },
                    { label: 'Horários', href: `/dashboard/subjects/${subjectId}/classes/${classId}/schedules` },
                    { label: 'Chamada' },
                ]}
            />

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">Chamada</h1>
                                    <p className="text-green-100 text-lg mt-1">{subject.name} - {classEntity.name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <Calendar className="h-5 w-5" />
                            <span className="font-semibold">{dayLabels[schedule.dayOfWeek] || schedule.dayOfWeek}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <Clock className="h-5 w-5" />
                            <span className="font-semibold">{schedule.startTime} - {schedule.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                            <MapPin className="h-5 w-5" />
                            <span className="font-semibold">{schedule.room}</span>
                        </div>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            </div>

            {/* Action Button - Only show for teachers/admins */}
            {!isStudent && (
                <div className="flex justify-end">
                    <Button onClick={handleOpenModal} className="gap-2" size="lg">
                        <Plus className="h-5 w-5" />
                        Registrar Chamada
                    </Button>
                </div>
            )}

            {/* Attendance History */}
            <Card className="border-2 shadow-lg">
                <CardHeader>
                    <CardTitle>{isStudent ? 'Minhas Presenças' : 'Histórico de Chamadas'}</CardTitle>
                    <CardDescription>
                        {isStudent 
                            ? 'Seu histórico de presenças para este horário'
                            : 'Registros de chamadas realizadas para este horário'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sortedDates.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">
                                {isStudent ? 'Nenhuma presença registrada ainda' : 'Nenhuma chamada registrada ainda'}
                            </p>
                            {!isStudent && (
                                <p className="text-muted-foreground text-sm mt-2">Clique em "Registrar Chamada" para começar</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {sortedDates.map((date) => {
                                const dateAttendances = attendanceByDate[date];
                                const presentCount = dateAttendances.filter(a => a.present).length;
                                const absentCount = dateAttendances.filter(a => !a.present).length;
                                const totalCount = dateAttendances.length;
                                
                                const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                });

                                return (
                                    <div key={date} className="border rounded-lg p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <h3 className="font-semibold text-lg capitalize">{formattedDate}</h3>
                                                    {!isStudent && (
                                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                {presentCount} presente{presentCount !== 1 ? 's' : ''}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                                {absentCount} ausente{absentCount !== 1 ? 's' : ''}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                Total: {totalCount} aluno{totalCount !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="border-t pt-4 space-y-2">
                                            {dateAttendances.map((att) => {
                                                const student = students.find(s => s.id === att.studentId);
                                                // Se for estudante, mostrar apenas sua própria presença
                                                if (isStudent && att.studentId !== studentId) {
                                                    return null;
                                                }
                                                return (
                                                    <div 
                                                        key={att.id} 
                                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {att.present ? (
                                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                            ) : (
                                                                <XCircle className="h-5 w-5 text-red-600" />
                                                            )}
                                                            <div>
                                                                <p className="font-medium">{student?.fullName || `Aluno ${att.studentId}`}</p>
                                                                {student?.email && !isStudent && (
                                                                    <p className="text-sm text-muted-foreground">{student.email}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={`font-medium ${att.present ? 'text-green-600' : 'text-red-600'}`}>
                                                            {att.present ? 'Presente' : 'Ausente'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Register Attendance Modal - Only for teachers/admins */}
            {!isStudent && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Registrar Chamada</DialogTitle>
                        <DialogDescription>
                            Marque a presença dos alunos para esta data
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data da Chamada</label>
                                <Input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Observações (opcional)</label>
                                <Input
                                    placeholder="Ex: Aula normal"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold">Alunos ({students.length})</h3>
                            {students.length === 0 ? (
                                <div className="text-center py-8 border rounded-lg">
                                    <p className="text-muted-foreground">Nenhum aluno cadastrado nesta turma</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                                    {students.map((student) => (
                                        <div
                                            key={student.id}
                                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    {attendance[student.id] ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{student.fullName}</p>
                                                    {student.email && (
                                                        <p className="text-sm text-muted-foreground">{student.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <Checkbox
                                                        checked={attendance[student.id] || false}
                                                        onCheckedChange={(checked) =>
                                                            handleAttendanceChange(student.id, checked === true)
                                                        }
                                                    />
                                                    <span className="text-sm">Presente</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || students.length === 0}
                            className="gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Salvar Chamada
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            )}
        </div>
    );
}

