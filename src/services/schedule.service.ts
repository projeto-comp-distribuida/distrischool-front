import { ApiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '@/types/schedule.types';
import { PaginatedResponse } from '@/types/student.types';

// Use port 8084 for schedules service
const SCHEDULES_API_BASE_URL = process.env.NEXT_PUBLIC_CLASSES_API_URL || 'http://192.168.1.7:8084';
const schedulesApiClient = new ApiClient(SCHEDULES_API_BASE_URL);

export class ScheduleService {
    private basePath = '/api/v1/schedules';

    async getAll(params?: { page?: number; size?: number }): Promise<PaginatedResponse<Schedule>> {
        return schedulesApiClient.get<PaginatedResponse<Schedule>>(this.basePath, { params });
    }

    async getById(id: number): Promise<Schedule> {
        return schedulesApiClient.get<Schedule>(`${this.basePath}/${id}`);
    }

    async create(data: CreateScheduleRequest): Promise<Schedule> {
        logger.info('Schedule Service', `Creating schedule`);
        try {
            const schedule = await schedulesApiClient.post<Schedule>(this.basePath, data);
            logger.success('Schedule Service', `Schedule created ID: ${schedule.id}`);
            return schedule;
        } catch (error) {
            logger.error('Schedule Service', `Failed to create schedule`, error);
            throw error;
        }
    }

    async update(id: number, data: UpdateScheduleRequest): Promise<Schedule> {
        return schedulesApiClient.put<Schedule>(`${this.basePath}/${id}`, data);
    }

    async delete(id: number): Promise<void> {
        await schedulesApiClient.delete(`${this.basePath}/${id}`);
    }

    async checkConflicts(id: number): Promise<any> {
        return schedulesApiClient.post(`${this.basePath}/${id}/check-conflicts`);
    }
}

export const scheduleService = new ScheduleService();
