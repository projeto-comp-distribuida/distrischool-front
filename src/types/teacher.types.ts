// Teacher Management Service Types

export type TeacherStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Teacher {
  id: number;
  name: string;
  fullName?: string; // Added to support service usage
  email: string;     // Added to support service usage
  employeeId: string;
  qualification: string;
  contact: string;
  status?: TeacherStatus;
  hireDate?: string;
  subjects?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeacherRequest {
  name: string;
  fullName?: string; // Added to support service usage
  email: string;     // Added to support service usage
  employeeId: string;
  qualification: string;
  contact: string;
  status?: TeacherStatus;
  hireDate?: string;
}

export interface UpdateTeacherRequest extends CreateTeacherRequest { }

export interface TeacherAssignment {
  id: number;
  teacherId: number;
  subjectId: number;
  classGroupId: number;
  startDate: string;
  endDate: string;
  workloadHours: number;
  createdAt: string;
}

export interface CreateAssignmentRequest {
  teacherId: number;
  subjectId: number;
  classGroupId: number;
  startDate: string;
  endDate: string;
  workloadHours: number;
}

export interface TeacherSchedule {
  id: number;
  teacherId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subjectId: number;
  classGroupId: number;
  academicYear: number;
}

export interface PerformanceReport {
  id: number;
  teacherId: number;
  startDate: string;
  endDate: string;
  rating?: number;
  comments?: string;
  generatedAt: string;
}

export interface DashboardOverview {
  totalTeachers: number;
  activeTeachers: number;
  inactiveTeachers: number;
  onLeaveTeachers: number;
  totalAssignments: number;
  upcomingSchedules: number;
}

export interface PerformanceSummary {
  averageRating: number;
  totalReports: number;
  highPerformers: number;
  needsImprovement: number;
}


