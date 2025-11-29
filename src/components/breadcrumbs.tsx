'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
    const router = useRouter();

    return (
        <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)} aria-label="Breadcrumb">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
                <Home className="h-4 w-4" />
            </Button>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <div key={index} className="flex items-center space-x-1">
                        <ChevronRight className="h-4 w-4" />
                        {item.href && !isLast ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(item.href!)}
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            >
                                {item.label}
                            </Button>
                        ) : (
                            <span className={cn('px-2', isLast && 'font-medium text-foreground')}>
                                {item.label}
                            </span>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}



