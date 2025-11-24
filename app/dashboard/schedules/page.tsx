'use client';

import { useEffect, useState } from 'react';
import { scheduleService } from '@/services/schedule.service';
import { Schedule } from '@/types/schedule.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            const response = await scheduleService.getAll();
            // Handle both paginated and array responses if necessary, assuming paginated based on service
            setSchedules(response.content || []);
        } catch (error) {
            toast.error('Erro ao carregar horários');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Horário das Aulas</h1>
                <Button onClick={() => window.location.href = '/dashboard/schedules/create'}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Horário
                </Button>
            </div>

            {loading ? (
                <div>Carregando...</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {schedules.map((schedule) => (
                        <Card key={schedule.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {schedule.subject?.name || 'Disciplina sem nome'}
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{schedule.dayOfWeek}</div>
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {schedule.startTime} - {schedule.endTime}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    <MapPin className="mr-1 h-3 w-3" />
                                    {schedule.room}
                                </p>
                                <div className="mt-4 text-xs text-muted-foreground">
                                    Turma: {schedule.classEntity?.name}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
