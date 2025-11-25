import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { Grade, CreateGradeRequest, UpdateGradeRequest } from '@/types/grade.types';
import { PaginatedResponse } from '@/types/student.types';

export class GradeService {
    private basePath = '/api/v1/grades';

    async getAll(params?: { page?: number; size?: number; studentId?: number; subjectId?: number }): Promise<PaginatedResponse<Grade>> {
        return apiClient.get<PaginatedResponse<Grade>>(this.basePath, { params });
    }

    async getById(id: number): Promise<Grade> {
        return apiClient.get<Grade>(`${this.basePath}/${id}`);
    }

    async getByStudent(studentId: number, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Grade>> {
        return apiClient.get<PaginatedResponse<Grade>>(`${this.basePath}/student/${studentId}`, { params });
    }

    async getBySubject(subjectId: number, params?: { page?: number; size?: number }): Promise<PaginatedResponse<Grade>> {
        return apiClient.get<PaginatedResponse<Grade>>(`${this.basePath}/subject/${subjectId}`, { params });
    }

    async create(data: CreateGradeRequest): Promise<Grade> {
        logger.info('Grade Service', `Creating grade for student: ${data.studentId}`);
        try {
            const grade = await apiClient.post<Grade>(this.basePath, data);
            logger.success('Grade Service', `Grade created ID: ${grade.id}`);
            return grade;
        } catch (error) {
            logger.error('Grade Service', `Failed to create grade`, error);
            throw error;
        }
    }

    async update(id: number, data: UpdateGradeRequest): Promise<Grade> {
        logger.info('Grade Service', `Updating grade ID: ${id}`);
        try {
            const grade = await apiClient.put<Grade>(`${this.basePath}/${id}`, data);
            logger.success('Grade Service', `Grade updated ID: ${grade.id}`);
            return grade;
        } catch (error) {
            logger.error('Grade Service', `Failed to update grade ID: ${id}`, error);
            throw error;
        }
    }

    async delete(id: number): Promise<void> {
        await apiClient.delete(`${this.basePath}/${id}`);
    }
}

export const gradeService = new GradeService();

