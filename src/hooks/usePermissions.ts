import { useState, useEffect, useCallback } from 'react';
import { permissionsApi } from '../services/api';
import type { Permission, PermissionCreate, PermissionUpdate, PermissionCategory } from '../types';

interface UsePermissionsState {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

interface UsePermissionsReturn extends UsePermissionsState {
  refreshPermissions: () => Promise<void>;
  createPermission: (permissionData: PermissionCreate) => Promise<Permission>;
  updatePermission: (permissionId: string, permissionData: PermissionUpdate) => Promise<Permission>;
  deletePermission: (permissionId: string) => Promise<void>;
  getPermissionsByCategory: (category: PermissionCategory) => Permission[];
  getRolePermissions: (roleId: string) => Promise<Permission[]>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [state, setState] = useState<UsePermissionsState>({
    permissions: [],
    loading: true,
    error: null
  });

  const refreshPermissions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const permissions = await permissionsApi.getPermissions();
      setState(prev => ({ ...prev, permissions, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при загрузке разрешений';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, []);

  const createPermission = useCallback(async (permissionData: PermissionCreate): Promise<Permission> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const newPermission = await permissionsApi.createPermission(permissionData);
      setState(prev => ({ 
        ...prev, 
        permissions: [...prev.permissions, newPermission] 
      }));
      return newPermission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при создании разрешения';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const updatePermission = useCallback(async (permissionId: string, permissionData: PermissionUpdate): Promise<Permission> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const updatedPermission = await permissionsApi.updatePermission(permissionId, permissionData);
      setState(prev => ({
        ...prev,
        permissions: prev.permissions.map(permission => 
          permission.id === permissionId ? updatedPermission : permission
        )
      }));
      return updatedPermission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при обновлении разрешения';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const deletePermission = useCallback(async (permissionId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await permissionsApi.deletePermission(permissionId);
      setState(prev => ({
        ...prev,
        permissions: prev.permissions.filter(permission => permission.id !== permissionId)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при удалении разрешения';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const getPermissionsByCategory = useCallback((category: PermissionCategory): Permission[] => {
    return state.permissions.filter(permission => permission.category === category);
  }, [state.permissions]);

  const getRolePermissions = useCallback(async (roleId: string): Promise<Permission[]> => {
    try {
      return await permissionsApi.getRolePermissions(roleId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении разрешений роли';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Загружаем разрешения при монтировании компонента
  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  return {
    ...state,
    refreshPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    getPermissionsByCategory,
    getRolePermissions
  };
};

// Хук для получения конкретного разрешения
export const usePermission = (permissionId: string | null) => {
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!permissionId) {
      setPermission(null);
      return;
    }

    const fetchPermission = async () => {
      try {
        setLoading(true);
        setError(null);
        const permissionData = await permissionsApi.getPermission(permissionId);
        setPermission(permissionData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ошибка при загрузке разрешения';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPermission();
  }, [permissionId]);

  return { permission, loading, error };
};

// Хук для получения разрешений по категории
export const usePermissionsByCategory = (category: PermissionCategory | null) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) {
      setPermissions([]);
      return;
    }

    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const permissionsData = await permissionsApi.getPermissionsByCategory(category);
        setPermissions(permissionsData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ошибка при загрузке разрешений';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [category]);

  return { permissions, loading, error };
};

