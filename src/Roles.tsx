import { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Layout from './components/Layout';
import RoleModal from './components/RoleModal';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useRoles } from './hooks/useRoles';
import { usePermissions } from './hooks/usePermissions';
import type { Role, RoleCreate, RoleUpdate } from './types';
import { PERMISSION_CATEGORIES } from './data/rolesConfig';

const Roles = () => {
  const { roles, loading, error, createRole, updateRole, deleteRole, refreshRoles } = useRoles();
  const { permissions } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const handleSaveRole = async (roleData: RoleCreate | RoleUpdate) => {
    if (modalMode === 'create') {
      await createRole(roleData as RoleCreate);
    } else if (selectedRole) {
      await updateRole(selectedRole.id, roleData as RoleUpdate);
    }
  };

  const getRolePermissionsByCategory = (role: Role) => {
    const rolePermissions = permissions.filter(p => role.permissions.includes(p.id));
    const categoryCounts = Object.keys(PERMISSION_CATEGORIES).reduce((acc, category) => {
      const categoryPermissions = rolePermissions.filter(p => p.category === category);
      const totalInCategory = permissions.filter(p => p.category === category).length;
      acc[category] = { count: categoryPermissions.length, total: totalInCategory };
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
    
    return categoryCounts;
  };

  if (loading) {
    return (
      <Layout title="Роли" breadcrumb="Управление ролями">
        <SkeletonLoader />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Роли" breadcrumb="Управление ролями">
        <ErrorState 
          message={error} 
          onRetry={refreshRoles}
        />
      </Layout>
    );
  }

  return (
    <Layout title="Роли" breadcrumb="Управление ролями">
      <div className="space-y-6">
        {/* Заголовок и кнопка создания */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление ролями</h1>
            <p className="mt-1 text-sm text-gray-500">
              Создавайте и управляйте ролями пользователей и их разрешениями
            </p>
          </div>
          <button
            onClick={handleCreateRole}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Создать роль
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Всего ролей</p>
                <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Системных ролей</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roles.filter(role => role.is_system).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Пользовательских ролей</p>
                <p className="text-2xl font-bold text-gray-900">
                  {roles.filter(role => !role.is_system).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Список ролей */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Роли системы</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {roles.map((role) => {
              const permissionsByCategory = getRolePermissionsByCategory(role);
              
              return (
                <div key={role.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                        {role.is_system && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Системная
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{role.description}</p>
                      
                      {/* Статистика разрешений по категориям */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(permissionsByCategory).map(([category, stats]) => {
                          if (stats.count === 0) return null;
                          const categoryInfo = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
                          return (
                            <span
                              key={category}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                              title={`${categoryInfo.name}: ${stats.count} из ${stats.total} разрешений`}
                            >
                              {categoryInfo.name}: {stats.count}/{stats.total}
                            </span>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        {role.user_count || 0} пользователей
                        <span className="mx-2">•</span>
                        {role.permissions.length} разрешений
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редактировать роль"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      
                      {!role.is_system && (
                        <button
                          onClick={() => setDeleteConfirm(role.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить роль"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Модальное окно создания/редактирования роли */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRole}
        role={selectedRole}
        title={modalMode === 'create' ? 'Создать роль' : 'Редактировать роль'}
      />

      {/* Подтверждение удаления */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setDeleteConfirm(null)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="ml-3 text-lg font-medium text-gray-900">Удалить роль</h3>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Вы уверены, что хотите удалить эту роль? Это действие нельзя отменить.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleDeleteRole(deleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Roles;

