// Core data models for the AMS application

export interface Camera {
  id: number;
  location: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  roleDescription: string;
  age: string;
  hired: string;
}

export interface Incident {
  id: number;
  name: string;
  email: string;
  incidentType: string;
  details: string;
  isLate: boolean;
  time: string;
  date: string;
}

// New Event interfaces for the events API
export interface Event {
  id: number;
  event_type: string;
  location?: string | null;
  camera_id?: number | null;
  user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  event_type: string;
  location?: string | null;
  camera_id?: number | null;
  user_id?: number | null;
}

export interface EventUpdate {
  event_type?: string | null;
  location?: string | null;
  camera_id?: number | null;
  user_id?: number | null;
}

export interface EventType {
  name: string;
  description?: string | null;
}

export interface EventSummary {
  total_events: number;
  entrance_events: number;
  exit_events: number;
  events_by_type: object[];
}

// Extended Event interface for UI display (includes resolved user info)
export interface EventDisplay extends Event {
  user_name?: string;
  user_email?: string;
  camera_name?: string;
  time: string;
  date: string;
}

export interface AttendanceRecord {
  id: number;
  name: string;
  email: string;
  status: string;
  details: string;
  presence: boolean;
  time: string;
  date: string;
}

// File management types
export interface FileMetadata {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_by?: number | null;
  incident_id?: number | null;
  folder_id?: number | null;
  created_at: string;
  updated_at?: string;
}

export interface FileUploadResponse {
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  message: string;
}

export interface FileListItem extends FileMetadata {
  author?: string;
  size_formatted: string;
  type_display: string;
  actions?: 'view' | 'download' | 'delete';
}

export interface MenuItem {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
}

export interface LayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string;
}

export interface SettingsCard {
  id: string;
  title: string;
  description: string;
}

// Generic API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Chart data types for dashboard
export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number;
}

// Filter and search types
export interface FilterOptions {
  status?: 'active' | 'inactive' | 'all';
  role?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface SearchParams {
  query: string;
  filters?: FilterOptions;
  page?: number;
  limit?: number;
}

// Folder management types
export interface Folder {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  path: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface FolderTree extends Folder {
  file_count: number;
  children: FolderTree[];
}

export interface FolderWithFiles extends Folder {
  file_count: number;
}

export interface FolderStats {
  total_folders: number;
  total_files: number;
  total_size: number;
  depth: number;
}

export interface FolderCreate {
  name: string;
  description?: string | null;
  parent_id?: number | null;
}

export interface FolderUpdate {
  name?: string | null;
  description?: string | null;
  parent_id?: number | null;
}

export interface FolderMoveRequest {
  new_parent_id?: number | null;
}

// Navigation types
export interface BreadcrumbItem {
  id: number | null;
  name: string;
  path: string;
}

export interface FileSystemItem {
  id: number;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
  folder_id?: number | null;
  file_count?: number;
}

// Role and Permission Management Types - Backend API Compatible

// Backend API Permission Response
export interface PermissionResponse {
  id: number;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  is_system: boolean;
  created_at: string;
  updated_at: string | null;
}

// Backend API Role Response
export interface RoleResponse {
  id: number;
  name: string;
  description: string | null;
  parent_role_id: number | null;
  is_system: boolean;
  level: number;
  path: string;
  created_at: string;
  updated_at: string | null;
  permissions: PermissionResponse[];
}

// Backend API Create/Update Types
export interface PermissionCreate {
  name: string;
  description?: string | null;
  resource: string;
  action: string;
  is_system?: boolean;
}

export interface PermissionUpdate {
  name?: string | null;
  description?: string | null;
  is_system?: boolean | null;
}

export interface RoleCreate {
  name: string;
  description?: string | null;
  parent_role_id?: number | null;
  is_system?: boolean;
  permission_ids?: number[];
}

export interface RoleUpdate {
  name?: string | null;
  description?: string | null;
  parent_role_id?: number | null;
  is_system?: boolean | null;
  permission_ids?: number[];
}

// Frontend Compatible Types (for backward compatibility)
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Array of permission IDs
  is_system: boolean; // Whether this is a system-defined role
  created_at: string;
  updated_at: string;
  user_count?: number; // Number of users with this role
  parent_role_id?: string | null;
  level?: number;
  path?: string;
}

export interface UserRole {
  user_id: number;
  role_id: string;
  assigned_at: string;
  assigned_by?: number;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

// Extended User interface with role details
export interface UserWithRole extends User {
  role_details?: Role;
  permissions?: Permission[];
}

// Permission categories for organization
export type PermissionCategory = 
  | 'users' 
  | 'cameras' 
  | 'incidents' 
  | 'events' 
  | 'files' 
  | 'system' 
  | 'reports';

// Permission actions
export type PermissionAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'export' 
  | 'import' 
  | 'manage';

// Role assignment request
export interface AssignRoleRequest {
  user_id: number;
  role_id: string;
}
