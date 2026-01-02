import { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeactivate: (userId: number) => Promise<void>;
  onDelete: (userId: number) => Promise<void>;
  user: User | null;
}

const DeleteUserModal = ({ isOpen, onClose, onDeactivate, onDelete, user }: DeleteUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHardDelete, setShowHardDelete] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState<'deactivate' | 'confirm-delete'>('deactivate');

  // Сброс состояния при открытии/закрытии модального окна
  useEffect(() => {
    if (isOpen) {
      setStep('deactivate');
      setShowHardDelete(false);
      setConfirmationText('');
      setError(null);
    }
  }, [isOpen]);

  const handleDeactivate = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await onDeactivate(user.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при деактивации пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleHardDelete = async () => {
    if (!user || confirmationText !== 'Подтверждаю') {
      setError('Введите "Подтверждаю" для подтверждения удаления');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onDelete(user.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при удалении пользователя');
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirmation = () => {
    setStep('confirm-delete');
    setShowHardDelete(true);
  };

  const goBackToDeactivate = () => {
    setStep('deactivate');
    setShowHardDelete(false);
    setConfirmationText('');
    setError(null);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'deactivate' ? 'Управление пользователем' : 'Подтверждение удаления'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Информация о пользователе */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {user.first_name[0]}{user.last_name[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-400">
                  Статус: {user.is_active ? 'Активен' : 'Деактивирован'}
                </p>
              </div>
            </div>
          </div>

          {step === 'deactivate' && (
            <>
              {/* Деактивация (рекомендуемое действие) */}
              <div className="mb-6">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      Деактивировать пользователя (рекомендуется)
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Пользователь не сможет войти в систему, но все его данные будут сохранены. 
                      Вы сможете активировать его позже.
                    </p>
                    <button
                      onClick={handleDeactivate}
                      className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading || !user.is_active}
                    >
                      {loading ? 'Деактивация...' : 
                       !user.is_active ? 'Уже деактивирован' : 'Деактивировать пользователя'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Разделитель */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Кнопка для показа опции удаления */}
              <div className="text-center">
                <button
                  onClick={showDeleteConfirmation}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors underline"
                  disabled={loading}
                >
                  Удалить пользователя навсегда
                </button>
              </div>
            </>
          )}

          {step === 'confirm-delete' && (
            <>
              {/* Предупреждение об удалении */}
              <div className="mb-6">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-900 mb-2">
                      Внимание! Необратимое действие
                    </h3>
                    <div className="text-sm text-red-700 space-y-1">
                      <p>• Пользователь будет удален навсегда</p>
                      <p>• Все связанные данные будут потеряны</p>
                      <p>• Это действие нельзя отменить</p>
                    </div>
                  </div>
                </div>

                {/* Поле подтверждения */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Для подтверждения введите: <span className="font-bold">Подтверждаю</span>
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => {
                      setConfirmationText(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Подтверждаю"
                    disabled={loading}
                  />
                </div>

                {/* Кнопки */}
                <div className="flex gap-3">
                  <button
                    onClick={goBackToDeactivate}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Назад
                  </button>
                  <button
                    onClick={handleHardDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || confirmationText !== 'Подтверждаю'}
                  >
                    {loading ? 'Удаление...' : 'Удалить навсегда'}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'deactivate' && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;

