// Конфигурация ролей и разрешений для AMS
// DEPRECATED: Этот файл содержит предопределенные роли и разрешения системы
// Роли и разрешения теперь загружаются из реального API
// Этот файл сохранен только для категорий и действий разрешений

import type { Role, Permission, PermissionCategory, PermissionAction } from '../types';

// Предопределенные разрешения системы
export const SYSTEM_PERMISSIONS: Permission[] = [
  // Пользователи
  {
    id: 'users.read',
    name: 'Просмотр пользователей',
    description: 'Возможность просматривать список пользователей и их профили',
    category: 'users',
    resource: 'users',
    action: 'read'
  },
  {
    id: 'users.create',
    name: 'Создание пользователей',
    description: 'Возможность создавать новых пользователей в системе',
    category: 'users',
    resource: 'users',
    action: 'create'
  },
  {
    id: 'users.update',
    name: 'Редактирование пользователей',
    description: 'Возможность редактировать профили пользователей',
    category: 'users',
    resource: 'users',
    action: 'update'
  },
  {
    id: 'users.delete',
    name: 'Удаление пользователей',
    description: 'Возможность удалять пользователей из системы',
    category: 'users',
    resource: 'users',
    action: 'delete'
  },
  {
    id: 'users.manage_roles',
    name: 'Управление ролями пользователей',
    description: 'Возможность назначать и изменять роли пользователей',
    category: 'users',
    resource: 'users',
    action: 'manage'
  },

  // Камеры
  {
    id: 'cameras.read',
    name: 'Просмотр камер',
    description: 'Возможность просматривать список камер и их статус',
    category: 'cameras',
    resource: 'cameras',
    action: 'read'
  },
  {
    id: 'cameras.create',
    name: 'Добавление камер',
    description: 'Возможность добавлять новые камеры в систему',
    category: 'cameras',
    resource: 'cameras',
    action: 'create'
  },
  {
    id: 'cameras.update',
    name: 'Редактирование камер',
    description: 'Возможность редактировать настройки камер',
    category: 'cameras',
    resource: 'cameras',
    action: 'update'
  },
  {
    id: 'cameras.delete',
    name: 'Удаление камер',
    description: 'Возможность удалять камеры из системы',
    category: 'cameras',
    resource: 'cameras',
    action: 'delete'
  },

  // Инциденты
  {
    id: 'incidents.read',
    name: 'Просмотр инцидентов',
    description: 'Возможность просматривать список инцидентов',
    category: 'incidents',
    resource: 'incidents',
    action: 'read'
  },
  {
    id: 'incidents.create',
    name: 'Создание инцидентов',
    description: 'Возможность создавать новые инциденты',
    category: 'incidents',
    resource: 'incidents',
    action: 'create'
  },
  {
    id: 'incidents.update',
    name: 'Редактирование инцидентов',
    description: 'Возможность редактировать существующие инциденты',
    category: 'incidents',
    resource: 'incidents',
    action: 'update'
  },
  {
    id: 'incidents.delete',
    name: 'Удаление инцидентов',
    description: 'Возможность удалять инциденты',
    category: 'incidents',
    resource: 'incidents',
    action: 'delete'
  },
  {
    id: 'incidents.export',
    name: 'Экспорт инцидентов',
    description: 'Возможность экспортировать данные об инцидентах',
    category: 'incidents',
    resource: 'incidents',
    action: 'export'
  },

  // События
  {
    id: 'events.read',
    name: 'Просмотр событий',
    description: 'Возможность просматривать список событий',
    category: 'events',
    resource: 'events',
    action: 'read'
  },
  {
    id: 'events.create',
    name: 'Создание событий',
    description: 'Возможность создавать новые события',
    category: 'events',
    resource: 'events',
    action: 'create'
  },
  {
    id: 'events.update',
    name: 'Редактирование событий',
    description: 'Возможность редактировать существующие события',
    category: 'events',
    resource: 'events',
    action: 'update'
  },
  {
    id: 'events.delete',
    name: 'Удаление событий',
    description: 'Возможность удалять события',
    category: 'events',
    resource: 'events',
    action: 'delete'
  },
  {
    id: 'events.export',
    name: 'Экспорт событий',
    description: 'Возможность экспортировать данные о событиях',
    category: 'events',
    resource: 'events',
    action: 'export'
  },

  // Файлы
  {
    id: 'files.read',
    name: 'Просмотр файлов',
    description: 'Возможность просматривать файлы и папки',
    category: 'files',
    resource: 'files',
    action: 'read'
  },
  {
    id: 'files.create',
    name: 'Загрузка файлов',
    description: 'Возможность загружать новые файлы',
    category: 'files',
    resource: 'files',
    action: 'create'
  },
  {
    id: 'files.update',
    name: 'Редактирование файлов',
    description: 'Возможность переименовывать и перемещать файлы',
    category: 'files',
    resource: 'files',
    action: 'update'
  },
  {
    id: 'files.delete',
    name: 'Удаление файлов',
    description: 'Возможность удалять файлы и папки',
    category: 'files',
    resource: 'files',
    action: 'delete'
  },

  // Система
  {
    id: 'system.dashboard',
    name: 'Доступ к дашборду',
    description: 'Возможность просматривать главную панель управления',
    category: 'system',
    resource: 'dashboard',
    action: 'read'
  },
  {
    id: 'system.roles',
    name: 'Управление ролями',
    description: 'Возможность создавать, редактировать и удалять роли',
    category: 'system',
    resource: 'roles',
    action: 'manage'
  },
  {
    id: 'system.permissions',
    name: 'Управление разрешениями',
    description: 'Возможность просматривать и управлять разрешениями',
    category: 'system',
    resource: 'permissions',
    action: 'manage'
  },

  // Отчеты
  {
    id: 'reports.view',
    name: 'Просмотр отчетов',
    description: 'Возможность просматривать системные отчеты',
    category: 'reports',
    resource: 'reports',
    action: 'read'
  },
  {
    id: 'reports.export',
    name: 'Экспорт отчетов',
    description: 'Возможность экспортировать отчеты в различных форматах',
    category: 'reports',
    resource: 'reports',
    action: 'export'
  }
];

