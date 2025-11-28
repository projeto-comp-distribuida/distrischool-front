// Evaluation Types
// Note: Evaluation endpoints may not exist in the API
// This structure allows for local evaluation management or future API integration

export interface Evaluation {
  id: number;
  name: string;
  type: EvaluationType;
  description?: string;
  classId: number;
  subjectId: number;
  academicYear: number;
  academicSemester: number;
  maxGrade: number; // Usually 10.0
  weight?: number; // Weight for calculating averages
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export enum EvaluationType {
  EXAM = "EXAM", // Prova
  QUIZ = "QUIZ", // Quiz
  ASSIGNMENT = "ASSIGNMENT", // Trabalho
  PROJECT = "PROJECT", // Projeto
  PRESENTATION = "PRESENTATION", // Apresentação
  PARTICIPATION = "PARTICIPATION", // Participação
  FINAL = "FINAL", // Prova Final
  OTHER = "OTHER" // Outro
}

export interface CreateEvaluationRequest {
  name: string;
  type: EvaluationType;
  description?: string;
  classId: number;
  subjectId: number;
  academicYear: number;
  academicSemester: number;
  maxGrade?: number;
  weight?: number;
}

export interface UpdateEvaluationRequest extends Partial<CreateEvaluationRequest> {}

export interface EvaluationFilters {
  classId?: number;
  subjectId?: number;
  academicYear?: number;
  academicSemester?: number;
  type?: EvaluationType;
  page?: number;
  size?: number;
}


