'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus, Pencil, Trash2, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassesPage() {
    const router = useRouter();
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [loading, setLoading] = useState(true);

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
                                                    onClick={() => toast.info('Edição em breve')}
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
        </div>
    );
}
