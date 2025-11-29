import { ApiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { Subject, CreateSubjectRequest, UpdateSubjectRequest } from '@/types/subject.types';

// Use API Gateway for subjects service
const SUBJECTS_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://distrischool.ddns.net';
const subjectsApiClient = new ApiClient(SUBJECTS_API_BASE_URL);

export class SubjectService {
    private basePath = '/api/v1/subjects';

    async getAll(params?: { page?: number; size?: number }): Promise<Subject[]> {
        // Backend returns array directly in data field, not paginated response
        return subjectsApiClient.get<Subject[]>(this.basePath, { params });
    }

    async getById(id: number): Promise<Subject> {
        return subjectsApiClient.get<Subject>(`${this.basePath}/${id}`);
    }

    async create(data: CreateSubjectRequest): Promise<Subject> {
        logger.info('Subject Service', `Creating subject: ${data.name}`);
        try {
            const subject = await subjectsApiClient.post<Subject>(this.basePath, data);
            logger.success('Subject Service', `Subject created: ${subject.name}`);
            return subject;
        } catch (error) {
            logger.error('Subject Service', `Failed to create subject: ${data.name}`, error);
            throw error;
        }
    }

    async update(id: number, data: UpdateSubjectRequest): Promise<Subject> {
        return subjectsApiClient.put<Subject>(`${this.basePath}/${id}`, data);
    }

    async delete(id: number): Promise<void> {
        await subjectsApiClient.delete(`${this.basePath}/${id}`);
    }
}

export const subjectService = new SubjectService();
