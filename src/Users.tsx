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
  const [modals, setModals] = useState({
    create: false,
    edit: false,
    delete: false,
    permissions: false
  });

  // Role ID to role name mapping
  const getRoleNameById = (roleId: number): string => {
    const roleMap: Record<number, string> = {
      1: 'admin',
      2: 'manager', 
      3: 'manager',
      4: 'operator',
      5: 'viewer',
      6: 'viewer',
      7: 'viewer'
    };
    return roleMap[roleId] || 'viewer';
  };

  const { data: users, loading, error, execute: loadUsers } = useAsyncState<ApiUser[]>({
    initialData: []
  });

  // Fetch users from API
  const fetchUsers = async (): Promise<ApiUser[]> => {
    try {
      const response = await usersApi.getUsers({
        limit: 100,
        skip: 0
      });
      
      console.log('API Response:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw new Error('Не удалось загрузить список пользователей. Проверьте подключение к серверу.');
    }
  };

  useEffect(() => {
    loadUsers(fetchUsers);
  }, [loadUsers]);

  // Resolve current user role robustly:
  // 1) Use role from AuthContext if it matches known roles
  // 2) Else, infer from fetched users list by matching email and mapping role_id
  const currentUserRoleName = useMemo(() => {
    const knownRoles = new Set(['admin', 'manager', 'operator', 'viewer']);
    const roleFromAuth = currentUser?.role?.toLowerCase();
    if (roleFromAuth && knownRoles.has(roleFromAuth)) return roleFromAuth;

    const currentEmail = currentUser?.email?.toLowerCase();
    if (currentEmail && Array.isArray(users)) {
      const me = users.find(u => u.email?.toLowerCase() === currentEmail);
      if (me) return getRoleNameById(me.role_id);
    }

    // Fallback
    return 'viewer';
  }, [currentUser?.role, currentUser?.email, users]);

  // Filter users according to current user's role
  const usersList = (users || []).filter(user => {
    const userRoleName = getRoleNameById(user.role_id);

    if (currentUserRoleName === 'admin') {
      return true; // Админ видит всех
    }

    if (currentUserRoleName === 'operator') {
      return userRoleName !== 'admin'; // Оператор видит всех кроме админов
    }

    // Остальные видят только свою роль
    return userRoleName === currentUserRoleName;
  });

  // Debug the final filtered list
  console.log('Final filtered users list:', usersList);
  console.log('Original users count:', users?.length || 0);
  console.log('Filtered users count:', usersList.length);
  console.log('Current user for debugging:', currentUser);

  // Обработчики модальных окон
  const openModal = (modalType: keyof typeof modals, user?: ApiUser) => {
    if (user) setSelectedUser(user);
    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeModal = (modalType: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
    setSelectedUser(null);
  };

  // Convert ApiUser to the format expected by modals
  const convertApiUserToModalUser = (apiUser: ApiUser | null): { 
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null => {
    if (!apiUser) return null;
    
    return {
      id: apiUser.id,
      email: apiUser.email,
      first_name: apiUser.first_name,
      last_name: apiUser.last_name,
      role: getRoleNameById(apiUser.role_id),
      is_active: apiUser.is_active,
      created_at: apiUser.created_at,
      updated_at: apiUser.updated_at
    };
  };

  // Обработчики CRUD операций
  const handleCreateUser = async (userData: {
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    role: string;
    is_active: boolean;
  }) => {
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
    // В реальном приложении здесь был бы API вызов для обновления разрешений пользователя
    console.log('Updating user permissions:', { userId, permissions });
    // Пока что просто закрываем модальное окно
  };

  // Получение разрешений пользователя (заглушка)
  const getUserPermissions = (_user: ApiUser): string[] => {
    // В реальном приложении здесь был бы API вызов
    return [];
  };

  const getRoleDisplayName = (roleId: number) => {
    const roleName = getRoleNameById(roleId);
    const roleMap: Record<string, string> = {
      'admin': 'Администратор',
      'manager': 'Менеджер',
      'operator': 'Оператор',
      'viewer': 'Наблюдатель'
    };
    return roleMap[roleName] || roleName;
  };

  const getRoleBadgeColor = (roleId: number) => {
    const roleName = getRoleNameById(roleId);
    const colorMap: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800',
      'manager': 'bg-blue-100 text-blue-800',
      'operator': 'bg-green-100 text-green-800',
      'viewer': 'bg-gray-100 text-gray-800'
    };
    return colorMap[roleName] || 'bg-gray-100 text-gray-800';
  };

  // Show error state
  if (error) {
    return (
      <Layout title="Пользователи" hideDefaultBreadcrumbs>
        <ErrorState
          title="Ошибка загрузки пользователей"
          message={error.message}
          onRetry={() => loadUsers(fetchUsers)}
          className="min-h-[400px]"
        />
      </Layout>
    );
  }

  return (
    <Layout title="Пользователи" hideDefaultBreadcrumbs>
      <div className="relative bg-gradient-to-br from-[#014596] to-[#1e40af] h-80 -mx-8 -mt-8 overflow-hidden">
        {/* Волнистые линии */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
            <path 
              d="M0,120 C200,80 400,160 600,120 C800,80 1000,160 1200,120 L1200,300 L0,300 Z" 
              fill="rgba(255,255,255,0.15)"
            />
            <path 
              d="M0,180 C200,140 400,220 600,180 C800,140 1000,220 1200,180 L1200,300 L0,300 Z" 
              fill="rgba(255,255,255,0.1)"
            />
            <path 
              d="M0,220 C200,180 400,260 600,220 C800,180 1000,260 1200,220 L1200,300 L0,300 Z" 
              fill="rgba(255,255,255,0.05)"
            />
          </svg>
        </div>
        
        {/* Хлебные крошки и заголовок */}
        <div className="relative z-10 p-8">
          <div className="text-gray-300 text-sm mb-2">Страницы /</div>
          <h1 className="text-2xl font-bold text-white">Пользователи</h1>
        </div>
      </div>

      {/* Основной контент */}
      <div className="relative -mt-24 mx-4 lg:mx-8 mb-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#222B45]">Управление пользователями</h3>
                <p className="text-gray-400 text-sm sm:text-base">
                  Создание, редактирование и управление пользователями системы
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button 
                  onClick={() => openModal('create')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#014596] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  <PlusIcon className="w-4 h-4" />
                  Добавить пользователя
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonLoader key={index} type="card" />
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {usersList.map((user) => (
                  <div key={user.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {user.first_name} {user.last_name}
                        </h4>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role_id)}`}>
                          {getRoleDisplayName(user.role_id)}
                        </span>
                        {!user.is_active && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Неактивен
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                      <span>ID: {user.id}</span>
                      <span>Создан: {new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal('edit', user)}
                        className="flex-1 flex items-center justify-center gap-1 text-blue-900 hover:text-blue-700 text-sm font-medium py-1 border border-blue-200 rounded"
                      >
                        <PencilIcon className="w-3 h-3" />
                        Изменить
                      </button>
                      <button 
                        onClick={() => openModal('permissions', user)}
                        className="flex-1 flex items-center justify-center gap-1 text-green-900 hover:text-green-700 text-sm font-medium py-1 border border-green-200 rounded"
                      >
                        <KeyIcon className="w-3 h-3" />
                        Права
                      </button>
                      <button 
                        onClick={() => openModal('delete', user)}
                        className="flex-1 flex items-center justify-center gap-1 text-red-900 hover:text-red-700 text-sm font-medium py-1 border border-red-200 rounded"
                      >
                        <TrashIcon className="w-3 h-3" />
                        Удалить
                      </button>
                    </div>
                  </div>
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
          <div className="hidden lg:block overflow-x-auto">
            {loading ? (
              <SkeletonLoader type="table" rows={6} />
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Создан</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[#014596] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role_id)}`}>
                          {getRoleDisplayName(user.role_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => openModal('edit', user)}
                            className="text-blue-600 hover:text-blue-900 font-medium flex items-center gap-1"
                            title="Редактировать пользователя"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Изменить
                          </button>
                          <button 
                            onClick={() => openModal('permissions', user)}
                            className="text-green-600 hover:text-green-900 font-medium flex items-center gap-1"
                            title="Управление разрешениями"
                          >
                            <KeyIcon className="w-4 h-4" />
                            Права
                          </button>
                          <button 
                            onClick={() => openModal('delete', user)}
                            className="text-red-600 hover:text-red-900 font-medium flex items-center gap-1"
                            title="Удалить пользователя"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {usersList.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">Пользователи не найдены</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальные окна */}
      <CreateUserModal
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        onSave={handleCreateUser}
      />

      <EditUserModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        onSave={handleUpdateUser}
        user={convertApiUserToModalUser(selectedUser)}
      />

      <DeleteUserModal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        onDeactivate={handleDeactivateUser}
        onDelete={handleDeleteUser}
        user={convertApiUserToModalUser(selectedUser)}
      />

      <UserPermissionManager
        isOpen={modals.permissions}
        onClose={() => closeModal('permissions')}
        onSave={handleUpdateUserPermissions}
        user={convertApiUserToModalUser(selectedUser)}
        userPermissions={selectedUser ? getUserPermissions(selectedUser) : []}
      />
    </Layout>
  );
};

export default Users;

