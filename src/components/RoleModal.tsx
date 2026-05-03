import { useState, useEffect } from 'react';
import type { Role, RoleCreate, RoleUpdate, Permission } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSION_CATEGORIES } from '../data/rolesConfig';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: RoleCreate | RoleUpdate) => Promise<void>;
  role?: Role | null;
  title: string;
}

const RoleModal = ({ isOpen, onClose, onSave, role, title }: RoleModalProps) => {
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) setFormData({ name: role.name, description: role.description, permissions: [...role.permissions] });
    else setFormData({ name: '', description: '', permissions: [] });
    setError(null);
  }, [role, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Название роли обязательно'); return; }
    if (!formData.description.trim()) { setError('Описание роли обязательно'); return; }
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
      permissions: prev.permissions.includes(permissionId) ? prev.permissions.filter(id => id !== permissionId) : [...prev.permissions, permissionId]
    }));
  };

  const handleSelectAllInCategory = (categoryPermissions: Permission[]) => {
    const ids = categoryPermissions.map(p => p.id);
    const allSelected = ids.every(id => formData.permissions.includes(id));
    setFormData(prev => ({
      ...prev,
      permissions: allSelected ? prev.permissions.filter(id => !ids.includes(id)) : [...new Set([...prev.permissions, ...ids])]
    }));
  };

  const permissionsByCategory = Object.keys(PERMISSION_CATEGORIES).reduce((acc, category) => {
    acc[category] = permissions.filter(p => p.category === category);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <ScrollArea className="flex-1 max-h-[calc(90vh-200px)]">
            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label>Название роли *</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Введите название роли"
                    disabled={role?.is_system}
                  />
                  {role?.is_system && <p className="text-xs text-muted-foreground">Системные роли нельзя переименовывать</p>}
                </div>
                <div className="space-y-1">
                  <Label>Описание *</Label>
                  <Input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Введите описание роли"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Разрешения</h3>
                {permissionsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
                        <div key={category} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{categoryInfo.name}</h4>
                              <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectAllInCategory(categoryPermissions)}
                              className={allSelected ? 'bg-blue-50 text-blue-700 border-blue-200' : someSelected ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                            >
                              {allSelected ? 'Убрать все' : 'Выбрать все'}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryPermissions.map((permission) => (
                              <label key={permission.id} className="flex items-start gap-3 p-2 hover:bg-muted rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(permission.id)}
                                  onChange={() => handlePermissionToggle(permission.id)}
                                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                                  <p className="text-xs text-muted-foreground">{permission.description}</p>
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
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 p-6 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
            <Button type="submit" disabled={loading || permissionsLoading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleModal;
