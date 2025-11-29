import { ApiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { Attendance, CreateAttendanceRequest, UpdateAttendanceRequest } from '@/types/attendance.types';

// Use API Gateway for attendance service
const ATTENDANCE_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://distrischool.ddns.net';
const attendanceApiClient = new ApiClient(ATTENDANCE_API_BASE_URL);

export class AttendanceService {
    private basePath = '/api/v1/attendance';

    async markAttendance(data: CreateAttendanceRequest): Promise<void> {
        logger.info('Attendance Service', `Marking attendance for schedule: ${data.scheduleId}`);
        try {
            await attendanceApiClient.post(this.basePath, data);
            logger.success('Attendance Service', `Attendance marked successfully`);
        } catch (error) {
            logger.error('Attendance Service', `Failed to mark attendance`, error);
            throw error;
        }
    }

    async update(id: number, data: UpdateAttendanceRequest): Promise<Attendance> {
        return attendanceApiClient.put<Attendance>(`${this.basePath}/${id}`, null, { params: { present: data.present } });
    }

    async getBySchedule(scheduleId: number, date?: string): Promise<Attendance[]> {
        return attendanceApiClient.get<Attendance[]>(`${this.basePath}/schedule/${scheduleId}`, { params: { date } });
    }

    async getStudentAttendance(studentId: number, scheduleId: number): Promise<Attendance[]> {
        return attendanceApiClient.get<Attendance[]>(`${this.basePath}/student/${studentId}/schedule/${scheduleId}`);
    }

    /**
     * Get all attendance records for a student
     */
    async getByStudent(studentId: number): Promise<Attendance[]> {
        return attendanceApiClient.get<Attendance[]>(`${this.basePath}/student/${studentId}`);
    }
}

export const attendanceService = new AttendanceService();
