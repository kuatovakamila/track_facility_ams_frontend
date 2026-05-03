import { useState, useEffect } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { SYSTEM_PERMISSIONS, PERMISSION_CATEGORIES } from '../data/rolesConfig';
import type { PermissionCategory } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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

const UserPermissionManager = ({ isOpen, onClose, onSave, user, userPermissions }: UserPermissionManagerProps) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<PermissionCategory>('users');

  useEffect(() => {
    if (isOpen && userPermissions) {
      setSelectedPermissions([...userPermissions]);
      setError(null);
    }
  }, [isOpen, userPermissions]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId) ? prev.filter(id => id !== permissionId) : [...prev, permissionId]
    );
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

  const getPermissionsByCategory = (category: PermissionCategory) =>
    SYSTEM_PERMISSIONS.filter(permission => permission.category === category);

  const getCategoryPermissionCount = (category: PermissionCategory) => {
    const categoryPermissions = getPermissionsByCategory(category);
    const selectedCount = categoryPermissions.filter(p => selectedPermissions.includes(p.id)).length;
    return { selected: selectedCount, total: categoryPermissions.length };
  };

  return (
    <Dialog open={isOpen && !!user} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Управление разрешениями</DialogTitle>
          {user && <p className="text-sm text-muted-foreground mt-1">{user.first_name} {user.last_name} ({user.email})</p>}
        </DialogHeader>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Category sidebar */}
          <div className="w-64 border-r bg-muted/30 flex-shrink-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Категории разрешений</p>
                <div className="space-y-1">
                  {Object.entries(PERMISSION_CATEGORIES).map(([categoryId, categoryInfo]) => {
                    const { selected, total } = getCategoryPermissionCount(categoryId as PermissionCategory);
                    return (
                      <button
                        key={categoryId}
                        onClick={() => setActiveCategory(categoryId as PermissionCategory)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${activeCategory === categoryId ? 'bg-blue-100 text-blue-900 border border-blue-200' : 'hover:bg-muted text-foreground'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{categoryInfo.name}</span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{selected}/{total}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{categoryInfo.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Permissions area */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-medium">{PERMISSION_CATEGORIES[activeCategory].name}</h3>
                <p className="text-sm text-muted-foreground">{PERMISSION_CATEGORIES[activeCategory].description}</p>
              </div>

              <div className="space-y-3">
                {getPermissionsByCategory(activeCategory).map((permission) => {
                  const isSelected = selectedPermissions.includes(permission.id);
                  return (
                    <div
                      key={permission.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${isSelected ? 'border-blue-200 bg-blue-50' : 'border-border hover:border-muted-foreground/30'}`}
                      onClick={() => handlePermissionToggle(permission.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-muted-foreground/40'}`}>
                          {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{permission.name}</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">{permission.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">Ресурс: {permission.resource}</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">Действие: {permission.action}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {getPermissionsByCategory(activeCategory).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Нет доступных разрешений в этой категории</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <Separator />
        <div className="p-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Выбрано разрешений: {selectedPermissions.length} из {SYSTEM_PERMISSIONS.length}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>Отмена</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить разрешения'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserPermissionManager;
