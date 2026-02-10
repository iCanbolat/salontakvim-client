/**
 * User Types
 * Matches backend user schema
 */

export type UserRole = "admin" | "manager" | "staff" | "customer";
export type PaymentStatus = "freemium" | "paid";
export type AuthProvider = "local" | "google" | "facebook" | "apple";

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string;
  role: UserRole;
  authProvider: AuthProvider;
  providerId?: string;
  avatar: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  customerNumber?: number; // For easy customer search
  // Manager/Staff specific fields
  locationId?: string | null;
  storeId?: string | null;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    avatar: string | null;
  };
  accessToken: string;
  refreshToken: string;
  needsOnboarding?: boolean;
}

export interface MeResponse {
  user: User;
  hasStore: boolean;
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
  storeName: string;
  storeSlug?: string;
  createStaffProfile?: boolean;
  staffTitle?: string;
  staffBio?: string;
  staffIsVisible?: boolean;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
