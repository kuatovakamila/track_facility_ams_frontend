import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useDataContext } from './contexts/DataContext';
import { useAppContext } from './contexts/AppContext';
import { dashboardApi, usersApi } from './services/api';
import { mockChartData } from './data/mockData';
import type { AttendanceRecord, ChartDataPoint } from './types';

const Dashboard = () => {
  const [attendanceProgress, setAttendanceProgress] = useState(0);
  const [lateProgress, setLateProgress] = useState(0);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<Error | null>(null);
  
  // Use DataContext for attendance data
  const { attendance, attendanceLoading, attendanceError, loadAttendance } = useDataContext();
  
  // Use AppContext for page tracking
  const { setCurrentPage } = useAppContext();

  // Fetch attendance/employee data from API
  const fetchAttendanceData = useCallback(async (): Promise<AttendanceRecord[]> => {
    try {
      const [summary, users] = await Promise.all([
        dashboardApi.getEmployeesSummary(),
        usersApi.getUsers({ limit: 100 }),
      ]);

      // Set progress bars from summary
      if (summary && typeof summary.total_employees === 'number') {
        const total = summary.total_employees || 0;
        const active = summary.active_employees ?? 0;
        const rate = typeof summary.attendance_rate === 'number'
          ? (summary.attendance_rate <= 1 ? summary.attendance_rate * 100 : summary.attendance_rate)
          : total > 0 ? (active / total) * 100 : 0;
        const late = typeof summary.late_percentage === 'number'
          ? (summary.late_percentage <= 1 ? summary.late_percentage * 100 : summary.late_percentage)
          : 0;
        setAttendanceProgress(rate);
        setLateProgress(late);
      } else if (summary && typeof summary.attendance_rate === 'number') {
        setAttendanceProgress(summary.attendance_rate <= 1 ? summary.attendance_rate * 100 : summary.attendance_rate);
        setLateProgress(summary.late_percentage != null
          ? (summary.late_percentage <= 1 ? summary.late_percentage * 100 : summary.late_percentage)
          : 0);
      }

      // Build table rows from users list
      if (Array.isArray(users) && users.length > 0) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
        return users.map((u: any): AttendanceRecord => ({
          id: u.id,
          name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email?.split('@')[0] || 'Сотрудник',
          email: u.email || '',
          status: u.is_active !== false ? 'Присутствует' : 'Отсутствует',
          details: u.role?.name || u.role || 'Нет данных',
          presence: u.is_active !== false,
          time: timeStr,
          date: dateStr,
        }));
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      throw new Error('Не удалось загрузить данные о посещаемости. Проверьте подключение к серверу.');
    }
  }, []);

  const fetchChartData = useCallback(async (): Promise<ChartDataPoint[]> => {
    try {
      await dashboardApi.getDashboardStats();
      return mockChartData;
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      return mockChartData;
    }
  }, []);

  useEffect(() => {
    setCurrentPage('dashboard');
    loadAttendance(fetchAttendanceData);
    
    // Load chart data separately
    const loadChart = async () => {
      try {
        setChartLoading(true);
        const data = await fetchChartData();
        setChartData(data);
        setChartError(null);
      } catch (error) {
        setChartError(error as Error);
      } finally {
        setChartLoading(false);
      }
    };
    
    loadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate progress bars from employee array (only if backend didn't return pre-calculated stats)
  useEffect(() => {
    if (!attendanceLoading && attendance && attendance.length > 0) {
      const timer1 = setTimeout(() => {
        const totalEmployees = attendance.length;
        const presentEmployees = attendance.filter(person => person.presence).length;
        const attendancePercentage = (presentEmployees / totalEmployees) * 100;
        setAttendanceProgress(isNaN(attendancePercentage) ? 0 : attendancePercentage);
      }, 300);

      const timer2 = setTimeout(() => {
        const totalEmployees = attendance.length;
        const lateEmployees = attendance.filter((person: AttendanceRecord) => person.status === 'late').length;
        const latePercentage = (lateEmployees / totalEmployees) * 100;
        setLateProgress(isNaN(latePercentage) ? 0 : latePercentage);
      }, 600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [attendanceLoading, attendance]);

  const isLoading = attendanceLoading || chartLoading;
  const hasError = attendanceError || chartError;

  if (hasError) {
    return (
      <Layout title="Аналитика">
        <ErrorState
          title="Ошибка загрузки данных"
          message={attendanceError?.message || chartError?.message || 'Не удалось загрузить данные дэшборда'}
          onRetry={() => {
            loadAttendance(fetchAttendanceData);
            // Reload chart data
            const loadChart = async () => {
              try {
                setChartLoading(true);
                const data = await fetchChartData();
                setChartData(data);
                setChartError(null);
              } catch (error) {
                setChartError(error as Error);
              } finally {
                setChartLoading(false);
              }
            };
            loadChart();
          }}
          className="min-h-[400px]"
        />
      </Layout>
    );
  }

  return (
    <Layout title="" breadcrumb="">
      {isLoading ? (
        <SkeletonLoader type="dashboard" />
      ) : (
        <>
          {/* Первый блок аналитики — всё в одном общем контейнере */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col lg:flex-row gap-6">
            {/* Круговые диаграммы */}
            <div className="flex flex-col sm:flex-row gap-6 flex-1">
              {/* Посещаемость */}
              <div className="flex flex-col items-center justify-center border border-[#E5EAF2] rounded-2xl p-4 min-w-[220px]">
                <div className="text-base font-medium text-gray-600 mb-2">Процент посещаемости</div>
                <div className="relative flex items-center justify-center">
                  <svg className="w-28 h-28" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#E5EAF2" strokeWidth="8" fill="none" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      stroke="#22C55E" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray="282.7" 
                      strokeDashoffset={(() => {
                        const progress = isNaN(attendanceProgress) ? 0 : attendanceProgress;
                        const offset = 282.7 - (282.7 * progress / 100);
                        return isNaN(offset) ? "282.7" : offset.toString();
                      })()} 
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold text-black">
                    {isNaN(attendanceProgress) ? 0 : Math.round(attendanceProgress)}%
                  </span>
                </div>
              </div>
              {/* Опоздавшие */}
              <div className="flex flex-col items-center justify-center border border-[#E5EAF2] rounded-2xl p-4 min-w-[220px]">
                <div className="text-base font-medium text-gray-600 mb-2">Процент опоздавших</div>
                <div className="relative flex items-center justify-center">
                  <svg className="w-28 h-28" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="#E5EAF2" strokeWidth="8" fill="none" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      stroke="#014596" 
                      strokeWidth="8" 
                      fill="none" 
                      strokeDasharray="282.7" 
                      strokeDashoffset={(() => {
                        const progress = isNaN(lateProgress) ? 0 : lateProgress;
                        const offset = 282.7 - (282.7 * progress / 100);
                        return isNaN(offset) ? "282.7" : offset.toString();
                      })()} 
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold text-black">
                    {isNaN(lateProgress) ? 0 : Math.round(lateProgress)}%
                  </span>
                </div>
              </div>
            </div>
            {/* Карточки камер */}
            <div className="flex flex-col gap-4 min-w-[200px]">
              <div className="bg-[#014596] rounded-2xl p-4 text-white flex flex-col gap-2">
                <div className="text-base">Все камеры</div>
                <div className="text-3xl font-bold">2803</div>
                <div className="flex items-center gap-2 text-sm">
                  <svg width="18" height="18" fill="none" className="text-white"><path d="M7 17V9a1.5 1.5 0 0 1 1.5-1.5h7a1.5 1.5 0 0 1 1.5 1.5v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span>658 активных</span>
                  <svg width="18" height="18" fill="none" className="text-white ml-2"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span>198 откл.</span>
                </div>
              </div>
              <div className="bg-[#014596] rounded-2xl p-4 text-white flex flex-col gap-2">
                <div className="text-base">Все камеры</div>
                <div className="text-3xl font-bold">41,695</div>
                <div className="flex items-center gap-2 text-sm">
                  <svg width="18" height="18" fill="none" className="text-white"><path d="M7 14l3-3 3 3M7 10l3-3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span>-398 от вчерашнего дня</span>
                </div>
              </div>
            </div>
            {/* Активность предметов и инциденты */}
            <div className="flex flex-col gap-4 flex-1 min-w-[220px]">
              <div>
                <div className="text-lg font-bold text-[#222B45] mb-1">Активность предметов</div>
                <div className="text-sm text-gray-500 mb-2">Виды принадлежностей <span className="text-green-600">(используется)</span></div>
                <div className="flex gap-6">
                  <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#014596] rounded-lg p-2">
                        <svg width="20" height="20" fill="none"><rect width="20" height="20" rx="6" fill="#fff" fillOpacity=".1"/><path d="M7 17V9a1.5 1.5 0 0 1 1.5-1.5h7a1.5 1.5 0 0 1 1.5 1.5v8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      </span>
                      <span className="text-[#014596] font-semibold">Каски</span>
                    </div>
                    <div className="text-2xl font-bold text-[#222B45]">32,984</div>
                    <div className="w-full h-1 bg-[#E5EAF2] rounded-full mt-2">
                      <div className="h-1 bg-[#014596] rounded-full" style={{ width: `100%` }}></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#014596] rounded-lg p-2">
                        <svg width="20" height="20" fill="none"><rect width="20" height="20" rx="6" fill="#fff" fillOpacity=".1"/><path d="M12 8V12L15 15" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      </span>
                      <span className="text-[#014596] font-semibold">Жилеты</span>
                    </div>
                    <div className="text-2xl font-bold text-[#222B45]">2,42</div>
                    <div className="w-full h-1 bg-[#E5EAF2] rounded-full mt-2">
                      <div className="h-1 bg-[#014596] rounded-full" style={{ width: `80%` }}></div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-[#014596] rounded-lg p-2">
                        <svg width="20" height="20" fill="none"><rect width="20" height="20" rx="6" fill="#fff" fillOpacity=".1"/><path d="M9 9l3 3l-3 3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      </span>
                      <span className="text-[#014596] font-semibold">Камеры</span>
                    </div>
                    <div className="text-2xl font-bold text-[#222B45]">2,400</div>
                    <div className="w-full h-1 bg-[#E5EAF2] rounded-full mt-2">
                      <div className="h-1 bg-[#014596] rounded-full" style={{ width: `60%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center border border-[#E5EAF2] rounded-2xl p-4 min-h-[100px]">
                <div className="text-base text-gray-600 mb-2">Перейти в инциденты</div>
                <svg width="24" height="24" fill="none" className="text-gray-400"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </div>
            </div>
          </div>

          {/* График */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
            <div className="font-bold text-xl text-[#222B45] mb-1">Годовая посещаемость</div>
            <div className="text-green-600 text-sm mb-4">Лучше на (25%) в 2025</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#014596" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#014596" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAF2" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip />
                <Area type="monotone" dataKey="value2" stackId="1" stroke="#22C55E" fillOpacity={1} fill="url(#colorValue2)" />
                <Area type="monotone" dataKey="value" stackId="1" stroke="#014596" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Посещаемость — в самом низу, стилизовано как на скрине */}
          <div className="bg-white rounded-2xl shadow-lg mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b border-gray-200 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-[#222B45] mb-1">Посещаемость</h3>
                <p className="text-gray-400 text-base">Всего записей: {attendance?.length || 0}</p>
              </div>
              <div className="flex flex-1 justify-end items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="20" height="20" fill="none"><circle cx="9" cy="9" r="7" stroke="#BDBDBD" strokeWidth="2"/><path d="M15 15L19 19" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"/></svg>
                  </span>
                  <Input type="text" placeholder="Поиск" className="pl-10 w-48" />
                </div>
                <Button>Экспорт</Button>
                <Button variant="outline">Фильтр</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сотрудник</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Детали</TableHead>
                    <TableHead>Время</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-8 text-base">Нет данных для отображения</TableCell>
                    </TableRow>
                  ) : (
                    attendance?.map((person: AttendanceRecord) => (
                      <TableRow key={person.id}>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">{person.name}</div>
                          <div className="text-sm text-gray-500">{person.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={person.presence ? 'success' : 'destructive'}>{person.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{person.details}</TableCell>
                        <TableCell className="text-sm text-gray-900">{person.time}</TableCell>
                        <TableCell className="text-sm text-gray-500">{person.date}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-blue-900 hover:text-blue-700">Изменить</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
