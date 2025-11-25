'use client';

import { useEffect, useState } from 'react';
import { studentService } from '@/services/student.service';
import { Student, StudentStatus } from '@/types/student.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { RefreshCw, UserCheck, UserX, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentManagementPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [deletedStudents, setDeletedStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [newStatus, setNewStatus] = useState<StudentStatus>('ACTIVE');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const response = await studentService.getAll();
            const data = Array.isArray(response) ? response : (response as any).content || [];
            setStudents(data.filter((s: Student) => s.status !== 'DELETED'));
            // Mock deleted students
            setDeletedStudents(data.slice(0, 3).map((s: Student) => ({ ...s, status: 'DELETED' as StudentStatus })));
        } catch (error) {
            toast.error('Erro ao carregar estudantes');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreStudent = async (studentId: number) => {
        if (!confirm('Tem certeza que deseja restaurar este estudante?')) return;

        try {
            await studentService.restore(studentId);
            toast.success('Estudante restaurado com sucesso!');
            loadStudents();
        } catch (error) {
            toast.error('Erro ao restaurar estudante');
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedStudent) return;

        try {
            await studentService.updateStatus(selectedStudent.id, newStatus);
            toast.success('Status atualizado com sucesso!');
            setStatusDialogOpen(false);
            setSelectedStudent(null);
            loadStudents();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const openStatusDialog = (student: Student) => {
        setSelectedStudent(student);
        setNewStatus(student.status);
        setStatusDialogOpen(true);
    };

    const statusOptions: { value: StudentStatus; label: string; icon: any }[] = [
        { value: 'ACTIVE', label: 'Ativo', icon: UserCheck },
        { value: 'INACTIVE', label: 'Inativo', icon: UserX },
        { value: 'GRADUATED', label: 'Graduado', icon: GraduationCap },
        { value: 'SUSPENDED', label: 'Suspenso', icon: UserX },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Estudantes</h1>
                <p className="text-muted-foreground">
                    Gerencie status e restaure estudantes deletados
                </p>
            </div>

            {/* Estudantes Deletados */}
            {deletedStudents.length > 0 && (
                <Card className="border-amber-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-600">
                            <RefreshCw className="h-5 w-5" />
                            Estudantes Deletados ({deletedStudents.length})
                        </CardTitle>
                        <CardDescription>
                            Estudantes que podem ser restaurados
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Matrícula</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deletedStudents.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-mono">{student.registrationNumber}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRestoreStudent(student.id)}
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Restaurar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Estudantes Ativos */}
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Status dos Estudantes</CardTitle>
                    <CardDescription>
                        Altere o status dos estudantes conforme necessário
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">Carregando...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Matrícula</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Status Atual</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.slice(0, 10).map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-mono">{student.registrationNumber}</TableCell>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${student.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                    student.status === 'GRADUATED' ? 'bg-blue-100 text-blue-800' :
                                                        student.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openStatusDialog(student)}
                                            >
                                                Alterar Status
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Dialog de Alteração de Status */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alterar Status do Estudante</DialogTitle>
                        <DialogDescription>
                            {selectedStudent?.name} - {selectedStudent?.registrationNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Novo Status</label>
                            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as StudentStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <option.icon className="h-4 w-4" />
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateStatus}>
                            Atualizar Status
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
