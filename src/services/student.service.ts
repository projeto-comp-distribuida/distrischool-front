// Student Management Service

import { ApiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
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

// Use port 8081 for student management service
const STUDENT_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_STUDENT_SERVICE_URL || 'http://192.168.1.7:8081';
const studentApiClient = new ApiClient(STUDENT_SERVICE_BASE_URL);

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
    return studentApiClient.get<PaginatedResponse<Student>>(this.basePath, { params });
  }

  /**
   * Search students with filters
   */
  async search(params: StudentSearchParams): Promise<PaginatedResponse<Student>> {
    return studentApiClient.get<PaginatedResponse<Student>>(
      `${this.basePath}/search`,
      { params }
    );
  }

  /**
   * Get student by ID
   */
  async getById(id: number): Promise<Student> {
    return studentApiClient.get<Student>(`${this.basePath}/${id}`);
  }

  /**
   * Get student by registration number
   */
  async getByRegistrationNumber(registrationNumber: string): Promise<Student> {
    return studentApiClient.get<Student>(
      `${this.basePath}/registration/${registrationNumber}`
    );
  }

  /**
   * Create a new student
   */
  async create(data: CreateStudentRequest, userId?: string): Promise<Student> {
    logger.info('Student Service', `Tentando criar novo estudante: ${data.fullName}`, {
      email: data.email,
      registrationNumber: data.registrationNumber
    });

    const headers = userId ? { 'X-User-Id': userId } : undefined;

    // Filter out fields that backend doesn't support yet
    const backendData = {
      fullName: data.fullName,
      cpf: data.cpf,
      email: data.email,
      phone: data.phone,
      birthDate: data.birthDate,
      registrationNumber: data.registrationNumber || this.generateTempRegistrationNumber(),
      course: data.course,
      semester: data.semester,
      enrollmentDate: data.enrollmentDate,
      status: data.status,
      notes: data.notes,
    };

    try {
      const student = await studentApiClient.post<Student>(this.basePath, backendData, { headers });
      logger.success('Student Service', `✅ Estudante criado com sucesso: ${student.fullName}`, {
        id: student.id,
        registrationNumber: student.registrationNumber
      });
      return student;
    } catch (error) {
      logger.error('Student Service', `❌ Falha ao criar estudante: ${data.fullName}`, error);
      throw error;
    }
  }

  /**
   * Generate a temporary registration number (format: YYYYMM + 6 digits)
   */
  private generateTempRegistrationNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${year}${month}${random}`;
  }

  /**
   * Update an existing student
   */
  async update(
    id: number,
    data: UpdateStudentRequest,
    userId?: string
  ): Promise<Student> {
    logger.info('Student Service', `Tentando atualizar estudante ID: ${id}`, {
      fullName: data.fullName,
      email: data.email
    });

    const headers = userId ? { 'X-User-Id': userId } : undefined;

    // Filter out fields that backend doesn't support yet
    const backendData = {
      fullName: data.fullName,
      cpf: data.cpf,
      email: data.email,
      phone: data.phone,
      birthDate: data.birthDate,
      registrationNumber: data.registrationNumber,
      course: data.course,
      semester: data.semester,
      enrollmentDate: data.enrollmentDate,
      status: data.status,
      notes: data.notes,
    };

    try {
      const student = await studentApiClient.put<Student>(`${this.basePath}/${id}`, backendData, { headers });
      logger.success('Student Service', `✅ Estudante atualizado com sucesso: ${student.fullName}`, {
        id: student.id
      });
      return student;
    } catch (error) {
      logger.error('Student Service', `❌ Falha ao atualizar estudante ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete (soft delete) a student
   */
  async delete(id: number, userId?: string): Promise<ApiResponse> {
    logger.info('Student Service', `Tentando deletar estudante ID: ${id}`);

    const headers = userId ? { 'X-User-Id': userId } : undefined;

    try {
      const response = await studentApiClient.delete<ApiResponse>(`${this.basePath}/${id}`, { headers });
      logger.success('Student Service', `✅ Estudante deletado com sucesso ID: ${id}`);
      return response;
    } catch (error) {
      logger.error('Student Service', `❌ Falha ao deletar estudante ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Restore a deleted student
   */
  async restore(id: number, userId?: string): Promise<Student> {
    const headers = userId ? { 'X-User-Id': userId } : undefined;
    return studentApiClient.post<Student>(
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
    return studentApiClient.patch<Student>(
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
    return studentApiClient.get<PaginatedResponse<Student>>(
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
    return studentApiClient.get<PaginatedResponse<Student>>(
      `${this.basePath}/course/${courseName}/semester/${semester}`,
      { params }
    );
  }

  /**
   * Get student statistics
   */
  async getStatistics(): Promise<StudentStatistics> {
    return studentApiClient.get<StudentStatistics>(`${this.basePath}/statistics`);
  }

  /**
   * Count students by course
   */
  async countByCourse(courseName: string): Promise<number> {
    return studentApiClient.get<number>(
      `${this.basePath}/count/course/${courseName}`
    );
  }
}

// Export singleton instance
export const studentService = new StudentService();


