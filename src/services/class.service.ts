import { ApiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { ClassEntity, CreateClassRequest, UpdateClassRequest } from '@/types/class.types';

// Use API Gateway for classes service
const CLASSES_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://distrischool.ddns.net';
const classesApiClient = new ApiClient(CLASSES_API_BASE_URL);

export class ClassService {
    private basePath = '/api/v1/classes';

    async getAll(params?: { page?: number; size?: number }): Promise<ClassEntity[]> {
        // Backend returns array directly in data field, not paginated response
        return classesApiClient.get<ClassEntity[]>(this.basePath, { params });
    }

    async getById(id: number): Promise<ClassEntity> {
        return classesApiClient.get<ClassEntity>(`${this.basePath}/${id}`);
    }

    async create(data: CreateClassRequest): Promise<ClassEntity> {
        logger.info('Class Service', `Creating class: ${data.name}`);
        try {
            const classEntity = await classesApiClient.post<ClassEntity>(this.basePath, data);
            logger.success('Class Service', `Class created: ${classEntity.name}`);
            return classEntity;
        } catch (error) {
            logger.error('Class Service', `Failed to create class: ${data.name}`, error);
            throw error;
        }
    }

    async update(id: number, data: UpdateClassRequest): Promise<ClassEntity> {
        return classesApiClient.put<ClassEntity>(`${this.basePath}/${id}`, data);
    }

    async delete(id: number): Promise<void> {
        await classesApiClient.delete(`${this.basePath}/${id}`);
    }

    async addStudents(classId: number, studentIds: number[]): Promise<void> {
        await classesApiClient.post(`${this.basePath}/${classId}/students`, studentIds);
    }

    async addTeachers(classId: number, teacherIds: number[]): Promise<void> {
        await classesApiClient.post(`${this.basePath}/${classId}/teachers`, teacherIds);
    }
}

export const classService = new ClassService();
