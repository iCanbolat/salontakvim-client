/**
 * User Types
 * Matches backend user schema
 */

export type UserRole = "admin" | "staff" | "customer";
export type PaymentStatus = "freemium" | "paid";
export type AuthProvider = "local" | "google" | "facebook" | "apple";

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string;
  role: UserRole;
  paymentStatus: PaymentStatus;
  authProvider: AuthProvider;
  providerId?: string;
  avatar: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  customerNumber?: number; // For easy customer search
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    paymentStatus: PaymentStatus;
    avatar: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
