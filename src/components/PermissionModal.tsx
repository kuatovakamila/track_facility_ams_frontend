import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Permission, PermissionCreate, PermissionUpdate, PermissionCategory, PermissionAction } from '../types';
import { PERMISSION_CATEGORIES, PERMISSION_ACTIONS } from '../data/rolesConfig';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissionData: PermissionCreate | PermissionUpdate) => Promise<void>;
  permission?: Permission | null;
  title: string;
}

const PermissionModal = ({ isOpen, onClose, onSave, permission, title }: PermissionModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'users' as PermissionCategory,
    resource: '',
    action: 'read' as PermissionAction
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация формы при изменении разрешения
  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name,
        description: permission.description,
        category: permission.category as PermissionCategory,
        resource: permission.resource,
        action: permission.action as PermissionAction
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'users',
        resource: '',
        action: 'read'
      });
    }
    setError(null);
  }, [permission, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Название разрешения обязательно');
      return;
    }

    if (!formData.description.trim()) {
      setError('Описание разрешения обязательно');
      return;
    }

    if (!formData.resource.trim()) {
      setError('Ресурс обязателен');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при сохранении разрешения');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
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

            <div className="space-y-6">
              {/* Название */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название разрешения *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: Просмотр пользователей"
                />
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Подробное описание того, что позволяет это разрешение"
                />
              </div>

              {/* Категория и Действие */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
                      <option key={key} value={key}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Действие *
                  </label>
                  <select
                    value={formData.action}
                    onChange={(e) => handleInputChange('action', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(PERMISSION_ACTIONS).map(([key, action]) => (
                      <option key={key} value={key}>
                        {action.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ресурс */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ресурс *
                </label>
                <input
                  type="text"
                  value={formData.resource}
                  onChange={(e) => handleInputChange('resource', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: users, cameras, incidents"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Системное название ресурса (обычно на английском)
                </p>
              </div>

              {/* Предварительный просмотр ID */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID разрешения (генерируется автоматически)
                </label>
                <code className="text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                  {formData.resource && formData.action 
                    ? `${formData.resource}.${formData.action}`
                    : 'resource.action'
                  }
                </code>
              </div>
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
                disabled={loading}
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

export default PermissionModal;

