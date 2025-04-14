export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  date_joined: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  description: string;
}

export interface RolePermission {
  id: number;
  role: number;
  role_name: string;
  permission: number;
  permission_name: string;
}

export interface UserRole {
  id: number;
  user: number;
  username: string;
  role: number;
  role_name: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PaginationParams {
  page: number;
  page_size: number;
}
