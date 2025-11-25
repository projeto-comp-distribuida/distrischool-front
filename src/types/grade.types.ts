export type GradeStatus = "Aprovado" | "Em recuperação" | "Requer atenção";

export interface Grade {
    id: number;
    studentId: number;
    studentName?: string;
    subjectId: number;
    subjectName?: string;
    assessment: string;
    grade: number;
    status: GradeStatus;
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
    status: GradeStatus;
    feedback: string;
    lastUpdated: string;
}


