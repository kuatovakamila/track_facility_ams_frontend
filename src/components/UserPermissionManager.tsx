import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { SYSTEM_PERMISSIONS, PERMISSION_CATEGORIES } from '../data/rolesConfig';
import type { Permission, PermissionCategory } from '../types';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface UserPermissionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, permissions: string[]) => Promise<void>;
  user: User | null;
  userPermissions: string[];
}

const UserPermissionManager = ({ 
  isOpen, 
  onClose, 
  onSave, 
  user, 
  userPermissions 
}: UserPermissionManagerProps) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PermissionCategory>('users');

  // Инициализация выбранных разрешений
  useEffect(() => {
    if (isOpen && userPermissions) {
      setSelectedPermissions([...userPermissions]);
      setError(null);
    }
  }, [isOpen, userPermissions]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await onSave(user.id, selectedPermissions);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при сохранении разрешений');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionsByCategory = (category: PermissionCategory) => {
    return SYSTEM_PERMISSIONS.filter(permission => permission.category === category);
  };

  const getCategoryPermissionCount = (category: PermissionCategory) => {
    const categoryPermissions = getPermissionsByCategory(category);
    const selectedCount = categoryPermissions.filter(p => selectedPermissions.includes(p.id)).length;
    return { selected: selectedCount, total: categoryPermissions.length };
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Управление разрешениями</h2>
            <p className="text-sm text-gray-500 mt-1">
              {user.first_name} {user.last_name} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Боковая панель с категориями */}
          <div className="w-64 border-r border-gray-200 bg-gray-50">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Категории разрешений</h3>
              <div className="space-y-1">
                {Object.entries(PERMISSION_CATEGORIES).map(([categoryId, categoryInfo]) => {
                  const { selected, total } = getCategoryPermissionCount(categoryId as PermissionCategory);
                  return (
                    <button
                      key={categoryId}
                      onClick={() => setActiveCategory(categoryId as PermissionCategory)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        activeCategory === categoryId
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{categoryInfo.name}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                          {selected}/{total}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{categoryInfo.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Основная область с разрешениями */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {PERMISSION_CATEGORIES[activeCategory].name}
                </h3>
                <p className="text-sm text-gray-500">
                  {PERMISSION_CATEGORIES[activeCategory].description}
                </p>
              </div>

              <div className="space-y-3">
                {getPermissionsByCategory(activeCategory).map((permission) => {
                  const isSelected = selectedPermissions.includes(permission.id);
                  return (
                    <div
                      key={permission.id}
                      className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePermissionToggle(permission.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{permission.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Ресурс: {permission.resource}
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Действие: {permission.action}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {getPermissionsByCategory(activeCategory).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Нет доступных разрешений в этой категории</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Нижняя панель с кнопками */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Выбрано разрешений: {selectedPermissions.length} из {SYSTEM_PERMISSIONS.length}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Сохранение...' : 'Сохранить разрешения'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPermissionManager;

