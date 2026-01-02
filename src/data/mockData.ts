import type { User, Camera, Incident, AttendanceRecord, ChartDataPoint, SettingsCard, FileMetadata } from '../types';
import { 
  validateUsers, 
  validateCameras, 
  validateIncidents, 
  validateAttendanceRecords,
  withValidation 
} from '../utils/validation';

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Ахметов Айдар Серикович',
    email: 'Axmet@simmmple.com',
    role: 'Работник',
    roleDescription: 'Описание...',
    age: '25 лет',
    hired: '13/05/21'
  },
  {
    id: 2,
    name: 'Омаров Аскар Бауыржанович',
    email: 'Omar@simmmple.com',
    role: 'Работник',
    roleDescription: 'Описание...',
    age: '28 лет',
    hired: '15/03/20'
  },
  {
    id: 3,
    name: 'Оспанов Данияр Ерланович',
    email: 'Dani@simmmple.com',
    role: 'Работник',
    roleDescription: 'Описание...',
    age: '30 лет',
    hired: '22/07/19'
  },
  {
    id: 4,
    name: 'Сулейменов Руслан Амангельдиевич',
    email: 'Suleim@simmmple.com',
    role: 'Работник',
    roleDescription: 'Описание...',
    age: '27 лет',
    hired: '08/11/21'
  },
  {
    id: 5,
    name: 'Исжанов Арман Нурланович',
    email: 'Isjanov@simmmple.com',
    role: 'Администратор',
    roleDescription: 'Описание...',
    age: '32 лет',
    hired: '10/01/18'
  },
  {
    id: 6,
    name: 'Маратов Азамат Кадырович',
    email: 'Marat@simmmple.com',
    role: 'Работник',
    roleDescription: 'Описание...',
    age: '29 лет',
    hired: '05/09/20'
  }
];

// Mock Cameras Data
export const mockCameras: Camera[] = [
  { id: 1, location: 'Локация 1', name: 'Камера 1', description: 'Описание......', status: 'active' },
  { id: 2, location: 'Локация 2', name: 'Камера 2', description: 'Описание......', status: 'active' },
  { id: 3, location: 'Локация 3', name: 'Камера 3', description: 'Описание......', status: 'inactive' },
  { id: 4, location: 'Локация 4', name: 'Камера 4', description: 'Описание......', status: 'active' },
  { id: 5, location: 'Локация 5', name: 'Камера 5', description: 'Описание......', status: 'active' },
  { id: 6, location: 'Локация 6', name: 'Камера 6', description: 'Описание......', status: 'inactive' },
  { id: 7, location: 'Локация 7', name: 'Камера 7', description: 'Описание......', status: 'active' },
  { id: 8, location: 'Локация 8', name: 'Камера 8', description: 'Описание......', status: 'active' }
];

// Mock Incidents Data
export const mockIncidents: Incident[] = [
  {
    id: 1,
    name: 'Ахметов Айдар Серикович',
    email: 'Axmet@simmmple.com',
    incidentType: 'Отсутствие',
    details: 'Карты, жетоны',
    isLate: false,
    time: '13:55',
    date: '14/06/25'
  },
  {
    id: 2,
    name: 'Омаров Аскар Бауыржанович',
    email: 'Omar@simmmple.com',
    incidentType: 'Отсутствие',
    details: 'Карты, жетоны',
    isLate: false,
    time: '13:55',
    date: '14/06/25'
  },
  {
    id: 3,
    name: 'Оспанов Данияр Ерланович',
    email: 'Dani@simmmple.com',
    incidentType: 'Отсутствие',
    details: 'Карты, жетоны',
    isLate: false,
    time: '13:55',
    date: '14/06/25'
  },
  {
    id: 4,
    name: 'Сулейменов Руслан Амангельдиевич',
    email: 'Suleim@simmmple.com',
    incidentType: 'Отсутствие',
    details: 'Карты, жетоны',
    isLate: false,
    time: '13:55',
    date: '14/06/25'
  },
  {
    id: 5,
    name: 'Исжанов Арман Нурланович',
    email: 'Isjanov@simmmple.com',
    incidentType: 'Опоздание',
    details: 'Карты, жетоны',
    isLate: true,
    time: '13:55',
    date: '14/06/25'
  }
];

