import { useState, useEffect } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { rolesApi } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: { email: string; first_name: string; last_name: string; password: string; role: string; is_active: boolean }) => Promise<void>;
}

const CreateUserModal = ({ isOpen, onClose, onSave }: CreateUserModalProps) => {
  const [formData, setFormData] = useState({ email: '', first_name: '', last_name: '', password: '', confirmPassword: '', role: 'viewer', is_active: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (isOpen) {
      setFormData({ email: '', first_name: '', last_name: '', password: '', confirmPassword: '', role: 'viewer', is_active: true });
      setError(null);
    }
  }, [isOpen]);

  const validateForm = () => {
    if (!formData.email.trim()) { setError('Email обязателен'); return false; }
    if (!formData.email.includes('@')) { setError('Введите корректный email'); return false; }
    if (!formData.first_name.trim()) { setError('Имя обязательно'); return false; }
    if (!formData.last_name.trim()) { setError('Фамилия обязательна'); return false; }
    if (!formData.password) { setError('Пароль обязателен'); return false; }
    if (formData.password.length < 6) { setError('Пароль должен содержать минимум 6 символов'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Пароли не совпадают'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setError(null);
    try {
      await onSave({ email: formData.email.trim(), first_name: formData.first_name.trim(), last_name: formData.last_name.trim(), password: formData.password, role: formData.role, is_active: formData.is_active });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при создании пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать пользователя</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="create-email">Email *</Label>
            <Input id="create-email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="user@example.com" disabled={loading} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="create-first-name">Имя *</Label>
            <Input id="create-first-name" type="text" value={formData.first_name} onChange={(e) => handleInputChange('first_name', e.target.value)} placeholder="Иван" disabled={loading} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="create-last-name">Фамилия *</Label>
            <Input id="create-last-name" type="text" value={formData.last_name} onChange={(e) => handleInputChange('last_name', e.target.value)} placeholder="Иванов" disabled={loading} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="create-password">Пароль *</Label>
            <div className="relative">
              <Input id="create-password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Минимум 6 символов" disabled={loading} required className="pr-10" />
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} disabled={loading} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400">
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="create-confirm-password">Подтвердите пароль *</Label>
            <div className="relative">
              <Input id="create-confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => handleInputChange('confirmPassword', e.target.value)} placeholder="Повторите пароль" disabled={loading} required className="pr-10" />
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={loading} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400">
                {showConfirmPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="create-role">Роль</Label>
            <select id="create-role" value={formData.role} onChange={(e) => handleInputChange('role', e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-ring transition-colors bg-background" disabled={loading || rolesLoading}>
              {rolesLoading ? <option value="">Загрузка ролей...</option> : availableRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
            {!rolesLoading && <p className="text-xs text-muted-foreground">{availableRoles.find(r => r.id === formData.role)?.description || 'Описание роли'}</p>}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Активный пользователь</Label>
              <p className="text-xs text-muted-foreground">Активные пользователи могут входить в систему</p>
            </div>
            <button type="button" onClick={() => handleInputChange('is_active', !formData.is_active)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${formData.is_active ? 'bg-primary' : 'bg-muted-foreground/30'}`} disabled={loading}>
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1">Отмена</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Создание...' : 'Создать'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
