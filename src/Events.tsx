import { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useAsyncState } from './hooks/useAsyncState';
import { eventsApi, usersApi } from './services/api';
import type { Event, EventDisplay, EventType } from './types';

const Events = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('entries'); // 'entries' или 'exits'
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  const { data: events, loading, error, execute: loadEvents } = useAsyncState<EventDisplay[]>({
    initialData: []
  });

  // Helper function to resolve user information
  const resolveUserInfo = async (userId: number | null): Promise<{ name: string; email: string }> => {
    if (!userId) {
      return { name: 'Неизвестный пользователь', email: '' };
    }

    try {
      const user = await usersApi.getUser(userId.toString());
      return {
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email
      };
    } catch (error) {
      console.warn(`Failed to fetch user info for user ${userId}:`, error);
      return { name: `Пользователь #${userId}`, email: '' };
    }
  };

  // Determine event type filter based on active filter
  const getEventTypeFilter = (): string | undefined => {
    if (activeFilter === 'entries') {
      // Look for event types that indicate entrance
      const entranceTypes = eventTypes.filter(type =>
        type.name.toLowerCase().includes('entrance') ||
        type.name.toLowerCase().includes('entry') ||
        type.name.toLowerCase().includes('вход')
      );
      return entranceTypes.length > 0 ? entranceTypes[0].name : undefined;
    } else if (activeFilter === 'exits') {
      // Look for event types that indicate exit
      const exitTypes = eventTypes.filter(type =>
        type.name.toLowerCase().includes('exit') ||
        type.name.toLowerCase().includes('выход')
      );
      return exitTypes.length > 0 ? exitTypes[0].name : undefined;
    }
    return undefined;
  };

  // Fetch events from API
  const fetchEvents = useCallback(async (): Promise<EventDisplay[]> => {
    try {
      // Get events from the API with filtering
      const eventTypeFilter = getEventTypeFilter();
      const response = await eventsApi.getEvents({
        limit: 50,  // Reasonable limit for the frontend
        skip: 0,
        search: debouncedSearchQuery || undefined,
        event_type: eventTypeFilter
      });

      // Transform API response to match our frontend EventDisplay interface
      const eventsWithUserInfo = await Promise.all(
        response.map(async (event: Event): Promise<EventDisplay> => {
          const userInfo = await resolveUserInfo(event.user_id);

          return {
            ...event,
            user_name: userInfo.name,
            user_email: userInfo.email,
            time: event.created_at ? new Date(event.created_at).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit'
            }) : new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            date: event.created_at ? new Date(event.created_at).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }) : new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
          };
        })
      );

      return eventsWithUserInfo;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw new Error('Не удалось загрузить список событий. Проверьте подключение к серверу.');
    }
  }, [debouncedSearchQuery, activeFilter, eventTypes]); // Dependencies for useCallback

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load event types on component mount
  useEffect(() => {
    const loadEventTypes = async () => {
      try {
        const types = await eventsApi.getEventTypes();
        setEventTypes(types);
      } catch (error) {
        console.error('Failed to load event types:', error);
      }
    };

    loadEventTypes();
  }, []);

  // Load events when eventTypes are loaded or filters change
  useEffect(() => {
    // Only fetch events if eventTypes are loaded (needed for proper filtering)
    if (eventTypes.length > 0) {
      loadEvents(fetchEvents);
    }
  }, [loadEvents, fetchEvents, eventTypes]);

  const eventsList = events || [];

  // Show error state
  if (error) {
    return (
      <Layout title="События">
        <ErrorState
          title="Ошибка загрузки событий"
          message={error.message}
          onRetry={() => loadEvents(fetchEvents)}
          className="min-h-[400px]"
        />
      </Layout>
    );
  }

  // Handle export functionality
  const handleExport = async () => {
    try {
      const eventTypeFilter = getEventTypeFilter();
      const blob = await eventsApi.exportEvents({
        event_type: eventTypeFilter
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `events_${activeFilter}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export events:', error);
      // You might want to show a toast notification here
    }
  };

  // Handle event details
  const handleEventDetails = async (eventId: number) => {
    try {
      const event = await eventsApi.getEventById(eventId);
      // For now, just log the event details
      // In a real implementation, you might open a modal or navigate to a details page
      console.log('Event details:', event);
      alert(`Событие #${eventId}\nТип: ${event.event_type}\nМестоположение: ${event.location || 'Не указано'}\nДата создания: ${new Date(event.created_at).toLocaleString('ru-RU')}`);
    } catch (error) {
      console.error('Failed to fetch event details:', error);
      alert('Не удалось загрузить детали события');
    }
  };

  // Handle event deletion
  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) {
      return;
    }

    try {
      await eventsApi.deleteEvent(eventId);
      // Reload events after successful deletion
      loadEvents(fetchEvents);
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Не удалось удалить событие');
    }
  };

  const filteredEvents = eventsList.filter(event =>
    (event.user_name && event.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (event.user_email && event.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
    event.event_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="События">
      {/* Фильтры и поиск */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => setActiveFilter('entries')}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 ${activeFilter === 'entries'
                  ? 'bg-[#014596] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Входы
            </button>
            <button
              onClick={() => setActiveFilter('exits')}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 ${activeFilter === 'exits'
                  ? 'bg-[#014596] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Выходы
            </button>
          </div>
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

      {/* События */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#222B45]">События</h3>
              <p className="text-gray-400 text-sm sm:text-base">Список событий системы</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                className="px-4 py-2 bg-[#014596] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading}
                onClick={handleExport}
              >
                Экспорт
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
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{event.user_name || 'Неизвестный пользователь'}</h4>
                      <p className="text-xs text-gray-500">{event.user_email || ''}</p>
                    </div>
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {event.event_type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>{event.location || 'Местоположение не указано'}</span>
                    <div className="text-right">
                      <div>{event.time}</div>
                      <div>{event.date}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 text-blue-900 hover:text-blue-700 text-sm font-medium py-1 border border-blue-200 rounded"
                      onClick={() => handleEventDetails(event.id)}
                    >
                      Подробнее
                    </button>
                    <button
                      className="flex-1 text-red-900 hover:text-red-700 text-sm font-medium py-1 border border-red-200 rounded"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип события</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Местоположение</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{event.user_name || 'Неизвестный пользователь'}</div>
                        <div className="text-sm text-gray-500">{event.user_email || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.location || 'Не указано'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                      <button
                        className="text-blue-900 hover:text-blue-700 font-medium"
                        onClick={() => handleEventDetails(event.id)}
                      >
                        Подробнее
                      </button>
                      <button
                        className="text-red-900 hover:text-red-700 font-medium"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
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

export default Events;
