import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { Attendance, CreateAttendanceRequest, UpdateAttendanceRequest } from '@/types/attendance.types';

export class AttendanceService {
    private basePath = '/api/v1/attendance';

    async markAttendance(data: CreateAttendanceRequest): Promise<void> {
        logger.info('Attendance Service', `Marking attendance for schedule: ${data.scheduleId}`);
        try {
            await apiClient.post(this.basePath, data);
            logger.success('Attendance Service', `Attendance marked successfully`);
        } catch (error) {
            logger.error('Attendance Service', `Failed to mark attendance`, error);
            throw error;
        }
    }

    async update(id: number, data: UpdateAttendanceRequest): Promise<Attendance> {
        return apiClient.put<Attendance>(`${this.basePath}/${id}`, null, { params: { present: data.present } });
    }

    async getBySchedule(scheduleId: number, date?: string): Promise<Attendance[]> {
        return apiClient.get<Attendance[]>(`${this.basePath}/schedule/${scheduleId}`, { params: { date } });
    }

    async getStudentAttendance(studentId: number, scheduleId: number): Promise<Attendance[]> {
        return apiClient.get<Attendance[]>(`${this.basePath}/student/${studentId}/schedule/${scheduleId}`);
    }
}

export const attendanceService = new AttendanceService();
