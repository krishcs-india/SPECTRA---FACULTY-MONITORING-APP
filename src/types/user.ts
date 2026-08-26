export type UserRole = 'ADMIN' | 'HOD' | 'FACULTY';
export type HodType = 'HOD' | 'AHOD' | null;

export interface KalyaniUser {
  uid: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName?: string;
  designation: string; // e.g. "Professor", "Associate Professor", "Assistant Professor", "DA Madam"
  role: UserRole;
  hodType?: HodType;
  active: boolean;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: KalyaniUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
