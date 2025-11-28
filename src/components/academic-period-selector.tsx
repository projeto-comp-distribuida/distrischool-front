'use client';

import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface AcademicPeriodSelectorProps {
    academicYear: number;
    academicSemester: number;
    onYearChange: (year: number) => void;
    onSemesterChange: (semester: number) => void;
    className?: string;
    showLabels?: boolean;
}

export function AcademicPeriodSelector({
    academicYear,
    academicSemester,
    onYearChange,
    onSemesterChange,
    className,
    showLabels = true,
}: AcademicPeriodSelectorProps) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i + 5);

    return (
        <div className={className || 'grid grid-cols-2 gap-4'}>
            {showLabels && <Label>Ano Letivo</Label>}
            <div className={showLabels ? '' : 'col-span-1'}>
                {showLabels && <Label className="mb-2 block">Ano Letivo</Label>}
                <Input
                    type="number"
                    min="2000"
                    value={academicYear}
                    onChange={(e) => onYearChange(Number(e.target.value))}
                    placeholder={String(currentYear)}
                />
            </div>
            {showLabels && <Label>Semestre</Label>}
            <div className={showLabels ? '' : 'col-span-1'}>
                {showLabels && <Label className="mb-2 block">Semestre</Label>}
                <Select
                    value={String(academicSemester)}
                    onValueChange={(value) => onSemesterChange(Number(value))}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1º Semestre</SelectItem>
                        <SelectItem value="2">2º Semestre</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}


