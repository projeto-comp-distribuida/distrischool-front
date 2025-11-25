'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { classService } from '@/services/class.service';
import { ClassEntity } from '@/types/class.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Plus, Pencil, Trash2, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    code: z.string().min(2, 'Código deve ter no mínimo 2 caracteres'),
    academicYear: z.string().min(4, 'Ano letivo inválido'),
    period: z.string().min(1, 'Período é obrigatório'),
    capacity: z.coerce.number().min(1, 'Capacidade deve ser maior que 0'),
    shiftId: z.coerce.number().min(1, 'Turno é obrigatório'),
    room: z.string().min(1, 'Sala é obrigatória'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de término é obrigatória'),
});

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassEntity | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            code: '',
            academicYear: new Date().getFullYear().toString(),
            period: '1',
            capacity: 30,
            shiftId: 1,
            room: '',
            startDate: '',
            endDate: '',
        },
    });

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        try {
            const response = await classService.getAll();
            // Handle paginated response or array
            const data = (response as any).content || (Array.isArray(response) ? response : []);
            setClasses(data);
        } catch (error) {
            toast.error('Erro ao carregar turmas');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (classItem: ClassEntity) => {
        setEditingClass(classItem);
        form.reset({
            name: classItem.name,
            code: classItem.code,
            academicYear: classItem.academicYear,
            period: classItem.period,
            capacity: classItem.capacity,
            shiftId: classItem.shiftId || 1,
            room: classItem.room,
            startDate: classItem.startDate || '',
            endDate: classItem.endDate || '',
        });
        setEditDialogOpen(true);
    };

    const handleSubmitEdit = async (values: z.infer<typeof formSchema>) => {
        if (!editingClass) return;

        setSubmitting(true);
        try {
            await classService.update(editingClass.id, values);
            toast.success('Turma atualizada com sucesso!');
            setEditDialogOpen(false);
            setEditingClass(null);
            loadClasses();
        } catch (error) {
            toast.error('Erro ao atualizar turma');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta turma?')) return;

        try {
            await classService.delete(id);
            toast.success('Turma excluída com sucesso');
            loadClasses();
        } catch (error) {
            toast.error('Erro ao excluir turma');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
                    <p className="text-muted-foreground">
                        Gerencie as turmas, salas e períodos letivos.
                    </p>
                </div>
                <Button onClick={() => router.push('/dashboard/classes/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Turma
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Turmas</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">Carregando...</div>
                    ) : classes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma turma encontrada.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Ano Letivo</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead>Sala</TableHead>
                                    <TableHead>Capacidade</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map((classItem) => (
                                    <TableRow key={classItem.id}>
                                        <TableCell className="font-medium">{classItem.name}</TableCell>
                                        <TableCell>{classItem.code}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-3 w-3 text-muted-foreground" />
                                                {classItem.academicYear}
                                            </div>
                                        </TableCell>
                                        <TableCell>{classItem.period}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <MapPin className="mr-2 h-3 w-3 text-muted-foreground" />
                                                {classItem.room}
                                            </div>
                                        </TableCell>
                                        <TableCell>{classItem.capacity}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(classItem)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleDelete(classItem.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Turma</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmitEdit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Turma</FormLabel>
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
                                    name="academicYear"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ano Letivo</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="capacity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Capacidade</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data Início</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data Término</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
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
