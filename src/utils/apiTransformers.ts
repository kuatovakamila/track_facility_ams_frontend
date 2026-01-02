/**
 * API Data Transformation Utilities
 * 
 * This module provides transformation functions to convert between
 * the frontend data structures and backend API schemas.
 */

import type { 
  Permission, 
  Role, 
  PermissionResponse, 
  RoleResponse,
  PermissionCreate as BackendPermissionCreate,
  RoleCreate as BackendRoleCreate,
  PermissionUpdate as BackendPermissionUpdate,
  RoleUpdate as BackendRoleUpdate
} from '../types';

// Frontend create/update types for backward compatibility
interface PermissionCreate {
  name: string;
  description?: string;
  category: string;
  resource: string;
  action: string;
  is_system?: boolean;
}

interface RoleCreate {
  name: string;
  description?: string;
  permissions?: string[];
  is_system?: boolean;
  parent_role_id?: string;
}

interface PermissionUpdate {
  name?: string;
  description?: string;
  category?: string;
  resource?: string;
  action?: string;
  is_system?: boolean;
}

interface RoleUpdate {
  name?: string;
  description?: string;
  permissions?: string[];
  is_system?: boolean;
  parent_role_id?: string;
}

// Permission category mapping for backward compatibility
const RESOURCE_TO_CATEGORY_MAP: Record<string, string> = {
  'users': 'users',
  'cameras': 'cameras',
  'incidents': 'incidents',
  'events': 'events',
  'files': 'files',
  'system': 'system',
  'reports': 'reports',
  'roles': 'system',
  'permissions': 'system'
};

const CATEGORY_TO_RESOURCE_MAP: Record<string, string> = {
  'users': 'users',
  'cameras': 'cameras',
  'incidents': 'incidents',
  'events': 'events',
  'files': 'files',
  'system': 'system',
  'reports': 'reports'
};

/**
 * Transform backend PermissionResponse to frontend Permission
 */
export function transformPermissionFromBackend(backendPermission: PermissionResponse): Permission {
  return {
    id: backendPermission.id.toString(),
    name: backendPermission.name,
    description: backendPermission.description || '',
    category: RESOURCE_TO_CATEGORY_MAP[backendPermission.resource] || backendPermission.resource,
    resource: backendPermission.resource,
    action: backendPermission.action,
    is_system: backendPermission.is_system,
    created_at: backendPermission.created_at,
    updated_at: backendPermission.updated_at || undefined
  };
}

/**
 * Transform backend RoleResponse to frontend Role
 */
export function transformRoleFromBackend(backendRole: RoleResponse, userCount?: number): Role {
  // Extract permission IDs from the permissions array in the response
  const permissions = backendRole.permissions?.map(p => p.id.toString()) || [];
  
  return {
    id: backendRole.id.toString(),
    name: backendRole.name,
    description: backendRole.description || '',
    permissions,
    is_system: backendRole.is_system,
    created_at: backendRole.created_at,
    updated_at: backendRole.updated_at || backendRole.created_at,
    user_count: userCount,
    parent_role_id: backendRole.parent_role_id?.toString() || null,
    level: backendRole.level,
    path: backendRole.path
  };
}

/**
 * Transform frontend PermissionCreate to backend format
 */
export function transformPermissionCreateToBackend(frontendPermission: PermissionCreate): BackendPermissionCreate {
  return {
    name: frontendPermission.name,
    description: frontendPermission.description || null,
    resource: frontendPermission.resource || CATEGORY_TO_RESOURCE_MAP[frontendPermission.category] || frontendPermission.category,
    action: frontendPermission.action,
    is_system: frontendPermission.is_system || false
  };
}

/**
 * Transform frontend RoleCreate to backend format
 */
export function transformRoleCreateToBackend(frontendRole: RoleCreate): BackendRoleCreate {
  return {
    name: frontendRole.name,
    description: frontendRole.description || null,
    parent_role_id: frontendRole.parent_role_id ? parseInt(frontendRole.parent_role_id) : null,
    is_system: frontendRole.is_system || false,
    permission_ids: frontendRole.permissions?.map(id => parseInt(id)).filter(id => !isNaN(id)) || []
  };
}

/**
 * Transform frontend PermissionUpdate to backend format
 */
export function transformPermissionUpdateToBackend(frontendPermission: PermissionUpdate): BackendPermissionUpdate {
  return {
    name: frontendPermission.name || null,
    description: frontendPermission.description || null,
    is_system: frontendPermission.is_system || null
  };
}

/**
 * Transform frontend RoleUpdate to backend format
 */
export function transformRoleUpdateToBackend(frontendRole: RoleUpdate): BackendRoleUpdate {
  return {
    name: frontendRole.name || null,
    description: frontendRole.description || null,
    parent_role_id: frontendRole.parent_role_id ? parseInt(frontendRole.parent_role_id) : null,
    is_system: frontendRole.is_system || null,
    permission_ids: frontendRole.permissions?.map(id => parseInt(id)).filter(id => !isNaN(id)) || null
  };
}

/**
 * Transform array of backend permissions to frontend format
 */
export function transformPermissionsFromBackend(backendPermissions: PermissionResponse[]): Permission[] {
  return backendPermissions.map(transformPermissionFromBackend);
}

/**
 * Transform array of backend roles to frontend format
 */
export function transformRolesFromBackend(backendRoles: RoleResponse[], userCounts: Record<number, number> = {}): Role[] {
  return backendRoles.map(role => {
    const userCount = userCounts[role.id];
    return transformRoleFromBackend(role, userCount);
  });
}

/**
 * Get permission IDs from role permissions
 */
export function getPermissionIdsFromRole(role: Role): number[] {
  return role.permissions.map(id => parseInt(id)).filter(id => !isNaN(id));
}

/**
 * Convert string ID to number ID safely
 */
export function safeParseId(id: string): number {
  const parsed = parseInt(id);
  if (isNaN(parsed)) {
    throw new Error(`Invalid ID format: ${id}`);
  }
  return parsed;
}

/**
 * Convert number ID to string ID
 */
export function stringifyId(id: number): string {
  return id.toString();
}
