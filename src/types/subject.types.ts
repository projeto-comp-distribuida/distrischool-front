export interface Subject {
    id: number;
    name: string;
    code: string;
    workloadHours: number;
    description: string;
    academicCenterId: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateSubjectRequest {
    name: string;
    code: string;
    workloadHours: number;
    description: string;
    academicCenterId: number;
}

export interface UpdateSubjectRequest extends Partial<CreateSubjectRequest> { }
