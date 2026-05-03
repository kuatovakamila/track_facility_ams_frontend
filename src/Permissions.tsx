import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, KeyIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Layout from './components/Layout';
import PermissionModal from './components/PermissionModal';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { usePermissions } from './hooks/usePermissions';
import { useRoles } from './hooks/useRoles';
import type { Permission, PermissionCreate, PermissionUpdate, PermissionCategory } from './types';
import { PERMISSION_CATEGORIES, PERMISSION_ACTIONS } from './data/rolesConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Permissions = () => {
  const { permissions, loading, error, createPermission, updatePermission, deletePermission, refreshPermissions } = usePermissions();
  const { roles } = useRoles();
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PermissionCategory | 'all'>('all');

  const handleCreatePermission = () => { setSelectedPermission(null); setModalMode('create'); setIsModalOpen(true); };
  const handleEditPermission = (permission: Permission) => { setSelectedPermission(permission); setModalMode('edit'); setIsModalOpen(true); };

  const handleDeletePermission = async (permissionId: string) => {
    try { await deletePermission(permissionId); setDeleteConfirm(null); }
    catch (error) { console.error('Error deleting permission:', error); }
  };

  const handleSavePermission = async (permissionData: PermissionCreate | PermissionUpdate) => {
    if (modalMode === 'create') await createPermission(permissionData as PermissionCreate);
    else if (selectedPermission) await updatePermission(selectedPermission.id, permissionData as PermissionUpdate);
  };

  const getRolesUsingPermission = (permissionId: string) => roles.filter(role => role.permissions.includes(permissionId));

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const permissionsByCategory = Object.keys(PERMISSION_CATEGORIES).reduce((acc, category) => {
    acc[category] = permissions.filter(p => p.category === category).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <Layout title="Разрешения"><SkeletonLoader /></Layout>;
  if (error) return <Layout title="Разрешения"><ErrorState message={error} onRetry={refreshPermissions} /></Layout>;

  return (
    <Layout title="Разрешения">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление разрешениями</h1>
            <p className="mt-1 text-sm text-gray-500">Просматривайте и управляйте разрешениями системы</p>
          </div>
          <Button onClick={handleCreatePermission}>
            <PlusIcon className="w-4 h-4" /> Создать разрешение
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryInfo]) => (
            <Card key={category}>
              <CardContent className="p-4 text-center">
                <div className="p-2 bg-blue-100 rounded-lg mx-auto w-fit mb-2">
                  <KeyIcon className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-gray-500">{categoryInfo.name}</p>
                <p className="text-lg font-bold text-gray-900">{permissionsByCategory[category] || 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input type="text" placeholder="Поиск разрешений..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <div className="sm:w-48">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as PermissionCategory | 'all')} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring bg-background">
                  <option value="all">Все категории</option>
                  {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => <option key={key} value={key}>{category.name}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Разрешения системы</h2>
              <span className="text-sm text-gray-500">Показано {filteredPermissions.length} из {permissions.length}</span>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-200">
            {filteredPermissions.length === 0 ? (
              <div className="p-8 text-center">
                <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">{searchQuery || selectedCategory !== 'all' ? 'Разрешения не найдены по заданным критериям' : 'Разрешения не найдены'}</p>
              </div>
            ) : (
              filteredPermissions.map((permission) => {
                const rolesUsing = getRolesUsingPermission(permission.id);
                const categoryInfo = PERMISSION_CATEGORIES[permission.category as keyof typeof PERMISSION_CATEGORIES];
                const actionInfo = PERMISSION_ACTIONS[permission.action as keyof typeof PERMISSION_ACTIONS];
                return (
                  <div key={permission.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-gray-900">{permission.name}</h3>
                          <Badge variant="info">{categoryInfo?.name}</Badge>
                          <Badge variant="success">{actionInfo?.name}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{permission.description}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{permission.id}</code>
                          <span className="mx-2">•</span>
                          <span>Ресурс: {permission.resource}</span>
                        </div>
                        {rolesUsing.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Используется в ролях:</p>
                            <div className="flex flex-wrap gap-1">
                              {rolesUsing.map((role) => <Badge key={role.id} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{role.name}</Badge>)}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Button variant="ghost" size="icon" onClick={() => handleEditPermission(permission)} title="Редактировать разрешение"><PencilIcon className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(permission.id)} title="Удалить разрешение" disabled={rolesUsing.length > 0} className="text-gray-400 hover:text-red-600 hover:bg-red-50"><TrashIcon className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <PermissionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePermission} permission={selectedPermission} title={modalMode === 'create' ? 'Создать разрешение' : 'Редактировать разрешение'} />

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-full"><ExclamationTriangleIcon className="w-5 h-5 text-red-600" /></div>
              Удалить разрешение
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-6">Вы уверены, что хотите удалить это разрешение? Это действие нельзя отменить.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeletePermission(deleteConfirm)}>Удалить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Permissions;
