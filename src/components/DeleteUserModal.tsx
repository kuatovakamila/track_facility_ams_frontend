import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState<'deactivate' | 'confirm-delete'>('deactivate');

  useEffect(() => {
    if (isOpen) {
      setStep('deactivate');
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

  return (
    <Dialog open={isOpen && !!user} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{step === 'deactivate' ? 'Управление пользователем' : 'Подтверждение удаления'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {user && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {user.first_name[0]}{user.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">Статус: {user.is_active ? 'Активен' : 'Деактивирован'}</p>
                </div>
              </div>
            </div>
          )}

          {step === 'deactivate' && (
            <>
              <div>
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">Деактивировать пользователя (рекомендуется)</h3>
                    <p className="text-sm text-gray-600 mb-3">Пользователь не сможет войти в систему, но все его данные будут сохранены.</p>
                    <Button
                      onClick={handleDeactivate}
                      disabled={loading || !user?.is_active}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      {loading ? 'Деактивация...' : !user?.is_active ? 'Уже деактивирован' : 'Деактивировать пользователя'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200" />

              <div className="text-center">
                <button onClick={() => setStep('confirm-delete')} disabled={loading} className="text-xs text-gray-400 hover:text-red-600 transition-colors underline">
                  Удалить пользователя навсегда
                </button>
              </div>

              <Button variant="outline" onClick={onClose} disabled={loading} className="w-full">Отмена</Button>
            </>
          )}

          {step === 'confirm-delete' && (
            <>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-red-900 mb-2">Внимание! Необратимое действие</h3>
                  <div className="text-sm text-red-700 space-y-1">
                    <p>• Пользователь будет удален навсегда</p>
                    <p>• Все связанные данные будут потеряны</p>
                    <p>• Это действие нельзя отменить</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Для подтверждения введите: <span className="font-bold">Подтверждаю</span></Label>
                <Input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => { setConfirmationText(e.target.value); if (error) setError(null); }}
                  placeholder="Подтверждаю"
                  disabled={loading}
                  className="border-red-300 focus-visible:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep('deactivate'); setConfirmationText(''); setError(null); }} disabled={loading} className="flex-1">Назад</Button>
                <Button variant="destructive" onClick={handleHardDelete} disabled={loading || confirmationText !== 'Подтверждаю'} className="flex-1">
                  {loading ? 'Удаление...' : 'Удалить навсегда'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserModal;
