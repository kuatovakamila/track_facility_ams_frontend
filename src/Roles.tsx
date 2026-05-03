import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Layout from './components/Layout';
import RoleModal from './components/RoleModal';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useRoles } from './hooks/useRoles';
import { usePermissions } from './hooks/usePermissions';
import type { Role, RoleCreate, RoleUpdate } from './types';
import { PERMISSION_CATEGORIES } from './data/rolesConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Roles = () => {
  const { roles, loading, error, createRole, updateRole, deleteRole, refreshRoles } = useRoles();
  const { permissions } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreateRole = () => { setSelectedRole(null); setModalMode('create'); setIsModalOpen(true); };
  const handleEditRole = (role: Role) => { setSelectedRole(role); setModalMode('edit'); setIsModalOpen(true); };

  const handleDeleteRole = async (roleId: string) => {
    try { await deleteRole(roleId); setDeleteConfirm(null); }
    catch (error) { console.error('Error deleting role:', error); }
  };

  const handleSaveRole = async (roleData: RoleCreate | RoleUpdate) => {
    if (modalMode === 'create') await createRole(roleData as RoleCreate);
    else if (selectedRole) await updateRole(selectedRole.id, roleData as RoleUpdate);
  };

  const getRolePermissionsByCategory = (role: Role) => {
    const rolePermissions = permissions.filter(p => role.permissions.includes(p.id));
    return Object.keys(PERMISSION_CATEGORIES).reduce((acc, category) => {
      acc[category] = { count: rolePermissions.filter(p => p.category === category).length, total: permissions.filter(p => p.category === category).length };
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
  };

  if (loading) return <Layout title="Роли"><SkeletonLoader /></Layout>;
  if (error) return <Layout title="Роли"><ErrorState message={error} onRetry={refreshRoles} /></Layout>;

  return (
    <Layout title="Роли">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление ролями</h1>
            <p className="mt-1 text-sm text-gray-500">Создавайте и управляйте ролями пользователей и их разрешениями</p>
          </div>
          <Button onClick={handleCreateRole}>
            <PlusIcon className="w-4 h-4" /> Создать роль
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheckIcon, color: 'bg-blue-100 text-blue-600', label: 'Всего ролей', value: roles.length },
            { icon: UserGroupIcon, color: 'bg-green-100 text-green-600', label: 'Системных ролей', value: roles.filter(r => r.is_system).length },
            { icon: UserGroupIcon, color: 'bg-purple-100 text-purple-600', label: 'Пользовательских ролей', value: roles.filter(r => !r.is_system).length },
          ].map(({ icon: Icon, color, label, value }) => (
            <Card key={label}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${color.split(' ')[0]}`}>
                    <Icon className={`w-6 h-6 ${color.split(' ')[1]}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Роли системы</h2>
          </CardHeader>
          <div className="divide-y divide-gray-200">
            {roles.map((role) => {
              const permsByCategory = getRolePermissionsByCategory(role);
              return (
                <div key={role.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                        {role.is_system && <Badge variant="info">Системная</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{role.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(permsByCategory).map(([category, stats]) => {
                          if (stats.count === 0) return null;
                          const categoryInfo = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
                          return (
                            <Badge key={category} variant="muted" title={`${categoryInfo.name}: ${stats.count} из ${stats.total} разрешений`}>
                              {categoryInfo.name}: {stats.count}/{stats.total}
                            </Badge>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        {role.user_count || 0} пользователей <span className="mx-2">•</span> {role.permissions.length} разрешений
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => handleEditRole(role)} title="Редактировать роль">
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      {!role.is_system && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(role.id)} title="Удалить роль" className="text-gray-400 hover:text-red-600 hover:bg-red-50">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <RoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveRole} role={selectedRole} title={modalMode === 'create' ? 'Создать роль' : 'Редактировать роль'} />

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              Удалить роль
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 mb-6">Вы уверены, что хотите удалить эту роль? Это действие нельзя отменить.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Отмена</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteRole(deleteConfirm)}>Удалить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Roles;