// Mock Attendance Data
export const mockAttendanceData: AttendanceRecord[] = [
  {
    id: 1,
    name: 'Ахметов Айдар Серикович',
    email: 'Ahmet@srmmple.com',
    status: 'Отсутствие',
    details: 'Карты, жетоны',
    presence: false,
    time: '13:55',
    date: '14/06/25'
  },
  {
    id: 2,
    name: 'Омаров Аскар Бауыржанович',
    email: 'Omar@srmmple.com',
    status: 'Отсутствие',
    details: 'Карты, жетоны',
    presence: false,
    time: '13:55',
    date: '14/06/25'
  },
  {
    id: 3,
    name: 'Оспанов Даниер Ерланович',
    email: 'Dani@srmmple.com',
    status: 'Отсутствие',
    details: 'Карты, жетоны',
    presence: false,
    time: '13:55',
    date: '14/06/25'
  },
  {
    id: 4,
    name: 'Сулейменов Руслан Амангельдиевич',
    email: 'Suleim@srmmple.com',
    status: 'Отсутствие',
    details: 'Карты, жетоны',
    presence: false,
    time: '13:55',
    date: '14/06/25'
  },
  {
    id: 5,
    name: 'Исжанов Арман Нурланович',
    email: 'Isjanov@srmmple.com',
    status: 'Присутствует',
    details: 'Карты, жетоны',
    presence: true,
    time: '13:55',
    date: '14/06/25'
  }
];

// Mock Chart Data
export const mockChartData: ChartDataPoint[] = [
  { name: 'Янв', value: 200, value2: 150 },
  { name: 'Фев', value: 300, value2: 100 },
  { name: 'Мар', value: 250, value2: 180 },
  { name: 'Апр', value: 400, value2: 250 },
  { name: 'Май', value: 350, value2: 200 },
  { name: 'Июн', value: 450, value2: 300 },
  { name: 'Июл', value: 400, value2: 220 },
  { name: 'Авг', value: 500, value2: 210 },
  { name: 'Сен', value: 450, value2: 180 },
  { name: 'Окт', value: 550, value2: 230 },
  { name: 'Ноя', value: 500, value2: 170 },
  { name: 'Дек', value: 600, value2: 140 },
];

// Mock Settings Cards
export const mockSettingsCards: SettingsCard[] = [
  { id: 'function1', title: 'Функция 1', description: 'Описание функции...' },
  { id: 'function2', title: 'Функция 2', description: 'Описание функции...' },
  { id: 'function3', title: 'Функция 3', description: 'Описание функции...' },
  { id: 'function4', title: 'Функция 4', description: 'Описание функции...' },
  { id: 'function5', title: 'Функция 5', description: 'Описание функции...' },
  { id: 'function6', title: 'Функция 6', description: 'Описание функции...' },
];

