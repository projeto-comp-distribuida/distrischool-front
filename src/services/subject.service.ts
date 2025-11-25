import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { Subject, CreateSubjectRequest, UpdateSubjectRequest } from '@/types/subject.types';
import { PaginatedResponse } from '@/types/student.types';

export class SubjectService {
    private basePath = '/api/v1/subjects';

    async getAll(params?: { page?: number; size?: number }): Promise<PaginatedResponse<Subject>> {
        return apiClient.get<PaginatedResponse<Subject>>(this.basePath, { params });
    }

    async getById(id: number): Promise<Subject> {
        return apiClient.get<Subject>(`${this.basePath}/${id}`);
    }

    async create(data: CreateSubjectRequest): Promise<Subject> {
        logger.info('Subject Service', `Creating subject: ${data.name}`);
        try {
            const subject = await apiClient.post<Subject>(this.basePath, data);
            logger.success('Subject Service', `Subject created: ${subject.name}`);
            return subject;
        } catch (error) {
            logger.error('Subject Service', `Failed to create subject: ${data.name}`, error);
            throw error;
        }
    }

    async update(id: number, data: UpdateSubjectRequest): Promise<Subject> {
        return apiClient.put<Subject>(`${this.basePath}/${id}`, data);
    }

    async delete(id: number): Promise<void> {
        await apiClient.delete(`${this.basePath}/${id}`);
    }
}

export const subjectService = new SubjectService();
