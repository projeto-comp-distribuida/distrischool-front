'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { studentService } from '@/services/student.service';
import { Student } from '@/types/student.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceRecord {
    id: number;
    date: string;
    scheduleId: number;
    subject: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    time: string;
}

export default function StudentAttendanceHistoryPage() {
    const params = useParams();
    const studentId = params.id as string;
    const [student, setStudent] = useState<Student | null>(null);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (studentId) {
            loadData();
        }
    }, [studentId]);

    const loadData = async () => {
        try {
            const studentData = await studentService.getById(parseInt(studentId));
            setStudent(studentData);

            // Mock attendance data
            const mockAttendance: AttendanceRecord[] = Array.from({ length: 30 }, (_, i) => ({
                id: i + 1,
                date: new Date(2025, 10, i + 1).toISOString().split('T')[0],
                scheduleId: Math.floor(Math.random() * 10) + 1,
                subject: ['Programação I', 'Estruturas de Dados', 'Banco de Dados', 'Redes'][Math.floor(Math.random() * 4)],
                status: ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE'][Math.floor(Math.random() * 5)] as any,
                time: ['08:00', '10:00', '14:00', '16:00'][Math.floor(Math.random() * 4)],
            }));
            setAttendance(mockAttendance);
        } catch (error) {
            toast.error('Erro ao carregar dados');
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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Histórico de Presença</h1>
                <p className="text-muted-foreground">
                    {student?.name || 'Carregando...'}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">Carregando...</div>
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
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
