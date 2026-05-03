import { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useAsyncState } from './hooks/useAsyncState';
import { eventsApi, usersApi } from './services/api';
import type { Event, EventDisplay, EventType } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const Events = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('entries');
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  const { data: events, loading, error, execute: loadEvents } = useAsyncState<EventDisplay[]>({ initialData: [] });

  const resolveUserInfo = async (userId: number | null): Promise<{ name: string; email: string }> => {
    if (!userId) return { name: 'Неизвестный пользователь', email: '' };
    try {
      const user = await usersApi.getUser(userId.toString());
      return { name: `${user.first_name} ${user.last_name}`.trim(), email: user.email };
    } catch (error) {
      console.warn(`Failed to fetch user info for user ${userId}:`, error);
      return { name: `Пользователь #${userId}`, email: '' };
    }
  };

  const getEventTypeFilter = (): string | undefined => {
    if (activeFilter === 'entries') {
      const entranceTypes = eventTypes.filter(type =>
        type.name.toLowerCase().includes('entrance') ||
        type.name.toLowerCase().includes('entry') ||
        type.name.toLowerCase().includes('вход')
      );
      return entranceTypes.length > 0 ? entranceTypes[0].name : undefined;
    } else if (activeFilter === 'exits') {
      const exitTypes = eventTypes.filter(type =>
        type.name.toLowerCase().includes('exit') ||
        type.name.toLowerCase().includes('выход')
      );
      return exitTypes.length > 0 ? exitTypes[0].name : undefined;
    }
    return undefined;
  };

  const fetchEvents = useCallback(async (): Promise<EventDisplay[]> => {
    try {
      const eventTypeFilter = getEventTypeFilter();
      const response = await eventsApi.getEvents({ limit: 50, skip: 0, search: debouncedSearchQuery || undefined, event_type: eventTypeFilter });
      const eventsWithUserInfo = await Promise.all(
        response.map(async (event: Event): Promise<EventDisplay> => {
          const userInfo = await resolveUserInfo(event.user_id ?? null);
          return {
            ...event,
            user_name: userInfo.name,
            user_email: userInfo.email,
            time: event.created_at ? new Date(event.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            date: event.created_at ? new Date(event.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
          };
        })
      );
      return eventsWithUserInfo;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw new Error('Не удалось загрузить список событий. Проверьте подключение к серверу.');
    }
  }, [debouncedSearchQuery, activeFilter, eventTypes]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  useEffect(() => {
    if (eventTypes.length > 0) loadEvents(fetchEvents);
  }, [loadEvents, fetchEvents, eventTypes]);

  const eventsList = events || [];

  if (error) {
    return (
      <Layout title="События">
        <ErrorState title="Ошибка загрузки событий" message={error.message} onRetry={() => loadEvents(fetchEvents)} className="min-h-[400px]" />
      </Layout>
    );
  }

  const handleExport = async () => {
    try {
      const eventTypeFilter = getEventTypeFilter();
      const blob = await eventsApi.exportEvents({ event_type: eventTypeFilter });
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
    }
  };

  const handleEventDetails = async (eventId: number) => {
    try {
      const event = await eventsApi.getEventById(eventId);
      console.log('Event details:', event);
      alert(`Событие #${eventId}\nТип: ${event.event_type}\nМестоположение: ${event.location || 'Не указано'}\nДата создания: ${new Date(event.created_at).toLocaleString('ru-RU')}`);
    } catch (error) {
      console.error('Failed to fetch event details:', error);
      alert('Не удалось загрузить детали события');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это событие?')) return;
    try {
      await eventsApi.deleteEvent(eventId);
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
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={() => setActiveFilter('entries')}
                disabled={loading}
                variant={activeFilter === 'entries' ? 'default' : 'secondary'}
              >
                Входы
              </Button>
              <Button
                onClick={() => setActiveFilter('exits')}
                disabled={loading}
                variant={activeFilter === 'exits' ? 'default' : 'secondary'}
              >
                Выходы
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
                className="w-full sm:w-64"
              />
              <Button variant="secondary" disabled={loading}>Фильтр</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#222B45]">События</h3>
              <p className="text-gray-400 text-sm sm:text-base">Список событий системы</p>
            </div>
            <Button disabled={loading} onClick={handleExport}>Экспорт</Button>
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
              {filteredEvents.map((event) => (
                <Card key={event.id} className="bg-gray-50 shadow-none border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{event.user_name || 'Неизвестный пользователь'}</h4>
                        <p className="text-xs text-gray-500">{event.user_email || ''}</p>
                      </div>
                      <Badge variant="info">{event.event_type}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span>{event.location || 'Местоположение не указано'}</span>
                      <div className="text-right">
                        <div>{event.time}</div>
                        <div>{event.date}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-blue-900 border-blue-200" onClick={() => handleEventDetails(event.id)}>Подробнее</Button>
                      <Button variant="outline" size="sm" className="flex-1 text-red-900 border-red-200" onClick={() => handleDeleteEvent(event.id)}>Удалить</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          {loading ? (
            <SkeletonLoader type="table" rows={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Сотрудник</TableHead>
                  <TableHead>Тип события</TableHead>
                  <TableHead>Местоположение</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">{event.user_name || 'Неизвестный пользователь'}</div>
                      <div className="text-sm text-gray-500">{event.user_email || ''}</div>
                    </TableCell>
                    <TableCell><Badge variant="info">{event.event_type}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-500">{event.location || 'Не указано'}</TableCell>
                    <TableCell className="text-sm">{event.time}</TableCell>
                    <TableCell className="text-sm text-gray-500">{event.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-blue-900 hover:text-blue-700" onClick={() => handleEventDetails(event.id)}>Подробнее</Button>
                        <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-700" onClick={() => handleDeleteEvent(event.id)}>Удалить</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </Layout>
  );
};

export default Events;
