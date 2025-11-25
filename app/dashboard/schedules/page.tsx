'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { scheduleService } from '@/services/schedule.service';
import { Schedule } from '@/types/schedule.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, MapPin, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
    dayOfWeek: z.string().min(1, 'Dia da semana é obrigatório'),
    startTime: z.string().min(1, 'Horário de início é obrigatório'),
    endTime: z.string().min(1, 'Horário de término é obrigatório'),
    room: z.string().min(1, 'Sala é obrigatória'),
    subjectId: z.coerce.number().min(1, 'Disciplina é obrigatória'),
    classEntityId: z.coerce.number().min(1, 'Turma é obrigatória'),
});

const daysOfWeek = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
];

const dayLabels: Record<string, string> = {
    MONDAY: 'Segunda-feira',
    TUESDAY: 'Terça-feira',
    WEDNESDAY: 'Quarta-feira',
    THURSDAY: 'Quinta-feira',
    FRIDAY: 'Sexta-feira',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
};

export default function SchedulesPage() {
    const router = useRouter();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dayOfWeek: '',
            startTime: '',
            endTime: '',
            room: '',
            subjectId: 0,
            classEntityId: 0,
        },
    });

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        try {
            const response = await scheduleService.getAll();
            const data = (response as any).content || (Array.isArray(response) ? response : []);
            setSchedules(data);
        } catch (error) {
            toast.error('Erro ao carregar horários');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (schedule: Schedule) => {
        setEditingSchedule(schedule);
        form.reset({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room,
            subjectId: schedule.subject?.id || 0,
            classEntityId: schedule.classEntity?.id || 0,
        });
        setEditDialogOpen(true);
    };

    const handleSubmitEdit = async (values: z.infer<typeof formSchema>) => {
        if (!editingSchedule) return;

        setSubmitting(true);
        try {
            await scheduleService.update(editingSchedule.id, values);
            toast.success('Horário atualizado com sucesso!');
            setEditDialogOpen(false);
            setEditingSchedule(null);
            loadSchedules();
        } catch (error) {
            toast.error('Erro ao atualizar horário');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este horário?')) return;

        try {
            await scheduleService.delete(id);
            toast.success('Horário excluído com sucesso');
            loadSchedules();
        } catch (error) {
            toast.error('Erro ao excluir horário');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Horário das Aulas</h1>
                <Button onClick={() => router.push('/dashboard/schedules/create')}>
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
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleEdit(schedule)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => handleDelete(schedule.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dayLabels[schedule.dayOfWeek] || schedule.dayOfWeek}
                                </div>
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

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Horário</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmitEdit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="dayOfWeek"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dia da Semana</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o dia" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {daysOfWeek.map((day) => (
                                                    <SelectItem key={day} value={day}>
                                                        {dayLabels[day]}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horário Início</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horário Término</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="room"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sala</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
