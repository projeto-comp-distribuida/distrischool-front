// Teacher Management Service

import { ApiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import type {
  Teacher,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  TeacherAssignment,
  CreateAssignmentRequest,
  TeacherSchedule,
  PerformanceReport,
  DashboardOverview,
  PerformanceSummary,
  TeacherStatus,
} from '@/types/teacher.types';
import type { ApiResponse } from '@/types/auth.types';

const TEACHER_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_TEACHER_SERVICE_URL || 'http://192.168.1.7:8082';
const teacherApiClient = new ApiClient(TEACHER_SERVICE_BASE_URL);

export class TeacherService {
  private basePath = '/api/v1/teachers';
  private managementPath = '/api/v1/teacher-management';

  // ==================== Basic CRUD Operations ====================

  /**
   * Get all teachers with optional pagination
   */
  async getAll(params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: 'ASC' | 'DESC';
  }): Promise<Teacher[] | any> {
    return teacherApiClient.get<Teacher[] | any>(this.basePath, { params });
  }

  /**
   * Get teacher by ID
   */
  async getById(id: number): Promise<Teacher> {
    return teacherApiClient.get<Teacher>(`${this.basePath}/${id}`);
  }

  /**
   * Get teacher by employee ID
   */
  async getByEmployeeId(employeeId: string): Promise<Teacher> {
    return teacherApiClient.get<Teacher>(`${this.basePath}/employee/${employeeId}`);
  }

  /**
   * Create a new teacher
   */
  async create(data: CreateTeacherRequest): Promise<Teacher> {
    logger.info('Teacher Service', `Tentando criar novo professor: ${data.fullName}`, {
      email: data.email,
      employeeId: data.employeeId
    });

    try {
      const teacher = await teacherApiClient.post<Teacher>(this.basePath, data);
      logger.success('Teacher Service', `✅ Professor criado com sucesso: ${teacher.fullName}`, {
        id: teacher.id,
        employeeId: teacher.employeeId
      });
      return teacher;
    } catch (error) {
      logger.error('Teacher Service', `❌ Falha ao criar professor: ${data.fullName}`, error);
      throw error;
    }
  }

  /**
   * Update an existing teacher
   */
  async update(id: number, data: UpdateTeacherRequest): Promise<Teacher> {
    logger.info('Teacher Service', `Tentando atualizar professor ID: ${id}`, {
      fullName: data.fullName,
      email: data.email
    });

    try {
      const teacher = await teacherApiClient.put<Teacher>(`${this.basePath}/${id}`, data);
      logger.success('Teacher Service', `✅ Professor atualizado com sucesso: ${teacher.fullName}`, {
        id: teacher.id
      });
      return teacher;
    } catch (error) {
      logger.error('Teacher Service', `❌ Falha ao atualizar professor ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Delete a teacher
   */
  async delete(id: number): Promise<ApiResponse> {
    logger.info('Teacher Service', `Tentando deletar professor ID: ${id}`);

    try {
      const response = await teacherApiClient.delete<ApiResponse>(`${this.basePath}/${id}`);
      logger.success('Teacher Service', `✅ Professor deletado com sucesso ID: ${id}`);
      return response;
    } catch (error) {
      logger.error('Teacher Service', `❌ Falha ao deletar professor ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Get teachers by subject
   */
  async getBySubject(subject: string): Promise<Teacher[]> {
    return teacherApiClient.get<Teacher[]>(`${this.basePath}/subject/${subject}`);
  }

  /**
   * Get teachers by status
   */
  async getByStatus(status: TeacherStatus): Promise<Teacher[]> {
    return teacherApiClient.get<Teacher[]>(`${this.basePath}/status/${status}`);
  }

  /**
   * Get teachers hired in a date range
   */
  async getByHireDate(startDate: string, endDate: string): Promise<Teacher[]> {
    return teacherApiClient.get<Teacher[]>(`${this.basePath}/hired`, {
      params: { startDate, endDate },
    });
  }

  // ==================== Management Operations ====================

  /**
   * Get all teachers (management endpoint)
   */
  async getAllManagement(): Promise<Teacher[]> {
    return teacherApiClient.get<Teacher[]>(`${this.managementPath}/teachers`);
  }

  /**
   * Get teacher by ID (management endpoint)
   */
  async getByIdManagement(id: number): Promise<Teacher> {
    return teacherApiClient.get<Teacher>(`${this.managementPath}/teachers/${id}`);
  }

  /**
   * Create teacher (management endpoint)
   */
  async createManagement(data: CreateTeacherRequest): Promise<Teacher> {
    return teacherApiClient.post<Teacher>(`${this.managementPath}/teachers`, data);
  }

  /**
   * Update teacher (management endpoint)
   */
  async updateManagement(id: number, data: UpdateTeacherRequest): Promise<Teacher> {
    return teacherApiClient.put<Teacher>(`${this.managementPath}/teachers/${id}`, data);
  }

  /**
   * Delete teacher (management endpoint)
   */
  async deleteManagement(id: number): Promise<ApiResponse> {
    return teacherApiClient.delete<ApiResponse>(`${this.managementPath}/teachers/${id}`);
  }

  // ==================== Assignments ====================

  /**
   * Assign teacher to a class
   */
  async createAssignment(data: CreateAssignmentRequest): Promise<TeacherAssignment> {
    return teacherApiClient.post<TeacherAssignment>(
      `${this.managementPath}/assignments`,
      undefined,
      { params: data }
    );
  }

  /**
   * Get assignments by teacher
   */
  async getAssignmentsByTeacher(teacherId: number): Promise<TeacherAssignment[]> {
    return teacherApiClient.get<TeacherAssignment[]>(
      `${this.managementPath}/assignments/teacher/${teacherId}`
    );
  }

  /**
   * Get assignments by class
   */
  async getAssignmentsByClass(classGroupId: number): Promise<TeacherAssignment[]> {
    return teacherApiClient.get<TeacherAssignment[]>(
      `${this.managementPath}/assignments/class/${classGroupId}`
    );
  }

  // ==================== Schedules ====================

  /**
   * Get teacher schedules
   */
  async getTeacherSchedules(
    teacherId: number,
    academicYear?: number
  ): Promise<TeacherSchedule[]> {
    return teacherApiClient.get<TeacherSchedule[]>(
      `${this.managementPath}/schedules/teacher/${teacherId}`,
      { params: academicYear ? { academicYear } : undefined }
    );
  }

  /**
   * Get class schedules
   */
  async getClassSchedules(classGroupId: number): Promise<TeacherSchedule[]> {
    return teacherApiClient.get<TeacherSchedule[]>(
      `${this.managementPath}/schedules/class/${classGroupId}`
    );
  }

  /**
   * Get weekly schedule for teacher
   */
  async getWeeklySchedule(
    teacherId: number,
    academicYear?: number
  ): Promise<TeacherSchedule[]> {
    return teacherApiClient.get<TeacherSchedule[]>(
      `${this.managementPath}/schedules/weekly/teacher/${teacherId}`,
      { params: academicYear ? { academicYear } : undefined }
    );
  }

  // ==================== Performance Reports ====================

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    teacherId: number,
    startDate: string,
    endDate: string
  ): Promise<PerformanceReport> {
    return teacherApiClient.post<PerformanceReport>(
      `${this.managementPath}/performance-reports`,
      undefined,
      { params: { teacherId, startDate, endDate } }
    );
  }

  /**
   * Get performance reports by teacher
   */
  async getPerformanceReportsByTeacher(
    teacherId: number
  ): Promise<PerformanceReport[]> {
    return teacherApiClient.get<PerformanceReport[]>(
      `${this.managementPath}/performance-reports/teacher/${teacherId}`
    );
  }

  /**
   * Get performance reports by period
   */
  async getPerformanceReportsByPeriod(
    startDate: string,
    endDate: string
  ): Promise<PerformanceReport[]> {
    return teacherApiClient.get<PerformanceReport[]>(
      `${this.managementPath}/performance-reports/period`,
      { params: { startDate, endDate } }
    );
  }

  // ==================== Notifications ====================

  /**
   * Send assignment notification
   */
  async sendAssignmentNotification(assignmentId: number): Promise<ApiResponse> {
    return teacherApiClient.post<ApiResponse>(
      `${this.managementPath}/notifications/assignment/${assignmentId}`
    );
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(): Promise<any[]> {
    return teacherApiClient.get<any[]>(
      `${this.managementPath}/notifications/pending`
    );
  }

  // ==================== Audit Logs ====================

  /**
   * Get audit logs
   */
  async getAuditLogs(params?: {
    action?: string;
    entityId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    return teacherApiClient.get<any[]>(`${this.managementPath}/audit-logs`, {
      params,
    });
  }

  // ==================== Dashboard ====================

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    return teacherApiClient.get<DashboardOverview>(
      `${this.managementPath}/dashboard/overview`
    );
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<PerformanceSummary> {
    return teacherApiClient.get<PerformanceSummary>(
      `${this.managementPath}/dashboard/performance-summary`
    );
  }

  /**
   * Health check for management service
   */
  async healthCheck(): Promise<ApiResponse> {
    return teacherApiClient.get<ApiResponse>(`${this.managementPath}/health`);
  }
}

// Export singleton instance
export const teacherService = new TeacherService();


