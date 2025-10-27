// Student Management Service Types

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';

export interface Student {
  id: number;
  registrationNumber: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  course: string;
  semester: number;
  enrollmentDate: string;
  status: StudentStatus;
  
  // Address
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZipcode: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateStudentRequest {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  registrationNumber?: string;
  course: string;
  semester: number;
  enrollmentDate: string;
  status: StudentStatus;
  notes?: string;
}

export interface UpdateStudentRequest extends CreateStudentRequest {}

export interface StudentSearchParams {
  name?: string;
  course?: string;
  semester?: number;
  status?: StudentStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'ASC' | 'DESC';
}

export interface StudentStatistics {
  total: number;
  active: number;
  inactive: number;
  graduated: number;
  suspended: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}


