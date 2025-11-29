import { ClassEntity } from '@/types/class.types';
import { Subject } from '@/types/subject.types';
import { Schedule } from '@/types/schedule.types';

/**
 * Infere quais classes pertencem a um subject através dos schedules
 */
export function getClassesForSubject(
    subjectId: number,
    schedules: Schedule[]
): ClassEntity[] {
    const classIds = new Set<number>();
    
    schedules.forEach(schedule => {
        if (schedule.subject?.id === subjectId && schedule.classEntity) {
            classIds.add(schedule.classEntity.id);
        }
    });

    // Retorna classes únicas baseadas nos IDs encontrados
    const classes: ClassEntity[] = [];
    const addedIds = new Set<number>();
    
    schedules.forEach(schedule => {
        if (schedule.subject?.id === subjectId && schedule.classEntity) {
            if (!addedIds.has(schedule.classEntity.id)) {
                classes.push(schedule.classEntity);
                addedIds.add(schedule.classEntity.id);
            }
        }
    });

    return classes;
}

/**
 * Conta quantas classes um subject tem
 */
export function countClassesForSubject(
    subjectId: number,
    schedules: Schedule[]
): number {
    const classIds = new Set<number>();
    
    schedules.forEach(schedule => {
        if (schedule.subject?.id === subjectId && schedule.classEntity) {
            classIds.add(schedule.classEntity.id);
        }
    });

    return classIds.size;
}

/**
 * Filtra schedules por classEntity.id
 */
export function getSchedulesForClass(
    classId: number,
    schedules: Schedule[]
): Schedule[] {
    return schedules.filter(schedule => {
        const scheduleClassId = schedule.classEntity?.id ?? schedule.classId;
        return scheduleClassId === classId;
    });
}

/**
 * Conta quantos schedules uma classe tem
 */
export function countSchedulesForClass(
    classId: number,
    schedules: Schedule[]
): number {
    return schedules.filter(schedule => {
        const scheduleClassId = schedule.classEntity?.id ?? schedule.classId;
        return scheduleClassId === classId;
    }).length;
}

