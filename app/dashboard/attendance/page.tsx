'use client';

import { useState, useEffect } from 'react';
import { attendanceService } from '@/services/attendance.service';
import { scheduleService } from '@/services/schedule.service';
import { Schedule } from '@/types/schedule.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Mock students for demonstration since we don't have a full student list endpoint in context for a specific class yet
// In a real scenario, we would fetch students from the class associated with the schedule
const MOCK_STUDENTS = [
    { id: 1, name: 'João Silva' },
    { id: 2, name: 'Maria Santos' },
    { id: 3, name: 'Pedro Oliveira' },
];

export default function AttendancePage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
    const [attendance, setAttendance] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            const response = await scheduleService.getAll();
            setSchedules(response.content || []);
        } catch (error) {
            toast.error('Erro ao carregar horários');
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
                date: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
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
                                    {schedule.subject?.name} - {schedule.dayOfWeek} ({schedule.startTime})
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
                        <div className="space-y-4">
                            {MOCK_STUDENTS.map((student) => (
                                <div key={student.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                                    <Checkbox
                                        id={`student-${student.id}`}
                                        checked={attendance[student.id] || false}
                                        onCheckedChange={(checked) => handleAttendanceChange(student.id, checked as boolean)}
                                    />
                                    <label
                                        htmlFor={`student-${student.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {student.name}
                                    </label>
                                </div>
                            ))}

                            <Button onClick={handleSubmit} disabled={loading} className="w-full mt-4">
                                {loading ? 'Salvando...' : 'Salvar Presença'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
