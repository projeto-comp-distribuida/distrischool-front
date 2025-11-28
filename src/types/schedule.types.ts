import { ClassEntity } from './class.types';
import { Subject } from './subject.types';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface Shift {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
}

export interface Schedule {
    id: number;
    classEntity?: ClassEntity;
    subject?: Subject;
    shift?: Shift;
    classId?: number;
    className?: string;
    classCode?: string;
    subjectId?: number;
    subjectName?: string;
    subjectCode?: string;
    shiftId?: number;
    shiftName?: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    room: string;
    teacherId: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateScheduleRequest {
    classEntity: { id: number };
    subject: { id: number };
    shift: { id: number };
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    room: string;
    teacherId: number;
    active: boolean;
}

export interface UpdateScheduleRequest extends Partial<CreateScheduleRequest> { }
