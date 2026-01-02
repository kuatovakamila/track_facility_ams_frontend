import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useDataContext } from './contexts/DataContext';
import { useAppContext } from './contexts/AppContext';
import { dashboardApi } from './services/api';
import { mockChartData, mockDashboardStats } from './data/mockData';
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
      // Get employee summary data from the API
      const response = await dashboardApi.getEmployeesSummary();
      
      // For now, if the API doesn't return attendance records,
      // we'll return an empty array and handle it gracefully
      // The real implementation would depend on the actual API response structure
      if (Array.isArray(response)) {
        return response.map((employee: any): AttendanceRecord => ({
          id: employee.id || Math.random(),
          name: employee.name || 'Неизвестный сотрудник',
          email: employee.email || '',
          status: employee.status || 'Отсутствует',
          details: employee.details || 'Нет данных',
          presence: employee.present || false,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
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
      // Try to get dashboard stats for chart data
      const response = await dashboardApi.getDashboardStats();
      
      // For now, return mock chart data since the API might not have specific chart format
      // In a real implementation, you'd transform the API response to chart format
      return mockChartData;
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      // Fallback to mock data on error to ensure the dashboard doesn't break
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

  // Animation for progress bars
  useEffect(() => {
    if (!attendanceLoading && attendance) {
      const timer1 = setTimeout(() => {
        const totalEmployees = attendance.length;
        const presentEmployees = attendance.filter(person => person.presence).length;
        const attendancePercentage = totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0;
        setAttendanceProgress(isNaN(attendancePercentage) ? 0 : attendancePercentage);
      }, 300);
      
      const timer2 = setTimeout(() => {
        const totalEmployees = attendance.length;
        const lateEmployees = attendance.filter((person: AttendanceRecord) => person.status === 'late').length;
        const latePercentage = totalEmployees > 0 ? (lateEmployees / totalEmployees) * 100 : 0;
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
                {/* Поиск */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="20" height="20" fill="none"><circle cx="9" cy="9" r="7" stroke="#BDBDBD" strokeWidth="2"/><path d="M15 15L19 19" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round"/></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Поиск"
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition w-48"
                  />
                </div>
                {/* Кнопки */}
                <button className="px-5 py-2 bg-[#014596] text-white rounded-lg text-base font-medium hover:bg-blue-700 transition disabled:opacity-50">Экспорт</button>
                <button className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-base font-medium hover:bg-gray-50 transition disabled:opacity-50">Фильтр</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Детали</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-8 text-base">Нет данных для отображения</td>
                    </tr>
                  ) : (
                    attendance?.map((person: AttendanceRecord) => (
                      <tr key={person.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{person.name}</div>
                          <div className="text-sm text-gray-500">{person.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            person.presence 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {person.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.details}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{person.time}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-blue-900 hover:text-blue-700 text-sm font-medium">Изменить</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
