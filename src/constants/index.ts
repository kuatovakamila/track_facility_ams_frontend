// Design System Colors
export const COLORS = {
  // Primary brand colors
  primary: '#014596',
  primaryHover: '#003876',
  
  // Secondary colors
  secondary: '#22C55E',
  secondaryHover: '#16A34A',
  
  // Neutral colors
  text: {
    primary: '#222B45',
    secondary: '#6B7280',
    light: '#9CA3AF',
    white: '#FFFFFF',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F7F9FB',
    gray: '#F3F4F6',
    light: '#FAFAFA',
  },
  
  // Border colors
  border: {
    primary: '#E5EAF2',
    secondary: '#E5E7EB',
    light: '#F3F4F6',
  },
  
  // Status colors
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Opacity variants
  opacity: {
    light: '0.1',
    medium: '0.3',
    high: '0.8',
  }
} as const;

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    primary: 'Samsung Sharp Sans, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  }
} as const;

// Spacing Scale
export const SPACING = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  '4xl': '2.5rem',  // 40px
  '5xl': '3rem',    // 48px
} as const;

// Border Radius
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Shadows
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// Breakpoints (for responsive design)
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Layout Constants
export const LAYOUT = {
  sidebar: {
    width: {
      mobile: '16rem',    // w-64
      desktop: '18rem',   // w-72
      collapsed: '4rem',  // w-16
    },
    mobileBreakpoint: 'lg',
  },
  
  header: {
    height: '4rem',       // h-16
  },
  
  content: {
    maxWidth: '1200px',
    padding: {
      mobile: '1rem',
      desktop: '2rem',
    }
  }
} as const;

// Navigation Menu Items
export const NAVIGATION = {
  menuItems: [
    { name: 'Дэшборд', href: '/' },
    { name: 'Камеры', href: '/cameras' },
    { name: 'Инциденты', href: '/incidents' },
    { name: 'Пользователи', href: '/users' },
    { name: 'Файлы', href: '/files' },
  ],
  
  footerLinks: [
    { name: 'Документация', href: '/docs' },
    { name: 'Поддержка', href: '/support' },
    { name: 'Настройки', href: '/settings' },
  ]
} as const;

// Animation Durations
export const ANIMATIONS = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// Z-Index Scale
export const Z_INDEX = {
  dropdown: 10,
  sticky: 20,
  modal: 30,
  tooltip: 40,
  toast: 50,
} as const;

// Application Settings
export const APP_CONFIG = {
  name: 'AMS Dashboard',
  version: '1.0.0',
  description: 'Asset Management System Dashboard',
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    // API Limits (as per backend constraints)
    limits: {
      users: 100,      // Maximum users per request
      cameras: 100,    // Maximum cameras per request  
      incidents: 100,  // Maximum incidents per request
      files: 100,      // Maximum files per request
      events: 1000,    // Maximum events per request
      folders: 1000,   // Maximum folders per request
    },
  },
  
  // Pagination defaults
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50, 100],
    maxPages: 10,
  },
  
  // Table settings
  table: {
    defaultSortDirection: 'asc',
    stickyHeader: true,
    showRowNumbers: false,
  },
  
  // Date formats
  dateFormats: {
    display: 'DD/MM/YY',
    input: 'YYYY-MM-DD',
    timestamp: 'YYYY-MM-DD HH:mm:ss',
  },
  
  // File upload
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFiles: 5,
  }
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  generic: 'Произошла ошибка. Попробуйте снова.',
  network: 'Ошибка сети. Проверьте подключение к интернету.',
  unauthorized: 'Недостаточно прав доступа.',
  notFound: 'Ресурс не найден.',
  validation: 'Проверьте правильность введенных данных.',
  
  // Specific error messages
  userFetch: 'Не удалось загрузить список пользователей',
  attendanceFetch: 'Не удалось загрузить данные посещаемости',
  chartFetch: 'Не удалось загрузить данные для графика',
  cameraFetch: 'Не удалось загрузить список камер',
  incidentFetch: 'Не удалось загрузить список инцидентов',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  userCreated: 'Пользователь успешно создан',
  userUpdated: 'Пользователь успешно обновлен',
  userDeleted: 'Пользователь успешно удален',
  
  cameraCreated: 'Камера успешно добавлена',
  cameraUpdated: 'Камера успешно обновлена',
  cameraDeleted: 'Камера успешно удалена',
  
  incidentCreated: 'Инцидент успешно создан',
  incidentUpdated: 'Инцидент успешно обновлен',
  incidentDeleted: 'Инцидент успешно удален',
  
  settingsSaved: 'Настройки сохранены',
  fileSaved: 'Файл сохранен',
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  colors: {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    gradient: {
      primary: {
        from: COLORS.primary,
        to: COLORS.primary + '00', // transparent
      },
      secondary: {
        from: COLORS.secondary,
        to: COLORS.secondary + '00', // transparent
      }
    }
  },
  
  grid: {
    stroke: COLORS.border.primary,
    strokeDasharray: '3 3',
  },
  
  axis: {
    fontSize: 12,
    color: COLORS.text.secondary,
  }
} as const;

// Simulation Constants for Mock Data
export const SIMULATION_DELAYS = {
  USER_FETCH: 1200,
  ATTENDANCE_FETCH: 1200,
  CHART_FETCH: 800,
  CAMERA_FETCH: 1000,
  INCIDENT_FETCH: 1100,
} as const;

// Error simulation rates (0.05 = 5% chance of error)
export const ERROR_SIMULATION_RATES = {
  USER_FETCH: 0.05,
  ATTENDANCE_FETCH: 0.05,
  CHART_FETCH: 0.05,
  CAMERA_FETCH: 0.05,
  INCIDENT_FETCH: 0.05,
} as const;
