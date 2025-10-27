// Student Management Service

import { apiClient } from '@/lib/api-client';
import type {
  Student,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentSearchParams,
  StudentStatistics,
  PaginatedResponse,
  StudentStatus,
} from '@/types/student.types';
import type { ApiResponse } from '@/types/auth.types';

export class StudentService {
  private basePath = '/api/v1/students';

  /**
   * Get all students with pagination
   */
  async getAll(params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<Student>> {
    return apiClient.get<PaginatedResponse<Student>>(this.basePath, { params });
  }

  /**
   * Search students with filters
   */
  async search(params: StudentSearchParams): Promise<PaginatedResponse<Student>> {
    return apiClient.get<PaginatedResponse<Student>>(
      `${this.basePath}/search`,
      { params }
    );
  }

  /**
   * Get student by ID
   */
  async getById(id: number): Promise<Student> {
    return apiClient.get<Student>(`${this.basePath}/${id}`);
  }

  /**
   * Get student by registration number
   */
  async getByRegistrationNumber(registrationNumber: string): Promise<Student> {
    return apiClient.get<Student>(
      `${this.basePath}/registration/${registrationNumber}`
    );
  }

  /**
   * Create a new student
   */
  async create(data: CreateStudentRequest, userId?: string): Promise<Student> {
    const headers = userId ? { 'X-User-Id': userId } : undefined;
    return apiClient.post<Student>(this.basePath, data, { headers });
  }

  /**
   * Update an existing student
   */
  async update(
    id: number,
    data: UpdateStudentRequest,
    userId?: string
  ): Promise<Student> {
    const headers = userId ? { 'X-User-Id': userId } : undefined;
    return apiClient.put<Student>(`${this.basePath}/${id}`, data, { headers });
  }

  /**
   * Delete (soft delete) a student
   */
  async delete(id: number, userId?: string): Promise<ApiResponse> {
    const headers = userId ? { 'X-User-Id': userId } : undefined;
    return apiClient.delete<ApiResponse>(`${this.basePath}/${id}`, { headers });
  }

  /**
   * Restore a deleted student
   */
  async restore(id: number, userId?: string): Promise<Student> {
    const headers = userId ? { 'X-User-Id': userId } : undefined;
    return apiClient.post<Student>(
      `${this.basePath}/${id}/restore`,
      undefined,
      { headers }
    );
  }

  /**
   * Update student status
   */
  async updateStatus(
    id: number,
    status: StudentStatus,
    userId?: string
  ): Promise<Student> {
    const headers = userId ? { 'X-User-Id': userId } : undefined;
    return apiClient.patch<Student>(
      `${this.basePath}/${id}/status`,
      undefined,
      { params: { status }, headers }
    );
  }

  /**
   * Get students by course
   */
  async getByCourse(
    courseName: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<Student>> {
    return apiClient.get<PaginatedResponse<Student>>(
      `${this.basePath}/course/${courseName}`,
      { params }
    );
  }

  /**
   * Get students by course and semester
   */
  async getByCourseAndSemester(
    courseName: string,
    semester: number,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<Student>> {
    return apiClient.get<PaginatedResponse<Student>>(
      `${this.basePath}/course/${courseName}/semester/${semester}`,
      { params }
    );
  }

  /**
   * Get student statistics
   */
  async getStatistics(): Promise<StudentStatistics> {
    return apiClient.get<StudentStatistics>(`${this.basePath}/statistics`);
  }

  /**
   * Count students by course
   */
  async countByCourse(courseName: string): Promise<number> {
    return apiClient.get<number>(
      `${this.basePath}/count/course/${courseName}`
    );
  }
}

// Export singleton instance
export const studentService = new StudentService();


