'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { classService } from '@/services/class.service';
import { subjectService } from '@/services/subject.service';
import { Subject } from '@/types/subject.types';
import { ClassEntity, ClassFormValues } from '@/types/class.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ClassForm } from '@/components/class-form';

export default function EditClassPage() {
    const router = useRouter();
    const params = useParams();
    const subjectId = Number(params.id);
    const classId = Number(params.classId);
    
    const [loading, setLoading] = useState(false);
    const [loadingClass, setLoadingClass] = useState(true);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [classData, setClassData] = useState<ClassEntity | null>(null);

    useEffect(() => {
        if (subjectId && classId) {
            loadData();
        }
    }, [subjectId, classId]);

    const loadData = async () => {
        try {
            setLoadingClass(true);
            const [subjectData, classEntity] = await Promise.all([
                subjectService.getById(subjectId),
                classService.getById(classId),
            ]);
            setSubject(subjectData);
            setClassData(classEntity);
        } catch (error) {
            toast.error('Erro ao carregar dados');
            console.error(error);
            router.push(`/dashboard/subjects/${subjectId}/classes`);
        } finally {
            setLoadingClass(false);
        }
    };

    async function onSubmit(values: ClassFormValues) {
        setLoading(true);
        try {
            await classService.update(classId, {
                ...values,
                subjectId: subjectId,
                studentIds: values.studentIds && values.studentIds.length > 0 ? values.studentIds : [],
                teacherIds: values.teacherIds && values.teacherIds.length > 0 ? values.teacherIds : [],
            });
            toast.success('Turma atualizada com sucesso!');
            router.push(`/dashboard/subjects/${subjectId}/classes`);
        } catch (error) {
            toast.error('Erro ao atualizar turma');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loadingClass) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground text-lg">Carregando...</p>
            </div>
        );
    }

    if (!subject || !classData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-muted-foreground text-lg">Turma não encontrada</p>
                <Button onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes`)} className="mt-4">
                    Voltar para Turmas
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Breadcrumbs
                items={[
                    { label: 'Cursos', href: '/dashboard/courses' },
                    { label: subject.name, href: `/dashboard/subjects/${subjectId}/classes` },
                    { label: 'Editar Turma' },
                ]}
            />

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Editar Turma</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                        Curso: <span className="font-medium">{subject.name}</span>
                    </p>
                </CardHeader>
                <CardContent>
                    <ClassForm
                        initialData={classData}
                        onSubmit={onSubmit}
                        isLoading={loading}
                        submitLabel="Salvar Alterações"
                    />
                    <div className="mt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => router.push(`/dashboard/subjects/${subjectId}/classes`)}
                            className="w-full"
                        >
                            Cancelar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

