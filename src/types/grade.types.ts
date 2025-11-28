// Grade Status Enum matching API
export enum GradeStatus {
  REGISTERED = "REGISTERED",
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  DISPUTED = "DISPUTED",
  CANCELLED = "CANCELLED"
}

// Grade Response DTO matching API structure
export interface GradeResponseDTO {
  id: number;
  studentId: number;
  teacherId: number;
  classId: number;
  evaluationId: number;
  gradeValue: number;
  gradeDate: string; // "YYYY-MM-DD"
  notes?: string;
  status: GradeStatus;
  isAutomatic: boolean;
  postedAt?: string; // "YYYY-MM-DDTHH:mm:ss"
  academicYear: number;
  academicSemester: number;
  createdAt: string; // "YYYY-MM-DDTHH:mm:ss"
  updatedAt: string; // "YYYY-MM-DDTHH:mm:ss"
  createdBy: string;
  updatedBy: string;
}

// Grade Request DTO for create/update
export interface GradeRequestDTO {
  studentId: number;
  teacherId: number;
  classId: number;
  evaluationId: number;
  gradeValue: number; // 0.0 to 10.0, max 2 decimals
  gradeDate: string; // "YYYY-MM-DD"
  notes?: string;
  status?: GradeStatus;
  isAutomatic?: boolean;
  academicYear: number; // minimum 2000
  academicSemester: number; // 1 or 2
}

// Class Grade Summary DTO
export interface ClassGradeSummaryDTO {
  classId: number;
  className: string;
  classCode: string;
  period: string;
  academicYear: string;
  totalStudents: number;
  studentsWithGrades: number;
  maxGradesPerStudent: number;
  classAverage: number;
  students: StudentClassGradeDTO[];
}

export interface StudentClassGradeDTO {
  studentId: number;
  average: number;
  grades: GradeSnapshotDTO[];
}

export interface GradeSnapshotDTO {
  gradeId: number;
  evaluationId: number;
  gradeValue: number;
  gradeDate: string; // "YYYY-MM-DD"
  academicYear: number;
  academicSemester: number;
}

// Legacy types for backward compatibility (will be removed after migration)
export type GradeStatusLegacy = "Aprovado" | "Em recuperação" | "Requer atenção";

export interface Grade {
  id: number;
  studentId: number;
  studentName?: string;
  subjectId: number;
  subjectName?: string;
  assessment: string;
  grade: number;
  status: GradeStatusLegacy;
  feedback?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGradeRequest {
  studentId: number;
  subjectId: number;
  assessment: string;
  grade: number;
  feedback?: string;
}

export interface UpdateGradeRequest {
  grade?: number;
  feedback?: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  assessment: string;
  grade: number;
  status: GradeStatusLegacy;
  feedback: string;
  lastUpdated: string;
}



