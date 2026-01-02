import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useAsyncState } from './hooks/useAsyncState';
import { incidentsApi } from './services/api';
import type { Incident } from './types';

const Incidents = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: incidents, loading, error, execute: loadIncidents } = useAsyncState<Incident[]>({
    initialData: []
  });

  // Fetch incidents from API
  const fetchIncidents = async (): Promise<Incident[]> => {
    try {
      // Get incidents from the API with basic parameters
      const response = await incidentsApi.getIncidents({
        limit: 50,  // Reasonable limit for the frontend
        skip: 0
      });
      
      // Transform API response to match our frontend Incident interface
      return response.map((incident: any): Incident => ({
        id: incident.id,
        name: incident.assigned_to_name || 'Неизвестный пользователь',
        email: incident.assigned_to_email || '',
        incidentType: incident.incident_type || 'Прочее',
        details: incident.description || incident.title || 'Нет описания',
        isLate: incident.priority === 'high' || incident.status === 'urgent',
        time: incident.created_at ? new Date(incident.created_at).toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        date: incident.created_at ? new Date(incident.created_at).toLocaleDateString('ru-RU', { 
          day: '2-digit', 
          month: '2-digit', 
          year: '2-digit' 
        }) : new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
      }));
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      throw new Error('Не удалось загрузить список инцидентов. Проверьте подключение к серверу.');
    }
  };

  useEffect(() => {
    loadIncidents(fetchIncidents);
  }, [loadIncidents]);

  const incidentsList = incidents || [];

  // Show error state
  if (error) {
    return (
      <Layout title="Инциденты">
        <ErrorState
          title="Ошибка загрузки инцидентов"
          message={error.message}
          onRetry={() => loadIncidents(fetchIncidents)}
          className="min-h-[400px]"
        />
      </Layout>
    );
  }

  const filteredIncidents = incidentsList.filter(incident =>
    incident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Инциденты">
      {/* Фильтры и поиск */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button 
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
              disabled={loading}
            >
              Фильтр
            </button>
          </div>
        </div>
      </div>

      {/* Инциденты */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#222B45]">Инциденты</h3>
              <p className="text-gray-400 text-sm sm:text-base">Список нарушений и опоздания</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button 
                className="px-4 py-2 bg-[#014596] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading}
              >
                Экспорт
              </button>
              <button 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                disabled={loading}
              >
                Добавить
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
              {filteredIncidents.map((incident) => (
              <div key={incident.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{incident.name}</h4>
                    <p className="text-xs text-gray-500">{incident.email}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    incident.isLate 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {incident.incidentType}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span>{incident.details}</span>
                  <div className="text-right">
                    <div>{incident.time}</div>
                    <div>{incident.date}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 text-blue-900 hover:text-blue-700 text-sm font-medium py-1 border border-blue-200 rounded">
                    Подробнее
                  </button>
                  <button className="flex-1 text-red-900 hover:text-red-700 text-sm font-medium py-1 border border-red-200 rounded">
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          {loading ? (
            <SkeletonLoader type="table" rows={5} />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип инцидента</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Детали</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIncidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{incident.name}</div>
                      <div className="text-sm text-gray-500">{incident.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      incident.isLate 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {incident.incidentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{incident.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{incident.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{incident.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                    <button className="text-blue-900 hover:text-blue-700 font-medium">
                      Подробнее
                    </button>
                    <button className="text-red-900 hover:text-red-700 font-medium">
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Incidents;
