import { Suspense } from 'react';
import PerformanceReportsClient from './performance-reports-client';

export default function PerformanceReportsPage() {
    return (
        <Suspense
            fallback={
                <div className="space-y-6">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Carregando relatório...</p>
                        </div>
                    </div>
                </div>
            }
        >
            <PerformanceReportsClient />
        </Suspense>
    );
}
