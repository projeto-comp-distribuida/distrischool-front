'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { studentService } from '@/services/student.service';
import { attendanceService } from '@/services/attendance.service';
import { scheduleService } from '@/services/schedule.service';
import { Student } from '@/types/student.types';
import { Attendance } from '@/types/attendance.types';
import { Schedule } from '@/types/schedule.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2, XCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/protected-route';
import { toast } from 'sonner';

interface AttendanceRecord {
    id: number;
    date: string;
    scheduleId: number;
    subject: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    time: string;
}

function StudentAttendanceHistoryContent() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const isStudent = user?.roles?.includes('STUDENT');
    const isAdmin = user?.roles?.includes('ADMIN');
    
    // Use studentId from user object instead of URL param
    const actualStudentId = user?.studentId ? Number(user.studentId) : null;
    const urlStudentId = params.id ? Number(params.id) : null;

    useEffect(() => {
        // If student, always use their studentId from user object and redirect if URL is different
        if (isStudent && actualStudentId) {
            // If URL has different ID, redirect to correct URL
            if (urlStudentId && urlStudentId !== actualStudentId) {
                router.replace(`/dashboard/students/${actualStudentId}/attendance`);
                return;
            }
            loadData(actualStudentId);
        } else if (isAdmin && urlStudentId) {
            // Admin can view any student by URL param
            loadData(urlStudentId);
        } else if (!isStudent && !isAdmin) {
            toast.error('Acesso negado');
            router.push('/dashboard');
        }
    }, [user, isStudent, isAdmin, actualStudentId, urlStudentId, router]);

    const loadData = async (studentIdToLoad: number) => {
        try {
            setLoading(true);
            
            // Load student data
            const studentData = await studentService.getById(studentIdToLoad);
            setStudent(studentData);

            // Load attendance records
            const attendanceRecords = await attendanceService.getByStudent(studentIdToLoad);
            
            // Get unique schedule IDs
            const scheduleIds = [...new Set(attendanceRecords.map(att => att.scheduleId))];
            
            // Load schedule details
            const schedulesMap = new Map<number, Schedule>();
            await Promise.all(
                scheduleIds.map(async (scheduleId) => {
                    try {
                        const schedule = await scheduleService.getById(scheduleId);
                        schedulesMap.set(scheduleId, schedule);
                    } catch (error) {
                        console.error(`Error loading schedule ${scheduleId}:`, error);
                    }
                })
            );

            // Map attendance records to display format
            const mappedAttendance: AttendanceRecord[] = attendanceRecords.map((att) => {
                const schedule = schedulesMap.get(att.scheduleId);
                const subjectName = schedule?.subjectName || `Disciplina ${att.scheduleId}`;
                const startTime = schedule?.startTime || '00:00';
                
                // Determine status based on present field
                // Note: The API returns boolean 'present', we'll map it to status
                // LATE status would need additional logic if available in the API
                const status: 'PRESENT' | 'ABSENT' | 'LATE' = att.present ? 'PRESENT' : 'ABSENT';
                
                return {
                    id: att.id,
                    date: att.date,
                    scheduleId: att.scheduleId,
                    subject: subjectName,
                    status,
                    time: startTime,
                };
            });

            // Sort by date descending (most recent first)
            mappedAttendance.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Filter to last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentAttendance = mappedAttendance.filter(att => 
                new Date(att.date) >= thirtyDaysAgo
            );

            setAttendance(recentAttendance);
        } catch (error) {
            console.error('Error loading attendance data:', error);
            toast.error('Erro ao carregar dados de presença');
            setAttendance([]);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'PRESENT').length,
        absent: attendance.filter(a => a.status === 'ABSENT').length,
        late: attendance.filter(a => a.status === 'LATE').length,
    };

    const attendanceRate = ((stats.present / stats.total) * 100).toFixed(1);

    return (
        <div className="space-y-6 p-6">
            <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mb-4"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
            </Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Histórico de Presença</h1>
                <p className="text-muted-foreground">
                    {student?.name || 'Carregando...'}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Presenças</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                                <p className="text-xs text-muted-foreground">{attendanceRate}%</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Faltas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Atrasos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{stats.late}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Registro de Presenças</CardTitle>
                            <CardDescription>Últimos 30 dias</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {attendance.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Nenhum registro de presença encontrado
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {attendance.map((record) => (
                                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {record.status === 'PRESENT' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                            {record.status === 'ABSENT' && <XCircle className="h-5 w-5 text-red-600" />}
                                            {record.status === 'LATE' && <Clock className="h-5 w-5 text-amber-600" />}
                                            <div>
                                                <p className="font-medium">{record.subject}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(record.date).toLocaleDateString('pt-BR')} às {record.time}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                                record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                                    'bg-amber-100 text-amber-800'
                                            }`}>
                                            {record.status === 'PRESENT' ? 'Presente' :
                                                record.status === 'ABSENT' ? 'Ausente' : 'Atrasado'}
                                        </span>
                                    </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

export default function StudentAttendanceHistoryPage() {
    return (
        <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <StudentAttendanceHistoryContent />
        </ProtectedRoute>
    );
}