// Mock Files Data
export const mockFiles: FileMetadata[] = [
  {
    id: 1,
    filename: 'general_documents.pdf',
    original_filename: 'Общие документы.pdf',
    file_size: 143360, // 140KB
    mime_type: 'application/pdf',
    uploaded_by: 1,
    incident_id: null,
    created_at: '2022-03-23T10:30:00.000Z'
  },
  {
    id: 2,
    filename: 'shop_report_3.pdf',
    original_filename: 'Цех №3.pdf',
    file_size: 143360, // 140KB
    mime_type: 'application/pdf',
    uploaded_by: 2,
    incident_id: null,
    created_at: '2022-03-22T14:15:00.000Z'
  },
  {
    id: 3,
    filename: 'shop_report_4.pdf',
    original_filename: 'Цех №4.pdf',
    file_size: 143360, // 140KB
    mime_type: 'application/pdf',
    uploaded_by: 3,
    incident_id: null,
    created_at: '2022-03-22T16:45:00.000Z'
  },
  {
    id: 4,
    filename: 'shop_report_5.pdf',
    original_filename: 'Цех №5.pdf',
    file_size: 143360, // 140KB
    mime_type: 'application/pdf',
    uploaded_by: 4,
    incident_id: null,
    created_at: '2022-03-09T11:20:00.000Z'
  },
  {
    id: 5,
    filename: 'shop_report_6.pdf',
    original_filename: 'Цех №6.pdf',
    file_size: 143360, // 140KB
    mime_type: 'application/pdf',
    uploaded_by: 5,
    incident_id: null,
    created_at: '2022-03-10T13:30:00.000Z'
  },
  {
    id: 6,
    filename: 'incident_report_001.txt',
    original_filename: 'Отчет происшествия.txt',
    file_size: 14336, // 14KB
    mime_type: 'text/plain',
    uploaded_by: 1,
    incident_id: 1,
    created_at: '2022-03-23T09:15:00.000Z'
  },
  {
    id: 7,
    filename: 'transport_doc.pdf',
    original_filename: 'Транспорт.pdf',
    file_size: 14336, // 14KB
    mime_type: 'text/plain',
    uploaded_by: 2,
    incident_id: null,
    created_at: '2022-03-23T08:45:00.000Z'
  },
  {
    id: 8,
    filename: 'production_report.txt',
    original_filename: 'Отчет производства.txt',
    file_size: 14336, // 14KB
    mime_type: 'text/plain',
    uploaded_by: 3,
    incident_id: null,
    created_at: '2022-03-23T07:30:00.000Z'
  }
];

// Dashboard Statistics Mock Data
export const mockDashboardStats = {
  helmets: {
    count: 32984,
    percentage: 90,
    color: '#014596'
  },
  vests: {
    count: 21673,
    percentage: 75,
    color: '#22C55E'
  }
};

// Default settings state
export const defaultSettingsState: {[key: string]: boolean} = {
  function1: false,
  function2: false,
  function3: false,
  function4: false,
  function5: false,
  function6: true,
};

// Validated data access functions - these return promises with validated data
export const getValidatedUsers = withValidation(
  async () => mockUsers, 
  validateUsers
);

export const getValidatedCameras = withValidation(
  async () => mockCameras, 
  validateCameras
);

export const getValidatedIncidents = withValidation(
  async () => mockIncidents, 
  validateIncidents
);

export const getValidatedAttendanceRecords = withValidation(
  async () => mockAttendanceData, 
  validateAttendanceRecords
);

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Helper function to get file type display name
export const getFileTypeDisplay = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/plain': 'TXT',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'video/mp4': 'MP4',
    'video/avi': 'AVI'
  };
  return typeMap[mimeType] || 'FILE';
};

// Helper function to get author name by user ID
export const getAuthorName = (userId: number | null | undefined): string => {
  if (!userId) return 'Неизвестен';
  const user = mockUsers.find(u => u.id === userId);
  return user ? user.name : 'Неизвестен';
};

// Validate all mock data on module load (development only)
if (process.env.NODE_ENV === 'development') {
  const userValidation = validateUsers(mockUsers);
  const cameraValidation = validateCameras(mockCameras);
  const incidentValidation = validateIncidents(mockIncidents);
  const attendanceValidation = validateAttendanceRecords(mockAttendanceData);

  if (!userValidation.isValid) {
    console.warn('Mock users validation failed:', userValidation.errors);
  }
  if (!cameraValidation.isValid) {
    console.warn('Mock cameras validation failed:', cameraValidation.errors);
  }
  if (!incidentValidation.isValid) {
    console.warn('Mock incidents validation failed:', incidentValidation.errors);
  }
  if (!attendanceValidation.isValid) {
    console.warn('Mock attendance validation failed:', attendanceValidation.errors);
  }
}
