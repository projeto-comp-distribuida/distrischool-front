// Simplified schedule as returned in class response
export interface ClassSchedule {
    id: number;
    subjectId: number;
    subjectName: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    teacherId: number;
}

export interface ClassEntity {
    id: number;
    name: string;
    code: string;
    academicYear: string;
    period: string;
    capacity: number;
    currentStudents?: number;
    schoolId?: number;
    schoolName?: string;
    shiftId: number;
    shiftName?: string;
    startDate: string;
    endDate: string;
    room: string;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
    studentIds?: number[];
    teacherIds?: number[];
    // Fields for classes associated with a subject
    subjectId?: number;
    subjectName?: string;
    subjectCode?: string;
    // Nested data
    schedules?: ClassSchedule[];
    subjects?: Array<{ id: number; name: string; code: string }>;
}

export interface CreateClassRequest {
    name: string;
    code: string;
    academicYear: string;
    period: string;
    capacity: number;
    shiftId: number;
    startDate: string;
    endDate: string;
    room: string;
    subjectId: number;
    studentIds?: number[];
    teacherIds?: number[];
}

export interface UpdateClassRequest extends Partial<CreateClassRequest> { }
