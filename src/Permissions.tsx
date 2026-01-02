import { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  KeyIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Layout from './components/Layout';
import PermissionModal from './components/PermissionModal';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { usePermissions } from './hooks/usePermissions';
import { useRoles } from './hooks/useRoles';
import type { Permission, PermissionCreate, PermissionUpdate, PermissionCategory } from './types';
import { PERMISSION_CATEGORIES, PERMISSION_ACTIONS } from './data/rolesConfig';

const Permissions = () => {
  const { permissions, loading, error, createPermission, updatePermission, deletePermission, refreshPermissions } = usePermissions();
  const { roles } = useRoles();
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PermissionCategory | 'all'>('all');

  const handleCreatePermission = () => {
    setSelectedPermission(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      await deletePermission(permissionId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting permission:', error);
    }
  };

  const handleSavePermission = async (permissionData: PermissionCreate | PermissionUpdate) => {
    if (modalMode === 'create') {
      await createPermission(permissionData as PermissionCreate);
    } else if (selectedPermission) {
      await updatePermission(selectedPermission.id, permissionData as PermissionUpdate);
    }
  };

  const getRolesUsingPermission = (permissionId: string) => {
    return roles.filter(role => role.permissions.includes(permissionId));
  };

  // Фильтрация разрешений
  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         permission.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Группировка по категориям для статистики
  const permissionsByCategory = Object.keys(PERMISSION_CATEGORIES).reduce((acc, category) => {
    acc[category] = permissions.filter(p => p.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <Layout title="Разрешения" breadcrumb="Управление разрешениями">
        <SkeletonLoader />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Разрешения" breadcrumb="Управление разрешениями">
        <ErrorState 
          message={error} 
          onRetry={refreshPermissions}
        />
      </Layout>
    );
  }

  return (
    <Layout title="Разрешения" breadcrumb="Управление разрешениями">
      <div className="space-y-6">
        {/* Заголовок и кнопка создания */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление разрешениями</h1>
            <p className="mt-1 text-sm text-gray-500">
              Просматривайте и управляйте разрешениями системы
            </p>
          </div>
          <button
            onClick={handleCreatePermission}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Создать разрешение
          </button>
        </div>

        {/* Статистика по категориям */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryInfo]) => (
            <div key={category} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="p-2 bg-blue-100 rounded-lg mx-auto w-fit mb-2">
                  <KeyIcon className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-gray-500">{categoryInfo.name}</p>
                <p className="text-lg font-bold text-gray-900">{permissionsByCategory[category] || 0}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск разрешений..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Фильтр по категории */}
            <div className="sm:w-48">
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as PermissionCategory | 'all')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Все категории</option>
                  {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Список разрешений */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                Разрешения системы
              </h2>
              <span className="text-sm text-gray-500">
                Показано {filteredPermissions.length} из {permissions.length}
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredPermissions.length === 0 ? (
              <div className="p-8 text-center">
                <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Разрешения не найдены по заданным критериям'
                    : 'Разрешения не найдены'
                  }
                </p>
              </div>
            ) : (
              filteredPermissions.map((permission) => {
                const rolesUsing = getRolesUsingPermission(permission.id);
                const categoryInfo = PERMISSION_CATEGORIES[permission.category as keyof typeof PERMISSION_CATEGORIES];
                const actionInfo = PERMISSION_ACTIONS[permission.action as keyof typeof PERMISSION_ACTIONS];
                
                return (
                  <div key={permission.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{permission.name}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {categoryInfo?.name}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {actionInfo?.name}
                          </span>
                        </div>
                        
                        <p className="mt-1 text-sm text-gray-500">{permission.description}</p>
                        
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                            {permission.id}
                          </code>
                          <span className="mx-2">•</span>
                          <span>Ресурс: {permission.resource}</span>
                        </div>

                        {/* Роли, использующие это разрешение */}
                        {rolesUsing.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">
                              Используется в ролях:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rolesUsing.map((role) => (
                                <span
                                  key={role.id}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700"
                                >
                                  {role.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditPermission(permission)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Редактировать разрешение"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => setDeleteConfirm(permission.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить разрешение"
                          disabled={rolesUsing.length > 0}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно создания/редактирования разрешения */}
      <PermissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePermission}
        permission={selectedPermission}
        title={modalMode === 'create' ? 'Создать разрешение' : 'Редактировать разрешение'}
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
                <h3 className="ml-3 text-lg font-medium text-gray-900">Удалить разрешение</h3>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                Вы уверены, что хотите удалить это разрешение? Это действие нельзя отменить.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleDeletePermission(deleteConfirm)}
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

export default Permissions;

