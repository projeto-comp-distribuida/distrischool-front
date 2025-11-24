import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '@/types/schedule.types';
import { PaginatedResponse } from '@/types/student.types';

export class ScheduleService {
    private basePath = '/api/v1/schedules';

    async getAll(params?: { page?: number; size?: number }): Promise<PaginatedResponse<Schedule>> {
        return apiClient.get<PaginatedResponse<Schedule>>(this.basePath, { params });
    }

    async getById(id: number): Promise<Schedule> {
        return apiClient.get<Schedule>(`${this.basePath}/${id}`);
    }

    async create(data: CreateScheduleRequest): Promise<Schedule> {
        logger.info('Schedule Service', `Creating schedule`);
        try {
            const schedule = await apiClient.post<Schedule>(this.basePath, data);
            logger.success('Schedule Service', `Schedule created ID: ${schedule.id}`);
            return schedule;
        } catch (error) {
            logger.error('Schedule Service', `Failed to create schedule`, error);
            throw error;
        }
    }

    async update(id: number, data: UpdateScheduleRequest): Promise<Schedule> {
        return apiClient.put<Schedule>(`${this.basePath}/${id}`, data);
    }

    async delete(id: number): Promise<void> {
        await apiClient.delete(`${this.basePath}/${id}`);
    }

    async checkConflicts(id: number): Promise<any> {
        return apiClient.post(`${this.basePath}/${id}/check-conflicts`);
    }
}

export const scheduleService = new ScheduleService();
