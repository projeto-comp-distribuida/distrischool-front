'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ClassGradeSummaryDTO } from '@/types/grade.types';
import { GradeStatusBadge } from '@/components/grade-status-badge';
import { GraduationCap, Users, TrendingUp } from 'lucide-react';

interface ClassGradeSummaryProps {
    data: ClassGradeSummaryDTO;
}

export function ClassGradeSummary({ data }: ClassGradeSummaryProps) {
    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Média da Turma</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.classAverage.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Média geral dos alunos
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalStudents}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Alunos matriculados
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Com Notas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.studentsWithGrades}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Alunos avaliados
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Turma</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold">{data.className}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.classCode} - {data.period}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Students Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Notas dos Alunos</CardTitle>
                    <CardDescription>
                        {data.students.length} aluno(s) com notas registradas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Aluno</TableHead>
                                <TableHead>Média</TableHead>
                                <TableHead>Notas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.students.map((student) => (
                                <TableRow key={student.studentId}>
                                    <TableCell className="font-medium">
                                        Aluno {student.studentId}
                                    </TableCell>
                                    <TableCell>
                                        <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-semibold">
                                            {student.average.toFixed(2)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {student.grades.map((grade) => (
                                                <span
                                                    key={grade.gradeId}
                                                    className="rounded-md bg-muted px-2 py-1 text-xs font-mono"
                                                    title={`Data: ${new Date(grade.gradeDate).toLocaleDateString('pt-BR')}`}
                                                >
                                                    {grade.gradeValue.toFixed(2)}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


