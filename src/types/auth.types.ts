// Auth Service Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  documentNumber?: string;
  roles: UserRole[];
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string | number; // Can be string or number depending on backend
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  documentNumber?: string | null;
  roles: UserRole[];
  emailVerified?: boolean; // Optional - may not be returned by API
  active: boolean;
  createdAt: string;
  updatedAt: string;
  auth0Id?: string; // Auth0 integration
  lastLogin?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}


