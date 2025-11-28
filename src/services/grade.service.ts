import { ApiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { 
    GradeResponseDTO, 
    GradeRequestDTO, 
    ClassGradeSummaryDTO,
    Grade,
    CreateGradeRequest,
    UpdateGradeRequest
} from '@/types/grade.types';
import { PaginatedResponse } from '@/types/student.types';

// Use port 8083 for grades service
const GRADES_API_BASE_URL = process.env.NEXT_PUBLIC_GRADES_API_URL || 'http://192.168.1.7:8083';
const gradesApiClient = new ApiClient(GRADES_API_BASE_URL);

// Ensure token is synced from sessionStorage
// The ApiClient.getToken() already reads from sessionStorage on every request,
// but we also sync the instance token for better reliability
if (typeof window !== 'undefined') {
  // Sync token immediately if available
  const syncToken = () => {
    try {
      const token = window.sessionStorage.getItem('authToken');
      if (token) {
        gradesApiClient.setToken(token);
      }
    } catch (error) {
      // Ignore errors - getToken() will still read from sessionStorage
    }
  };
  
  // Sync on module load
  syncToken();
  
  // Listen for storage events to sync token across tabs/windows
  window.addEventListener('storage', (e) => {
    if (e.key === 'authToken') {
      syncToken();
    }
  });
}

export class GradeService {
    private basePath = '/api/v1/grades';

    /**
     * Ensure token is synced from sessionStorage before making requests
     */
    private ensureTokenSynced(): void {
        if (typeof window !== 'undefined') {
            try {
                const token = window.sessionStorage.getItem('authToken');
                if (token) {
                    gradesApiClient.setToken(token);
                    logger.debug('Grade Service', 'Token synced before request');
                } else {
                    logger.warn('Grade Service', 'No token found in sessionStorage');
                }
            } catch (error) {
                logger.error('Grade Service', 'Error syncing token', error);
            }
        }
    }

    /**
     * Get all grades with pagination
     */
    async getAll(params?: { 
        page?: number; 
        size?: number; 
        sortBy?: string; 
        direction?: 'ASC' | 'DESC' 
    }): Promise<PaginatedResponse<GradeResponseDTO>> {
        this.ensureTokenSynced();
        return gradesApiClient.get<PaginatedResponse<GradeResponseDTO>>(this.basePath, { params });
    }

    /**
     * Get grade by ID
     */
    async getById(id: number): Promise<GradeResponseDTO> {
        this.ensureTokenSynced();
        return gradesApiClient.get<GradeResponseDTO>(`${this.basePath}/${id}`);
    }

    /**
     * Get grades by student ID
     */
    async getByStudent(
        studentId: number, 
        params?: { page?: number; size?: number }
    ): Promise<PaginatedResponse<GradeResponseDTO>> {
        this.ensureTokenSynced();
        return gradesApiClient.get<PaginatedResponse<GradeResponseDTO>>(
            `${this.basePath}/student/${studentId}`, 
            { params }
        );
    }

    /**
     * Get grades by user ID (uses the student endpoint with user id)
     */
    async getByUserId(
        userId: number, 
        params?: { page?: number; size?: number }
    ): Promise<PaginatedResponse<GradeResponseDTO>> {
        this.ensureTokenSynced();
        // Use the student endpoint with user id
        return gradesApiClient.get<PaginatedResponse<GradeResponseDTO>>(
            `${this.basePath}/student/${userId}`, 
            { params }
        );
    }

    /**
     * Get grades by evaluation ID
     */
    async getByEvaluation(
        evaluationId: number,
        params?: { page?: number; size?: number }
    ): Promise<PaginatedResponse<GradeResponseDTO>> {
        this.ensureTokenSynced();
        logger.info('Grade Service', `Getting grades for evaluation ${evaluationId}`, {
            hasToken: !!gradesApiClient.getToken(),
            tokenInStorage: typeof window !== 'undefined' ? !!window.sessionStorage.getItem('authToken') : false
        });
        return gradesApiClient.get<PaginatedResponse<GradeResponseDTO>>(
            `${this.basePath}/evaluation/${evaluationId}`,
            { params }
        );
    }

    /**
     * Calculate student average for a specific academic period
     */
    async getStudentAverage(
        studentId: number,
        academicYear: number,
        academicSemester: number
    ): Promise<number> {
        this.ensureTokenSynced();
        const params = { academicYear, academicSemester };
        return gradesApiClient.get<number>(
            `${this.basePath}/student/${studentId}/average`,
            { params }
        );
    }

    /**
     * Get class grades summary
     */
    async getClassGrades(
        classId: number,
        params?: {
            academicYear?: number;
            academicSemester?: number;
            maxGradesPerStudent?: number;
        }
    ): Promise<ClassGradeSummaryDTO> {
        this.ensureTokenSynced();
        return gradesApiClient.get<ClassGradeSummaryDTO>(
            `${this.basePath}/classes/${classId}/grades`,
            { params }
        );
    }

    /**
     * Calculate class average
     */
    async getClassAverage(
        classId: number,
        params?: {
            academicYear?: number;
            academicSemester?: number;
            maxGradesPerStudent?: number;
        }
    ): Promise<number> {
        this.ensureTokenSynced();
        return gradesApiClient.get<number>(
            `${this.basePath}/classes/${classId}/average`,
            { params }
        );
    }

    /**
     * Calculate global average (all classes)
     */
    async getGlobalAverage(params?: {
        academicYear?: number;
        academicSemester?: number;
        maxGradesPerStudent?: number;
    }): Promise<number> {
        this.ensureTokenSynced();
        return gradesApiClient.get<number>(
            `${this.basePath}/classes/average`,
            { params }
        );
    }

    /**
     * Create a new grade
     */
    async create(data: GradeRequestDTO, userId?: string): Promise<GradeResponseDTO> {
        this.ensureTokenSynced();
        logger.info('Grade Service', `Creating grade for student: ${data.studentId}`);
        try {
            const headers = userId ? { 'X-User-Id': userId } : undefined;
            const grade = await gradesApiClient.post<GradeResponseDTO>(
                this.basePath, 
                data,
                { headers }
            );
            logger.success('Grade Service', `Grade created ID: ${grade.id}`);
            return grade;
        } catch (error) {
            logger.error('Grade Service', `Failed to create grade`, error);
            throw error;
        }
    }

    /**
     * Update an existing grade
     */
    async update(id: number, data: GradeRequestDTO, userId?: string): Promise<GradeResponseDTO> {
        this.ensureTokenSynced();
        logger.info('Grade Service', `Updating grade ID: ${id}`);
        try {
            const headers = userId ? { 'X-User-Id': userId } : undefined;
            const grade = await gradesApiClient.put<GradeResponseDTO>(
                `${this.basePath}/${id}`, 
                data,
                { headers }
            );
            logger.success('Grade Service', `Grade updated ID: ${grade.id}`);
            return grade;
        } catch (error) {
            logger.error('Grade Service', `Failed to update grade ID: ${id}`, error);
            throw error;
        }
    }

    /**
     * Delete a grade (soft delete)
     */
    async delete(id: number, userId?: string): Promise<void> {
        this.ensureTokenSynced();
        logger.info('Grade Service', `Deleting grade ID: ${id}`);
        try {
            const headers = userId ? { 'X-User-Id': userId } : undefined;
            await gradesApiClient.delete(`${this.basePath}/${id}`, { headers });
            logger.success('Grade Service', `Grade deleted ID: ${id}`);
        } catch (error) {
            logger.error('Grade Service', `Failed to delete grade ID: ${id}`, error);
            throw error;
        }
    }
}

export const gradeService = new GradeService();

