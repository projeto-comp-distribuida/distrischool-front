'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { GradeResponseDTO } from '@/types/grade.types';
import { ArrowRight, GraduationCap, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StudentGradeCardProps {
    classEntity: ClassEntity;
    subject: Subject;
    grades: GradeResponseDTO[];
    average: number;
}

export function StudentGradeCard({ classEntity, subject, grades, average }: StudentGradeCardProps) {
    const router = useRouter();
    
    const handleViewDetails = () => {
        router.push(`/dashboard/grades/my-grades/${classEntity.id}`);
    };

    const getStatusColor = (avg: number) => {
        if (avg >= 7.0) return 'text-green-600';
        if (avg >= 5.0) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getStatusLabel = (avg: number) => {
        if (avg >= 7.0) return 'Aprovado';
        if (avg >= 5.0) return 'Em Recuperação';
        return 'Reprovado';
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{classEntity.name}</CardTitle>
                        <CardDescription className="mt-1">
                            {subject.name} • {classEntity.code}
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${getStatusColor(average)}`}>
                            {average.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {getStatusLabel(average)}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Notas registradas
                        </span>
                        <span className="font-medium">{grades.length}</span>
                    </div>
                    
                    {grades.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {grades.slice(0, 5).map((grade) => (
                                <span
                                    key={grade.id}
                                    className="rounded-md bg-muted px-2 py-1 text-xs font-mono"
                                    title={`${new Date(grade.gradeDate).toLocaleDateString('pt-BR')}: ${grade.gradeValue.toFixed(2)}`}
                                >
                                    {grade.gradeValue.toFixed(2)}
                                </span>
                            ))}
                            {grades.length > 5 && (
                                <span className="rounded-md bg-muted px-2 py-1 text-xs">
                                    +{grades.length - 5}
                                </span>
                            )}
                        </div>
                    )}
                    
                    <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handleViewDetails}
                    >
                        Ver Detalhes
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}



