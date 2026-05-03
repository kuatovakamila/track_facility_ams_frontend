import { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import { useAuth } from './contexts/AuthContext';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import CreateUserModal from './components/CreateUserModal';
import EditUserModal from './components/EditUserModal';
import DeleteUserModal from './components/DeleteUserModal';
import UserPermissionManager from './components/UserPermissionManager';
import { useAsyncState } from './hooks/useAsyncState';
import { usersApi } from './services/api';
import { PlusIcon, PencilIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ApiUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Users = () => {
  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [modals, setModals] = useState({ create: false, edit: false, delete: false, permissions: false });

  const getRoleNameById = (roleId: number): string => {
    const roleMap: Record<number, string> = { 1: 'admin', 2: 'manager', 3: 'manager', 4: 'operator', 5: 'viewer', 6: 'viewer', 7: 'viewer' };
    return roleMap[roleId] || 'viewer';
  };

  const { data: users, loading, error, execute: loadUsers } = useAsyncState<ApiUser[]>({ initialData: [] });

  const fetchUsers = async (): Promise<ApiUser[]> => {
    try {
      const response = await usersApi.getUsers({ limit: 100, skip: 0 });
      console.log('API Response:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw new Error('Не удалось загрузить список пользователей. Проверьте подключение к серверу.');
    }
  };

  useEffect(() => { loadUsers(fetchUsers); }, [loadUsers]);

  const currentUserRoleName = useMemo(() => {
    const knownRoles = new Set(['admin', 'manager', 'operator', 'viewer']);
    const roleFromAuth = currentUser?.role?.toLowerCase();
    if (roleFromAuth && knownRoles.has(roleFromAuth)) return roleFromAuth;
    const currentEmail = currentUser?.email?.toLowerCase();
    if (currentEmail && Array.isArray(users)) {
      const me = users.find(u => u.email?.toLowerCase() === currentEmail);
      if (me) return getRoleNameById(me.role_id);
    }
    return 'viewer';
  }, [currentUser?.role, currentUser?.email, users]);

  const usersList = (users || []).filter(user => {
    const userRoleName = getRoleNameById(user.role_id);
    if (currentUserRoleName === 'admin') return true;
    if (currentUserRoleName === 'operator') return userRoleName !== 'admin';
    return userRoleName === currentUserRoleName;
  });

  console.log('Final filtered users list:', usersList);
  console.log('Original users count:', users?.length || 0);
  console.log('Filtered users count:', usersList.length);
  console.log('Current user for debugging:', currentUser);

  const openModal = (modalType: keyof typeof modals, user?: ApiUser) => {
    if (user) setSelectedUser(user);
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
    setSelectedUser(null);
  };

  const convertApiUserToModalUser = (apiUser: ApiUser | null) => {
    if (!apiUser) return null;
    return { id: apiUser.id, email: apiUser.email, first_name: apiUser.first_name, last_name: apiUser.last_name, role: getRoleNameById(apiUser.role_id), is_active: apiUser.is_active, created_at: apiUser.created_at, updated_at: apiUser.updated_at };
  };

  const handleCreateUser = async (userData: { email: string; first_name: string; last_name: string; password: string; role: string; is_active: boolean }) => {
    await usersApi.createUser(userData);
    await loadUsers(fetchUsers);
  };

  const handleUpdateUser = async (userId: number, userData: any) => {
    await usersApi.updateUser(userId.toString(), userData);
    await loadUsers(fetchUsers);
  };

  const handleDeactivateUser = async (userId: number) => {
    await usersApi.updateUser(userId.toString(), { is_active: false });
    await loadUsers(fetchUsers);
  };

  const handleDeleteUser = async (userId: number) => {
    await usersApi.deleteUser(userId.toString());
    await loadUsers(fetchUsers);
  };

  const handleUpdateUserPermissions = async (userId: number, permissions: string[]) => {
    console.log('Updating user permissions:', { userId, permissions });
  };

  const getUserPermissions = (_user: ApiUser): string[] => [];

  const getRoleDisplayName = (roleId: number) => {
    const roleName = getRoleNameById(roleId);
    const roleMap: Record<string, string> = { 'admin': 'Администратор', 'manager': 'Менеджер', 'operator': 'Оператор', 'viewer': 'Наблюдатель' };
    return roleMap[roleName] || roleName;
  };

  const getRoleBadgeVariant = (roleId: number): 'destructive' | 'info' | 'success' | 'muted' => {
    const roleName = getRoleNameById(roleId);
    const variantMap: Record<string, 'destructive' | 'info' | 'success' | 'muted'> = { 'admin': 'destructive', 'manager': 'info', 'operator': 'success', 'viewer': 'muted' };
    return variantMap[roleName] || 'muted';
  };

  if (error) {
    return (
      <Layout title="Пользователи" hideDefaultBreadcrumbs>
        <ErrorState title="Ошибка загрузки пользователей" message={error.message} onRetry={() => loadUsers(fetchUsers)} className="min-h-[400px]" />
      </Layout>
    );
  }

  return (
    <Layout title="Пользователи" hideDefaultBreadcrumbs>
      <div className="relative bg-gradient-to-br from-[#014596] to-[#1e40af] h-80 -mx-8 -mt-8 overflow-hidden">
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
            <path d="M0,120 C200,80 400,160 600,120 C800,80 1000,160 1200,120 L1200,300 L0,300 Z" fill="rgba(255,255,255,0.15)" />
            <path d="M0,180 C200,140 400,220 600,180 C800,140 1000,220 1200,180 L1200,300 L0,300 Z" fill="rgba(255,255,255,0.1)" />
            <path d="M0,220 C200,180 400,260 600,220 C800,180 1000,260 1200,220 L1200,300 L0,300 Z" fill="rgba(255,255,255,0.05)" />
          </svg>
        </div>
        <div className="relative z-10 p-8">
          <div className="text-gray-300 text-sm mb-2">Страницы /</div>
          <h1 className="text-2xl font-bold text-white">Пользователи</h1>
        </div>
      </div>

      <div className="relative -mt-24 mx-4 lg:mx-8 mb-6">
        <Card>
          <CardHeader className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#222B45]">Управление пользователями</h3>
                <p className="text-gray-400 text-sm sm:text-base">Создание, редактирование и управление пользователями системы</p>
              </div>
              <Button onClick={() => openModal('create')} disabled={loading}>
                <PlusIcon className="w-4 h-4" />
                Добавить пользователя
              </Button>
            </div>
          </CardHeader>

          {/* Mobile Cards View */}
          <div className="lg:hidden">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => <SkeletonLoader key={index} type="card" />)}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {usersList.map((user) => (
                  <Card key={user.id} className="bg-gray-50 shadow-none border-0">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{user.first_name} {user.last_name}</h4>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(user.role_id)}>{getRoleDisplayName(user.role_id)}</Badge>
                          {!user.is_active && <Badge variant="destructive">Неактивен</Badge>}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span>ID: {user.id}</span>
                        <span>Создан: {new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-blue-900 border-blue-200" onClick={() => openModal('edit', user)}>
                          <PencilIcon className="w-3 h-3" /> Изменить
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-green-900 border-green-200" onClick={() => openModal('permissions', user)}>
                          <KeyIcon className="w-3 h-3" /> Права
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-red-900 border-red-200" onClick={() => openModal('delete', user)}>
                          <TrashIcon className="w-3 h-3" /> Удалить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {usersList.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Пользователи не найдены</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            {loading ? (
              <SkeletonLoader type="table" rows={6} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-[#014596] text-white text-sm">
                              {user.first_name[0]}{user.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role_id)}>{getRoleDisplayName(user.role_id)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'success' : 'destructive'}>
                          {user.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900" onClick={() => openModal('edit', user)} title="Редактировать пользователя">
                            <PencilIcon className="w-4 h-4" /> Изменить
                          </Button>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-900" onClick={() => openModal('permissions', user)} title="Управление разрешениями">
                            <KeyIcon className="w-4 h-4" /> Права
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-900" onClick={() => openModal('delete', user)} title="Удалить пользователя">
                            <TrashIcon className="w-4 h-4" /> Удалить
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {usersList.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">Пользователи не найдены</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <CreateUserModal isOpen={modals.create} onClose={() => closeModal('create')} onSave={handleCreateUser} />
      <EditUserModal isOpen={modals.edit} onClose={() => closeModal('edit')} onSave={handleUpdateUser} user={convertApiUserToModalUser(selectedUser)} />
      <DeleteUserModal isOpen={modals.delete} onClose={() => closeModal('delete')} onDeactivate={handleDeactivateUser} onDelete={handleDeleteUser} user={convertApiUserToModalUser(selectedUser)} />
      <UserPermissionManager isOpen={modals.permissions} onClose={() => closeModal('permissions')} onSave={handleUpdateUserPermissions} user={convertApiUserToModalUser(selectedUser)} userPermissions={selectedUser ? getUserPermissions(selectedUser) : []} />
    </Layout>
  );
};

export default Users;
