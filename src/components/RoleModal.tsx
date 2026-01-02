import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Role, RoleCreate, RoleUpdate, Permission } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSION_CATEGORIES } from '../data/rolesConfig';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: RoleCreate | RoleUpdate) => Promise<void>;
  role?: Role | null;
  title: string;
}

const RoleModal = ({ isOpen, onClose, onSave, role, title }: RoleModalProps) => {
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация формы при изменении роли
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: [...role.permissions]
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
    setError(null);
  }, [role, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Название роли обязательно');
      return;
    }

    if (!formData.description.trim()) {
      setError('Описание роли обязательно');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при сохранении роли');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSelectAllInCategory = (categoryPermissions: Permission[]) => {
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryPermissionIds.every(id => formData.permissions.includes(id));
    
    if (allSelected) {
      // Убираем все разрешения категории
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => !categoryPermissionIds.includes(id))
      }));
    } else {
      // Добавляем все разрешения категории
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPermissionIds])]
      }));
    }
  };

  if (!isOpen) return null;

  // Группируем разрешения по категориям
  const permissionsByCategory = Object.keys(PERMISSION_CATEGORIES).reduce((acc, category) => {
    acc[category] = permissions.filter(p => p.category === category);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Содержимое */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Основная информация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название роли *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите название роли"
                  disabled={role?.is_system}
                />
                {role?.is_system && (
                  <p className="mt-1 text-xs text-gray-500">Системные роли нельзя переименовывать</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите описание роли"
                />
              </div>
            </div>

            {/* Разрешения */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Разрешения</h3>
              
              {permissionsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Загрузка разрешений...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                    if (categoryPermissions.length === 0) return null;
                    
                    const categoryInfo = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
                    const allSelected = categoryPermissions.every(p => formData.permissions.includes(p.id));
                    const someSelected = categoryPermissions.some(p => formData.permissions.includes(p.id));
                    
                    return (
                      <div key={category} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{categoryInfo.name}</h4>
                            <p className="text-sm text-gray-500">{categoryInfo.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectAllInCategory(categoryPermissions)}
                            className={`px-3 py-1 text-xs rounded-full transition-colors ${
                              allSelected
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : someSelected
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {allSelected ? 'Убрать все' : 'Выбрать все'}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryPermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                                <p className="text-xs text-gray-500">{permission.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || permissionsLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;

