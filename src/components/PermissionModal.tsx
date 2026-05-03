import { useState, useEffect } from 'react';
import type { Permission, PermissionCreate, PermissionUpdate, PermissionCategory, PermissionAction } from '../types';
import { PERMISSION_CATEGORIES, PERMISSION_ACTIONS } from '../data/rolesConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (permissionData: PermissionCreate | PermissionUpdate) => Promise<void>;
  permission?: Permission | null;
  title: string;
}

const PermissionModal = ({ isOpen, onClose, onSave, permission, title }: PermissionModalProps) => {
  const [formData, setFormData] = useState({ name: '', description: '', category: 'users' as PermissionCategory, resource: '', action: 'read' as PermissionAction });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (permission) setFormData({ name: permission.name, description: permission.description, category: permission.category as PermissionCategory, resource: permission.resource, action: permission.action as PermissionAction });
    else setFormData({ name: '', description: '', category: 'users', resource: '', action: 'read' });
    setError(null);
  }, [permission, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Название разрешения обязательно'); return; }
    if (!formData.description.trim()) { setError('Описание разрешения обязательно'); return; }
    if (!formData.resource.trim()) { setError('Ресурс обязателен'); return; }
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

  const handleInputChange = (field: keyof typeof formData, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>}

          <div className="space-y-1">
            <Label>Название разрешения *</Label>
            <Input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Например: Просмотр пользователей" />
          </div>

          <div className="space-y-1">
            <Label>Описание *</Label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-background"
              placeholder="Подробное описание того, что позволяет это разрешение"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <Label>Категория *</Label>
              <select value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring bg-background">
                {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => <option key={key} value={key}>{category.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Действие *</Label>
              <select value={formData.action} onChange={(e) => handleInputChange('action', e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring bg-background">
                {Object.entries(PERMISSION_ACTIONS).map(([key, action]) => <option key={key} value={key}>{action.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Ресурс *</Label>
            <Input type="text" value={formData.resource} onChange={(e) => handleInputChange('resource', e.target.value)} placeholder="Например: users, cameras, incidents" />
            <p className="text-xs text-muted-foreground">Системное название ресурса (обычно на английском)</p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-1">
            <Label>ID разрешения (генерируется автоматически)</Label>
            <code className="text-sm text-muted-foreground bg-background px-2 py-1 rounded border block">
              {formData.resource && formData.action ? `${formData.resource}.${formData.action}` : 'resource.action'}
            </code>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionModal;
