'use client';

import { useState, useEffect } from 'react';
import { attendanceService } from '@/services/attendance.service';
import { scheduleService } from '@/services/schedule.service';
import { classService } from '@/services/class.service';
import { Schedule } from '@/types/schedule.types';
import { Student } from '@/types/student.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AttendancePage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        loadSchedules();
    }, []);

    useEffect(() => {
        if (selectedScheduleId) {
            loadStudentsForSchedule(selectedScheduleId);
        } else {
            setStudents([]);
            setAttendance({});
        }
    }, [selectedScheduleId]);

    const loadSchedules = async () => {
        try {
            const response = await scheduleService.getAll();
            const data = (response as any).content || (Array.isArray(response) ? response : []);
            setSchedules(data);
        } catch (error) {
            toast.error('Erro ao carregar horários');
        }
    };

    const loadStudentsForSchedule = async (scheduleId: string) => {
        setLoadingStudents(true);
        try {
            const schedule = schedules.find(s => s.id.toString() === scheduleId);
            if (!schedule || !schedule.classEntity) {
                toast.error('Horário ou turma não encontrados');
                return;
            }

            // Ideally we should have an endpoint to get students by class ID directly
            // For now, assuming we might need to fetch the class details which includes students
            // Or use a specific endpoint if available.
            // Based on classService, we have addStudents but not getStudents explicitly documented in the view,
            // but let's try to get the class details which might contain studentIds, then fetch students?
            // OR better, let's assume there's an endpoint or we use the studentService to filter by something if possible.
            // Looking at studentService, we have getByCourse.
            // Let's try to fetch the class details first.

            const classDetails = await classService.getById(schedule.classEntity.id);

            if (classDetails.studentIds && classDetails.studentIds.length > 0) {
                // Fetch student details for each student ID in the class
                const studentPromises = classDetails.studentIds.map(id => 
                    studentService.getById(id).catch(error => {
                        console.error(`Failed to fetch student ${id}:`, error);
                        return null;
                    })
                );
                
                const studentResults = await Promise.all(studentPromises);
                const validStudents = studentResults.filter((s): s is Student => s !== null);
                
                setStudents(validStudents);

                // Initialize attendance
                const initialAttendance: Record<number, boolean> = {};
                validStudents.forEach((s: Student) => {
                    initialAttendance[s.id] = false;
                });
                setAttendance(initialAttendance);
            } else {
                // No students in class
                setStudents([]);
                setAttendance({});
            }

        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar alunos da turma');
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleAttendanceChange = (studentId: number, present: boolean) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: present
        }));
    };

    const handleSubmit = async () => {
        if (!selectedScheduleId) {
            toast.error('Selecione um horário');
            return;
        }

        setLoading(true);
        try {
            await attendanceService.markAttendance({
                scheduleId: parseInt(selectedScheduleId),
                date: new Date().toISOString().split('T')[0],
                studentPresence: attendance,
                notes: 'Presença registrada via sistema web'
            });
            toast.success('Presença registrada com sucesso!');
        } catch (error) {
            toast.error('Erro ao registrar presença');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Registro de Presença</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Selecione a Aula</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um horário..." />
                        </SelectTrigger>
                        <SelectContent>
                            {schedules.map((schedule) => (
                                <SelectItem key={schedule.id} value={schedule.id.toString()}>
                                    {schedule.subject?.name} - {schedule.dayOfWeek} ({schedule.startTime}) - {schedule.classEntity?.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedScheduleId && (
                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Chamada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingStudents ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum aluno encontrado para esta turma.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {students.map((student) => (
                                    <div key={student.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <Checkbox
                                            id={`student-${student.id}`}
                                            checked={attendance[student.id] || false}
                                            onCheckedChange={(checked) => handleAttendanceChange(student.id, checked as boolean)}
                                        />
                                        <label
                                            htmlFor={`student-${student.id}`}
                                            className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {student.fullName}
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({student.registrationNumber})
                                            </span>
                                        </label>
                                    </div>
                                ))}

                                <Button onClick={handleSubmit} disabled={loading} className="w-full mt-4">
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Salvar Presença'
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
