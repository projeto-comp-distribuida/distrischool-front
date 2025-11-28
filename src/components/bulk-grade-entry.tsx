'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { GradeValueInput } from '@/components/grade-value-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Student } from '@/types/student.types';
import { Evaluation } from '@/types/evaluation.types';
import { GradeRequestDTO, GradeStatus } from '@/types/grade.types';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BulkGradeEntryProps {
    students: Student[];
    evaluation: Evaluation;
    classId: number;
    teacherId: number;
    academicYear: number;
    academicSemester: number;
    onSubmit: (grades: GradeRequestDTO[]) => Promise<void>;
    onCancel?: () => void;
    existingGrades?: Map<number, number>; // studentId -> gradeValue
}

interface StudentGradeInput {
    studentId: number;
    studentName: string;
    registrationNumber: string;
    gradeValue: number | undefined;
    gradeDate: string;
    notes: string;
    hasError: boolean;
}

export function BulkGradeEntry({
    students,
    evaluation,
    classId,
    teacherId,
    academicYear,
    academicSemester,
    onSubmit,
    onCancel,
    existingGrades = new Map(),
}: BulkGradeEntryProps) {
    const today = new Date().toISOString().split('T')[0];
    const [studentGrades, setStudentGrades] = useState<StudentGradeInput[]>([]);
    const [commonDate, setCommonDate] = useState<string>(today);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const initialGrades: StudentGradeInput[] = students.map((student) => ({
            studentId: student.id,
            studentName: student.fullName,
            registrationNumber: student.registrationNumber,
            gradeValue: existingGrades.get(student.id),
            gradeDate: today,
            notes: '',
            hasError: false,
        }));
        setStudentGrades(initialGrades);
    }, [students, existingGrades, today]);

    const handleGradeChange = (studentId: number, gradeValue: number | undefined) => {
        setStudentGrades((prev) =>
            prev.map((sg) =>
                sg.studentId === studentId
                    ? { ...sg, gradeValue, hasError: false }
                    : sg
            )
        );
    };

    const handleDateChange = (studentId: number, date: string) => {
        setStudentGrades((prev) =>
            prev.map((sg) => (sg.studentId === studentId ? { ...sg, gradeDate: date } : sg))
        );
    };

    const handleNotesChange = (studentId: number, notes: string) => {
        setStudentGrades((prev) =>
            prev.map((sg) => (sg.studentId === studentId ? { ...sg, notes } : sg))
        );
    };

    const applyCommonDate = () => {
        setStudentGrades((prev) =>
            prev.map((sg) => ({ ...sg, gradeDate: commonDate }))
        );
    };

    const validateGrades = (): boolean => {
        let hasErrors = false;
        const updated = studentGrades.map((sg) => {
            if (sg.gradeValue === undefined || sg.gradeValue === null) {
                return { ...sg, hasError: true };
            }
            return sg;
        });

        setStudentGrades(updated);
        hasErrors = updated.some((sg) => sg.hasError);

        if (hasErrors) {
            toast.error('Por favor, preencha todas as notas antes de salvar');
        }

        return !hasErrors;
    };

    const handleSubmit = async () => {
        if (!validateGrades()) {
            return;
        }

        const gradesToSubmit: GradeRequestDTO[] = studentGrades
            .filter((sg) => sg.gradeValue !== undefined && sg.gradeValue !== null)
            .map((sg) => ({
                studentId: sg.studentId,
                teacherId,
                classId,
                evaluationId: evaluation.id,
                gradeValue: sg.gradeValue!,
                gradeDate: sg.gradeDate,
                notes: sg.notes || undefined,
                status: GradeStatus.REGISTERED,
                isAutomatic: false,
                academicYear,
                academicSemester,
            }));

        if (gradesToSubmit.length === 0) {
            toast.error('Nenhuma nota para salvar');
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(gradesToSubmit);
            toast.success(`${gradesToSubmit.length} nota(s) salva(s) com sucesso!`);
        } catch (error) {
            console.error('Error submitting grades:', error);
            toast.error('Erro ao salvar notas');
        } finally {
            setSubmitting(false);
        }
    };

    const filledCount = studentGrades.filter(
        (sg) => sg.gradeValue !== undefined && sg.gradeValue !== null
    ).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Entrada em Lote de Notas</CardTitle>
                <CardDescription>
                    {evaluation.name} - {evaluation.type} | {filledCount} de {students.length} notas preenchidas
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Common Date Selector */}
                <div className="flex items-end gap-2 p-4 bg-muted/50 rounded-md">
                    <div className="flex-1">
                        <Label>Data comum para todas as notas</Label>
                        <Input
                            type="date"
                            value={commonDate}
                            onChange={(e) => setCommonDate(e.target.value)}
                        />
                    </div>
                    <Button type="button" variant="outline" onClick={applyCommonDate}>
                        Aplicar a Todos
                    </Button>
                </div>

                {/* Grades Table */}
                <div className="border rounded-md">
                    <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Aluno</TableHead>
                                    <TableHead>Matrícula</TableHead>
                                    <TableHead className="w-[150px]">Nota</TableHead>
                                    <TableHead className="w-[150px]">Data</TableHead>
                                    <TableHead className="w-[200px]">Observações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentGrades.map((studentGrade, index) => (
                                    <TableRow
                                        key={studentGrade.studentId}
                                        className={studentGrade.hasError ? 'bg-destructive/10' : ''}
                                    >
                                        <TableCell className="text-muted-foreground">
                                            {index + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {studentGrade.studentName}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {studentGrade.registrationNumber}
                                        </TableCell>
                                        <TableCell>
                                            <GradeValueInput
                                                value={studentGrade.gradeValue}
                                                onChange={(value) =>
                                                    handleGradeChange(studentGrade.studentId, value)
                                                }
                                                className="w-full"
                                                max={evaluation.maxGrade}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="date"
                                                value={studentGrade.gradeDate}
                                                onChange={(e) =>
                                                    handleDateChange(
                                                        studentGrade.studentId,
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                placeholder="Observações..."
                                                value={studentGrade.notes}
                                                onChange={(e) =>
                                                    handleNotesChange(
                                                        studentGrade.studentId,
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Summary and Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        {filledCount === students.length ? (
                            <span className="text-green-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                Todas as notas preenchidas
                            </span>
                        ) : (
                            <span>
                                {filledCount} de {students.length} notas preenchidas
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                                Cancelar
                            </Button>
                        )}
                        <Button onClick={handleSubmit} disabled={submitting || filledCount === 0}>
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Salvar {filledCount > 0 && `(${filledCount})`}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