// Предопределенные роли системы
export const SYSTEM_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Администратор',
    description: 'Полный доступ ко всем функциям системы',
    permissions: SYSTEM_PERMISSIONS.map(p => p.id),
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_count: 0
  },
  {
    id: 'manager',
    name: 'Менеджер',
    description: 'Доступ к управлению пользователями, инцидентами и отчетам',
    permissions: [
      'system.dashboard',
      'users.read',
      'users.create',
      'users.update',
      'cameras.read',
      'cameras.update',
      'incidents.read',
      'incidents.create',
      'incidents.update',
      'incidents.export',
      'events.read',
      'events.create',
      'events.update',
      'events.export',
      'files.read',
      'files.create',
      'files.update',
      'reports.view',
      'reports.export'
    ],
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_count: 0
  },
  {
    id: 'operator',
    name: 'Оператор',
    description: 'Доступ к мониторингу и управлению инцидентами',
    permissions: [
      'system.dashboard',
      'users.read',
      'cameras.read',
      'incidents.read',
      'incidents.create',
      'incidents.update',
      'events.read',
      'events.create',
      'files.read',
      'files.create'
    ],
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_count: 0
  },
  {
    id: 'viewer',
    name: 'Наблюдатель',
    description: 'Доступ только для просмотра данных',
    permissions: [
      'system.dashboard',
      'users.read',
      'cameras.read',
      'incidents.read',
      'events.read',
      'files.read'
    ],
    is_system: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_count: 0
  }
];

// Категории разрешений с описаниями
export const PERMISSION_CATEGORIES: Record<PermissionCategory, { name: string; description: string }> = {
  users: {
    name: 'Пользователи',
    description: 'Управление пользователями системы'
  },
  cameras: {
    name: 'Камеры',
    description: 'Управление камерами видеонаблюдения'
  },
  incidents: {
    name: 'Инциденты',
    description: 'Управление инцидентами безопасности'
  },
  events: {
    name: 'События',
    description: 'Управление системными событиями'
  },
  files: {
    name: 'Файлы',
    description: 'Управление файлами и документами'
  },
  system: {
    name: 'Система',
    description: 'Системные настройки и конфигурация'
  },
  reports: {
    name: 'Отчеты',
    description: 'Просмотр и создание отчетов'
  }
};

// Действия с описаниями
export const PERMISSION_ACTIONS: Record<PermissionAction, { name: string; description: string }> = {
  create: {
    name: 'Создание',
    description: 'Создание новых записей'
  },
  read: {
    name: 'Просмотр',
    description: 'Просмотр существующих записей'
  },
  update: {
    name: 'Редактирование',
    description: 'Изменение существующих записей'
  },
  delete: {
    name: 'Удаление',
    description: 'Удаление записей'
  },
  export: {
    name: 'Экспорт',
    description: 'Экспорт данных'
  },
  import: {
    name: 'Импорт',
    description: 'Импорт данных'
  },
  manage: {
    name: 'Управление',
    description: 'Полное управление ресурсом'
  }
};

// Утилитарные функции
export const getPermissionsByCategory = (category: PermissionCategory): Permission[] => {
  return SYSTEM_PERMISSIONS.filter(permission => permission.category === category);
};

export const getRoleById = (roleId: string): Role | undefined => {
  return SYSTEM_ROLES.find(role => role.id === roleId);
};

export const getPermissionById = (permissionId: string): Permission | undefined => {
  return SYSTEM_PERMISSIONS.find(permission => permission.id === permissionId);
};

export const getRolePermissions = (roleId: string): Permission[] => {
  const role = getRoleById(roleId);
  if (!role) return [];
  
  return role.permissions
    .map(permissionId => getPermissionById(permissionId))
    .filter((permission): permission is Permission => permission !== undefined);
};

export const hasPermission = (roleId: string, permissionId: string): boolean => {
  const role = getRoleById(roleId);
  return role ? role.permissions.includes(permissionId) : false;
};
