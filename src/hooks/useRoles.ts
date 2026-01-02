import { useState, useEffect, useCallback } from 'react';
import { rolesApi } from '../services/api';
import type { Role, RoleCreate, RoleUpdate, AssignRoleRequest } from '../types';

interface UseRolesState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

interface UseRolesReturn extends UseRolesState {
  refreshRoles: () => Promise<void>;
  createRole: (roleData: RoleCreate) => Promise<Role>;
  updateRole: (roleId: string, roleData: RoleUpdate) => Promise<Role>;
  deleteRole: (roleId: string) => Promise<void>;
  assignRole: (request: AssignRoleRequest) => Promise<void>;
  getRoleUsers: (roleId: string) => Promise<any[]>;
}

export const useRoles = (): UseRolesReturn => {
  const [state, setState] = useState<UseRolesState>({
    roles: [],
    loading: true,
    error: null
  });

  const refreshRoles = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const roles = await rolesApi.getRoles();
      setState(prev => ({ ...prev, roles, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при загрузке ролей';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, []);

  const createRole = useCallback(async (roleData: RoleCreate): Promise<Role> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const newRole = await rolesApi.createRole(roleData);
      setState(prev => ({ 
        ...prev, 
        roles: [...prev.roles, newRole] 
      }));
      return newRole;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при создании роли';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const updateRole = useCallback(async (roleId: string, roleData: RoleUpdate): Promise<Role> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const updatedRole = await rolesApi.updateRole(roleId, roleData);
      setState(prev => ({
        ...prev,
        roles: prev.roles.map(role => 
          role.id === roleId ? updatedRole : role
        )
      }));
      return updatedRole;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при обновлении роли';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const deleteRole = useCallback(async (roleId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await rolesApi.deleteRole(roleId);
      setState(prev => ({
        ...prev,
        roles: prev.roles.filter(role => role.id !== roleId)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при удалении роли';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const assignRole = useCallback(async (request: AssignRoleRequest): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await rolesApi.assignRole(request);
      // Обновляем счетчики пользователей в ролях
      await refreshRoles();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при назначении роли';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [refreshRoles]);

  const getRoleUsers = useCallback(async (roleId: string): Promise<any[]> => {
    try {
      return await rolesApi.getRoleUsers(roleId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении пользователей роли';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Загружаем роли при монтировании компонента
  useEffect(() => {
    refreshRoles();
  }, [refreshRoles]);

  return {
    ...state,
    refreshRoles,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    getRoleUsers
  };
};

// Хук для получения конкретной роли
export const useRole = (roleId: string | null) => {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roleId) {
      setRole(null);
      return;
    }

    const fetchRole = async () => {
      try {
        setLoading(true);
        setError(null);
        const roleData = await rolesApi.getRole(roleId);
        setRole(roleData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ошибка при загрузке роли';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [roleId]);

  return { role, loading, error };
};

