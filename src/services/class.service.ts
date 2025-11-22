import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { ClassEntity, CreateClassRequest, UpdateClassRequest } from '@/types/class.types';
import { PaginatedResponse } from '@/types/student.types';

export class ClassService {
    private basePath = '/api/v1/classes';

    async getAll(params?: { page?: number; size?: number }): Promise<PaginatedResponse<ClassEntity>> {
        return apiClient.get<PaginatedResponse<ClassEntity>>(this.basePath, { params });
    }

    async getById(id: number): Promise<ClassEntity> {
        return apiClient.get<ClassEntity>(`${this.basePath}/${id}`);
    }

    async create(data: CreateClassRequest): Promise<ClassEntity> {
        logger.info('Class Service', `Creating class: ${data.name}`);
        try {
            const classEntity = await apiClient.post<ClassEntity>(this.basePath, data);
            logger.success('Class Service', `Class created: ${classEntity.name}`);
            return classEntity;
        } catch (error) {
            logger.error('Class Service', `Failed to create class: ${data.name}`, error);
            throw error;
        }
    }

    async update(id: number, data: UpdateClassRequest): Promise<ClassEntity> {
        return apiClient.put<ClassEntity>(`${this.basePath}/${id}`, data);
    }

    async delete(id: number): Promise<void> {
        await apiClient.delete(`${this.basePath}/${id}`);
    }

    async addStudents(classId: number, studentIds: number[]): Promise<void> {
        await apiClient.post(`${this.basePath}/${classId}/students`, studentIds);
    }

    async addTeachers(classId: number, teacherIds: number[]): Promise<void> {
        await apiClient.post(`${this.basePath}/${classId}/teachers`, teacherIds);
    }
}

export const classService = new ClassService();
