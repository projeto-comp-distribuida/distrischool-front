'use client';

import { GradeStatus } from '@/types/grade.types';
import { cn } from '@/lib/utils';

interface GradeStatusBadgeProps {
    status: GradeStatus;
    className?: string;
}

const statusConfig: Record<GradeStatus, { label: string; className: string }> = {
    [GradeStatus.REGISTERED]: {
        label: 'Registrada',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    [GradeStatus.PENDING]: {
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    [GradeStatus.CONFIRMED]: {
        label: 'Confirmada',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    [GradeStatus.DISPUTED]: {
        label: 'Em Disputa',
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
    [GradeStatus.CANCELLED]: {
        label: 'Cancelada',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
};

export function GradeStatusBadge({ status, className }: GradeStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig[GradeStatus.REGISTERED];
    
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
}


