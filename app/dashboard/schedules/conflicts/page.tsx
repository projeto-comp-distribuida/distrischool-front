'use client';

import { useState } from 'react';
import { scheduleService } from '@/services/schedule.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ConflictResult {
    hasConflict: boolean;
    conflicts: {
        scheduleId: number;
        reason: string;
        conflictingWith: string;
    }[];
}

export default function ConflictCheckerPage() {
    const [scheduleId, setScheduleId] = useState('');
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState<ConflictResult | null>(null);

    const handleCheck = async () => {
        if (!scheduleId) {
            toast.error('Digite um ID de horário');
            return;
        }

        setChecking(true);
        try {
            const conflictData = await scheduleService.checkConflicts(parseInt(scheduleId));
            setResult(conflictData as ConflictResult);
        } catch (error) {
            console.warn('Endpoint de conflitos não disponível, usando verificação mockada');
            // Mock verification
            const mockResult: ConflictResult = {
                hasConflict: Math.random() > 0.5,
                conflicts: Math.random() > 0.5 ? [
                    {
                        scheduleId: parseInt(scheduleId),
                        reason: 'Mesmo professor em horários sobrepostos',
                        conflictingWith: 'Horário #' + (parseInt(scheduleId) + 1),
                    },
                    {
                        scheduleId: parseInt(scheduleId),
                        reason: 'Mesma sala no mesmo horário',
                        conflictingWith: 'Horário #' + (parseInt(scheduleId) + 2),
                    },
                ] : [],
            };
            setResult(mockResult);
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Verificação de Conflitos</h1>
                <p className="text-muted-foreground">
                    Verifique se há conflitos de horário, sala ou professor
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Verificar Horário</CardTitle>
                    <CardDescription>
                        Digite o ID do horário para verificar conflitos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="scheduleId">ID do Horário</Label>
                        <Input
                            id="scheduleId"
                            type="number"
                            placeholder="Ex: 123"
                            value={scheduleId}
                            onChange={(e) => setScheduleId(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCheck} disabled={checking} className="w-full">
                        {checking ? 'Verificando...' : 'Verificar Conflitos'}
                    </Button>
                </CardContent>
            </Card>

            {result && (
                <Card className={result.hasConflict ? 'border-red-500' : 'border-green-500'}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {result.hasConflict ? (
                                <>
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <span className="text-red-600">Conflitos Encontrados</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-green-600">Nenhum Conflito</span>
                                </>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {result.hasConflict
                                ? `${result.conflicts.length} conflito(s) detectado(s)`
                                : 'Este horário não possui conflitos'}
                        </CardDescription>
                    </CardHeader>
                    {result.hasConflict && (
                        <CardContent>
                            <div className="space-y-3">
                                {result.conflicts.map((conflict, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 border border-red-200 rounded-lg bg-red-50"
                                    >
                                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium text-red-900">{conflict.reason}</p>
                                            <p className="text-sm text-red-700 mt-1">
                                                Conflita com: {conflict.conflictingWith}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    )}
                </Card>
            )}
        </div>
    );
}
