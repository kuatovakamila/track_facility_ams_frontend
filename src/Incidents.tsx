import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useAsyncState } from './hooks/useAsyncState';
import { incidentsApi } from './services/api';
import type { Incident } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const Incidents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: incidents, loading, error, execute: loadIncidents } = useAsyncState<Incident[]>({ initialData: [] });

  const fetchIncidents = async (): Promise<Incident[]> => {
    try {
      const response = await incidentsApi.getIncidents({ limit: 50, skip: 0 });
      return response.map((incident: any): Incident => ({
        id: incident.id,
        name: incident.assigned_to_name || 'Неизвестный пользователь',
        email: incident.assigned_to_email || '',
        incidentType: incident.incident_type || 'Прочее',
        details: incident.description || incident.title || 'Нет описания',
        isLate: incident.priority === 'high' || incident.status === 'urgent',
        time: incident.created_at ? new Date(incident.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        date: incident.created_at ? new Date(incident.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
      }));
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      throw new Error('Не удалось загрузить список инцидентов. Проверьте подключение к серверу.');
    }
  };

  useEffect(() => { loadIncidents(fetchIncidents); }, [loadIncidents]);

  const incidentsList = incidents || [];

  if (error) {
    return (
      <Layout title="Инциденты">
        <ErrorState title="Ошибка загрузки инцидентов" message={error.message} onRetry={() => loadIncidents(fetchIncidents)} className="min-h-[400px]" />
      </Layout>
    );
  }

  const filteredIncidents = incidentsList.filter(incident =>
    incident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout title="Инциденты">
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-4">
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
              <h3 className="text-xl sm:text-2xl font-bold text-[#222B45]">Инциденты</h3>
              <p className="text-gray-400 text-sm sm:text-base">Список нарушений и опоздания</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button disabled={loading}>Экспорт</Button>
              <Button variant="outline" disabled={loading}>Добавить</Button>
            </div>
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
              {filteredIncidents.map((incident) => (
                <Card key={incident.id} className="bg-gray-50 shadow-none border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{incident.name}</h4>
                        <p className="text-xs text-gray-500">{incident.email}</p>
                      </div>
                      <Badge variant={incident.isLate ? 'destructive' : 'warning'}>{incident.incidentType}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span>{incident.details}</span>
                      <div className="text-right">
                        <div>{incident.time}</div>
                        <div>{incident.date}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-blue-900 border-blue-200">Подробнее</Button>
                      <Button variant="outline" size="sm" className="flex-1 text-red-900 border-red-200">Удалить</Button>
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
                  <TableHead>Тип инцидента</TableHead>
                  <TableHead>Детали</TableHead>
                  <TableHead>Время</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">{incident.name}</div>
                      <div className="text-sm text-gray-500">{incident.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={incident.isLate ? 'destructive' : 'warning'}>{incident.incidentType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{incident.details}</TableCell>
                    <TableCell className="text-sm">{incident.time}</TableCell>
                    <TableCell className="text-sm text-gray-500">{incident.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-blue-900 hover:text-blue-700">Подробнее</Button>
                        <Button variant="ghost" size="sm" className="text-red-900 hover:text-red-700">Удалить</Button>
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

export default Incidents;
