export interface Attendance {
    id: number;
    scheduleId: number;
    studentId: number;
    date: string;
    present: boolean;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAttendanceRequest {
    scheduleId: number;
    date: string;
    studentPresence: Record<number, boolean>; // studentId -> present
    notes?: string;
}

export interface UpdateAttendanceRequest {
    present: boolean;
    notes?: string;
}
