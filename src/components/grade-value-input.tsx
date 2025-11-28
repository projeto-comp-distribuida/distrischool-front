'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface GradeValueInputProps {
    value: number | undefined;
    onChange: (value: number | undefined) => void;
    label?: string;
    className?: string;
    disabled?: boolean;
    max?: number;
    min?: number;
    error?: string;
}

export function GradeValueInput({
    value,
    onChange,
    label,
    className,
    disabled = false,
    max = 10,
    min = 0,
    error,
}: GradeValueInputProps) {
    const [inputValue, setInputValue] = useState<string>(() => {
        // Initialize with formatted value if available
        if (value !== undefined && value !== null) {
            return value.toFixed(2).replace('.', ',');
        }
        return '';
    });
    const isTypingRef = useRef(false);
    const lastValueRef = useRef<number | undefined>(value);

    useEffect(() => {
        // Only update from prop if:
        // 1. User is not currently typing
        // 2. The value changed from outside (not from our own onChange)
        const valueChangedExternally = lastValueRef.current !== value;
        
        if (!isTypingRef.current && valueChangedExternally) {
            if (value !== undefined && value !== null) {
                const formatted = value.toFixed(2).replace('.', ',');
                // Only update if different to avoid unnecessary re-renders
                if (formatted !== inputValue) {
                    setInputValue(formatted);
                }
            } else {
                if (inputValue !== '') {
                    setInputValue('');
                }
            }
            lastValueRef.current = value;
        }
    }, [value, inputValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        
        // Allow empty input
        if (rawValue === '') {
            setInputValue('');
            onChange(undefined);
            isTypingRef.current = false;
            return;
        }

        // Only allow numbers and one decimal separator (comma or dot)
        // Allow: empty, digits, digits with comma/dot, digits with comma/dot and more digits
        // This regex allows: "", "1", "10", "10,", "10,5", "10,50", "10.", "10.5"
        if (!/^\d*[,.]?\d*$/.test(rawValue)) {
            return;
        }

        // Update input value immediately for better UX
        setInputValue(rawValue);
        isTypingRef.current = true;
        
        // Replace comma with dot for parsing
        const normalizedValue = rawValue.replace(',', '.');
        const numValue = parseFloat(normalizedValue);
        
        // Only update onChange if we have a valid number
        // Don't validate range while typing - let user finish typing
        if (!isNaN(numValue)) {
            // Round to 2 decimal places but don't clamp to range yet
            const rounded = Math.round(numValue * 100) / 100;
            lastValueRef.current = rounded;
            onChange(rounded);
        } else {
            // Invalid number, but allow typing (might be incomplete like "10,")
            lastValueRef.current = undefined;
            onChange(undefined);
        }
    };

    const handleBlur = () => {
        isTypingRef.current = false;
        
        // Format and validate on blur
        if (inputValue === '') {
            lastValueRef.current = undefined;
            onChange(undefined);
            return;
        }

        const normalizedValue = inputValue.replace(',', '.');
        const numValue = parseFloat(normalizedValue);
        
        if (!isNaN(numValue)) {
            // Clamp to valid range
            let finalValue = numValue;
            if (numValue > max) {
                finalValue = max;
            } else if (numValue < min) {
                finalValue = min;
            }
            
            // Round to 2 decimal places
            const rounded = Math.round(finalValue * 100) / 100;
            lastValueRef.current = rounded;
            onChange(rounded);
            
            // Format display value
            setInputValue(rounded.toFixed(2).replace('.', ','));
        } else {
            // Invalid input, clear it
            setInputValue('');
            lastValueRef.current = undefined;
            onChange(undefined);
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            {label && <Label>{label}</Label>}
            <Input
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={disabled}
                placeholder={`0,00 - ${max.toFixed(2)}`}
                className={cn(error && 'border-destructive')}
            />
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
                Nota entre {min.toFixed(2)} e {max.toFixed(2)} (máximo 2 casas decimais)
            </p>
        </div>
    );
}

