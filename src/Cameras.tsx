import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useAsyncState } from './hooks/useAsyncState';
import { camerasApi } from './services/api';
import type { Camera } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const Cameras = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: cameras, loading, error, execute: loadCameras } = useAsyncState<Camera[]>({ initialData: [] });

  const fetchCameras = async (): Promise<Camera[]> => {
    try {
      const response = await camerasApi.getCameras({ limit: 50, skip: 0 });
      return response.map((camera: any): Camera => ({
        id: camera.id,
        location: camera.location || 'Неизвестная локация',
        name: camera.name || `Камера ${camera.id}`,
        description: camera.description || 'Описание...',
        status: camera.status === 'active' ? 'active' : 'inactive'
      }));
    } catch (error) {
      console.error('Failed to fetch cameras:', error);
      throw new Error('Не удалось загрузить список камер. Проверьте подключение к серверу.');
    }
  };

  useEffect(() => { loadCameras(fetchCameras); }, [loadCameras]);

  const filteredCameras = cameras?.filter(camera =>
    camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camera.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (error) {
    return (
      <Layout title="Камеры">
        <ErrorState title="Ошибка загрузки камер" message={error.message} onRetry={() => loadCameras(fetchCameras)} className="min-h-[400px]" />
      </Layout>
    );
  }

  return (
    <Layout title="Камеры">
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-[#222B45] mb-2">Видео наблюдение</h3>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 w-4 h-4" role="status" aria-label="Загрузка" />
                  <span className="text-gray-600 text-sm sm:text-base">Загрузка камер...</span>
                </div>
              ) : (
                <p className="text-gray-600 text-sm sm:text-base">
                  {`Количество камер: ${cameras?.length || 0}. Активные ${cameras?.filter(c => c.status === 'active').length || 0}`}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="flex gap-2 sm:gap-3">
                <Button disabled={loading} className="flex-1 sm:flex-none">Добавить камеру</Button>
                <Button variant="outline" disabled={loading} className="flex-1 sm:flex-none">Настройки</Button>
              </div>
              <Input
                type="text"
                placeholder="Поиск камер..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
                className="min-w-0 lg:w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => <SkeletonLoader key={index} type="card" />)}
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredCameras.map((camera) => (
              <Card key={camera.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="aspect-video bg-gray-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto opacity-50 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${camera.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>●</span>
                  </div>
                </div>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{camera.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{camera.location}</p>
                    </div>
                    <Badge variant={camera.status === 'active' ? 'success' : 'destructive'} className="ml-2">
                      {camera.status === 'active' ? 'Активна' : 'Неактивна'}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4">{camera.description}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-blue-900 border-blue-200 hover:bg-blue-50">Просмотр</Button>
                    <Button variant="outline" size="sm" className="flex-1">Настройки</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCameras.length === 0 && (
            <Card className="p-8 sm:p-12 text-center">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">Камеры не найдены</h3>
              <p className="text-gray-500 text-sm sm:text-base">Попробуйте изменить поисковый запрос</p>
            </Card>
          )}
        </>
      )}
    </Layout>
  );
};

export default Cameras;
