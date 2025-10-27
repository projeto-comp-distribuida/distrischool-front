// Teacher Management Service

import { apiClient } from '@/lib/api-client';
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

export class TeacherService {
  private basePath = '/api/v1/teachers';
  private managementPath = '/api/v1/teacher-management';

  // ==================== Basic CRUD Operations ====================

  /**
   * Get all teachers
   */
  async getAll(): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>(this.basePath);
  }

  /**
   * Get teacher by ID
   */
  async getById(id: number): Promise<Teacher> {
    return apiClient.get<Teacher>(`${this.basePath}/${id}`);
  }

  /**
   * Get teacher by employee ID
   */
  async getByEmployeeId(employeeId: string): Promise<Teacher> {
    return apiClient.get<Teacher>(`${this.basePath}/employee/${employeeId}`);
  }

  /**
   * Create a new teacher
   */
  async create(data: CreateTeacherRequest): Promise<Teacher> {
    return apiClient.post<Teacher>(this.basePath, data);
  }

  /**
   * Update an existing teacher
   */
  async update(id: number, data: UpdateTeacherRequest): Promise<Teacher> {
    return apiClient.put<Teacher>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete a teacher
   */
  async delete(id: number): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`${this.basePath}/${id}`);
  }

  /**
   * Get teachers by subject
   */
  async getBySubject(subject: string): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>(`${this.basePath}/subject/${subject}`);
  }

  /**
   * Get teachers by status
   */
  async getByStatus(status: TeacherStatus): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>(`${this.basePath}/status/${status}`);
  }

  /**
   * Get teachers hired in a date range
   */
  async getByHireDate(startDate: string, endDate: string): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>(`${this.basePath}/hired`, {
      params: { startDate, endDate },
    });
  }

  // ==================== Management Operations ====================

  /**
   * Get all teachers (management endpoint)
   */
  async getAllManagement(): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>(`${this.managementPath}/teachers`);
  }

  /**
   * Get teacher by ID (management endpoint)
   */
  async getByIdManagement(id: number): Promise<Teacher> {
    return apiClient.get<Teacher>(`${this.managementPath}/teachers/${id}`);
  }

  /**
   * Create teacher (management endpoint)
   */
  async createManagement(data: CreateTeacherRequest): Promise<Teacher> {
    return apiClient.post<Teacher>(`${this.managementPath}/teachers`, data);
  }

  /**
   * Update teacher (management endpoint)
   */
  async updateManagement(id: number, data: UpdateTeacherRequest): Promise<Teacher> {
    return apiClient.put<Teacher>(`${this.managementPath}/teachers/${id}`, data);
  }

  /**
   * Delete teacher (management endpoint)
   */
  async deleteManagement(id: number): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`${this.managementPath}/teachers/${id}`);
  }

  // ==================== Assignments ====================

  /**
   * Assign teacher to a class
   */
  async createAssignment(data: CreateAssignmentRequest): Promise<TeacherAssignment> {
    return apiClient.post<TeacherAssignment>(
      `${this.managementPath}/assignments`,
      undefined,
      { params: data }
    );
  }

  /**
   * Get assignments by teacher
   */
  async getAssignmentsByTeacher(teacherId: number): Promise<TeacherAssignment[]> {
    return apiClient.get<TeacherAssignment[]>(
      `${this.managementPath}/assignments/teacher/${teacherId}`
    );
  }

  /**
   * Get assignments by class
   */
  async getAssignmentsByClass(classGroupId: number): Promise<TeacherAssignment[]> {
    return apiClient.get<TeacherAssignment[]>(
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
    return apiClient.get<TeacherSchedule[]>(
      `${this.managementPath}/schedules/teacher/${teacherId}`,
      { params: academicYear ? { academicYear } : undefined }
    );
  }

  /**
   * Get class schedules
   */
  async getClassSchedules(classGroupId: number): Promise<TeacherSchedule[]> {
    return apiClient.get<TeacherSchedule[]>(
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
    return apiClient.get<TeacherSchedule[]>(
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
    return apiClient.post<PerformanceReport>(
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
    return apiClient.get<PerformanceReport[]>(
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
    return apiClient.get<PerformanceReport[]>(
      `${this.managementPath}/performance-reports/period`,
      { params: { startDate, endDate } }
    );
  }

  // ==================== Notifications ====================

  /**
   * Send assignment notification
   */
  async sendAssignmentNotification(assignmentId: number): Promise<ApiResponse> {
    return apiClient.post<ApiResponse>(
      `${this.managementPath}/notifications/assignment/${assignmentId}`
    );
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(): Promise<any[]> {
    return apiClient.get<any[]>(
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
    return apiClient.get<any[]>(`${this.managementPath}/audit-logs`, {
      params,
    });
  }

  // ==================== Dashboard ====================

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    return apiClient.get<DashboardOverview>(
      `${this.managementPath}/dashboard/overview`
    );
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(): Promise<PerformanceSummary> {
    return apiClient.get<PerformanceSummary>(
      `${this.managementPath}/dashboard/performance-summary`
    );
  }

  /**
   * Health check for management service
   */
  async healthCheck(): Promise<ApiResponse> {
    return apiClient.get<ApiResponse>(`${this.managementPath}/health`);
  }
}

// Export singleton instance
export const teacherService = new TeacherService();


