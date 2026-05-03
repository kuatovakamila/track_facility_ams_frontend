import { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { rolesApi } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: number, userData: { email?: string; first_name?: string; last_name?: string; password?: string; role?: string; is_active?: boolean }) => Promise<void>;
  user: User | null;
}

const EditUserModal = ({ isOpen, onClose, onSave, user }: EditUserModalProps) => {
  const [formData, setFormData] = useState({ email: '', first_name: '', last_name: '', password: '', confirmPassword: '', role: 'viewer', is_active: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    const loadRoles = async () => {
      if (isOpen) {
        setRolesLoading(true);
        try {
          const roles = await rolesApi.getAvailableRoles();
          setAvailableRoles(roles);
        } catch (error) {
          console.error('Failed to load roles:', error);
          setAvailableRoles([
            { id: 'viewer', name: 'Наблюдатель', description: 'Доступ только для просмотра' },
            { id: 'operator', name: 'Оператор', description: 'Доступ к мониторингу и управлению инцидентами' },
            { id: 'manager', name: 'Менеджер', description: 'Доступ к управлению пользователями и отчетам' },
            { id: 'admin', name: 'Администратор', description: 'Полный доступ ко всем функциям системы' }
          ]);
        } finally {
          setRolesLoading(false);
        }
      }
    };
    loadRoles();
  }, [isOpen]);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({ email: user.email, first_name: user.first_name, last_name: user.last_name, password: '', confirmPassword: '', role: user.role, is_active: user.is_active });
      setChangePassword(false);
      setError(null);
    }
  }, [user, isOpen]);

  const validateForm = () => {
    if (!formData.email.trim()) { setError('Email обязателен'); return false; }
    if (!formData.email.includes('@')) { setError('Введите корректный email'); return false; }
    if (!formData.first_name.trim()) { setError('Имя обязательно'); return false; }
    if (!formData.last_name.trim()) { setError('Фамилия обязательна'); return false; }
    if (changePassword) {
      if (!formData.password) { setError('Пароль обязателен'); return false; }
      if (formData.password.length < 6) { setError('Пароль должен содержать минимум 6 символов'); return false; }
      if (formData.password !== formData.confirmPassword) { setError('Пароли не совпадают'); return false; }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;
    setLoading(true);
    setError(null);
    try {
      const userData: any = { email: formData.email.trim(), first_name: formData.first_name.trim(), last_name: formData.last_name.trim(), role: formData.role, is_active: formData.is_active };
      if (changePassword && formData.password) userData.password = formData.password;
      await onSave(user.id, userData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при обновлении пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <Dialog open={isOpen && !!user} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать пользователя</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <Label>{formData.is_active ? 'Активный пользователь' : 'Деактивированный пользователь'}</Label>
                <p className="text-xs text-muted-foreground">{formData.is_active ? 'Пользователь может входить в систему' : 'Пользователь не может входить в систему'}</p>
              </div>
              <button type="button" onClick={() => handleInputChange('is_active', !formData.is_active)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${formData.is_active ? 'bg-green-600' : 'bg-red-400'}`} disabled={loading}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-email">Email *</Label>
            <Input id="edit-email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="user@example.com" disabled={loading} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-first-name">Имя *</Label>
            <Input id="edit-first-name" type="text" value={formData.first_name} onChange={(e) => handleInputChange('first_name', e.target.value)} placeholder="Иван" disabled={loading} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-last-name">Фамилия *</Label>
            <Input id="edit-last-name" type="text" value={formData.last_name} onChange={(e) => handleInputChange('last_name', e.target.value)} placeholder="Иванов" disabled={loading} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-role">Роль</Label>
            <select id="edit-role" value={formData.role} onChange={(e) => handleInputChange('role', e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring bg-background" disabled={loading || rolesLoading}>
              {rolesLoading ? <option value="">Загрузка ролей...</option> : availableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            {!rolesLoading && <p className="text-xs text-muted-foreground">{availableRoles.find(r => r.id === formData.role)?.description || 'Описание роли'}</p>}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label>Изменить пароль</Label>
              <button type="button" onClick={() => { setChangePassword(!changePassword); if (!changePassword) setFormData(prev => ({ ...prev, password: '', confirmPassword: '' })); }} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${changePassword ? 'bg-primary' : 'bg-muted-foreground/30'}`} disabled={loading}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${changePassword ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {changePassword && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-password">Новый пароль *</Label>
                  <div className="relative">
                    <Input id="edit-password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Минимум 6 символов" disabled={loading} required={changePassword} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} disabled={loading} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400">
                      {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-confirm-password">Подтвердите пароль *</Label>
                  <div className="relative">
                    <Input id="edit-confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} placeholder="Повторите пароль" disabled={loading} required={changePassword} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400">
                      {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">Отмена</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
