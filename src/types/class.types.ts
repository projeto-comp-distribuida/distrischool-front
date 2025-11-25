export interface ClassEntity {
    id: number;
    name: string;
    code: string;
    academicYear: string;
    period: string;
    capacity: number;
    shiftId: number;
    startDate: string;
    endDate: string;
    room: string;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
    studentIds?: number[];
    teacherIds?: number[];
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
    studentIds?: number[];
    teacherIds?: number[];
}

export interface UpdateClassRequest extends Partial<CreateClassRequest> { }
