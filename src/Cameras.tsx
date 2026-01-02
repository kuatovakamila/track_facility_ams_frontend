import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ErrorState from './components/ErrorState';
import SkeletonLoader from './components/SkeletonLoader';
import { useAsyncState } from './hooks/useAsyncState';
import { camerasApi } from './services/api';
import type { Camera } from './types';

const Cameras = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: cameras, loading, error, execute: loadCameras } = useAsyncState<Camera[]>({
    initialData: []
  });

  // Fetch cameras from API
  const fetchCameras = async (): Promise<Camera[]> => {
    try {
      // Get cameras from the API with basic parameters
      const response = await camerasApi.getCameras({
        limit: 50,  // Reasonable limit for the frontend
        skip: 0
      });
      
      // Transform API response to match our frontend Camera interface
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

  useEffect(() => {
    loadCameras(fetchCameras);
  }, [loadCameras]);

  const filteredCameras = cameras?.filter(camera =>
    camera.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    camera.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Show error state
  if (error) {
    return (
      <Layout title="Камеры">
        <ErrorState
          title="Ошибка загрузки камер"
          message={error.message}
          onRetry={() => loadCameras(fetchCameras)}
          className="min-h-[400px]"
        />
      </Layout>
    );
  }

  return (
    <Layout title="Камеры">
      {/* Блок видео наблюдения */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-[#222B45] mb-2">Видео наблюдение</h3>
            {loading ? (
              <div className="flex items-center gap-2">
                <div
                  className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 w-4 h-4"
                  role="status"
                  aria-label="Загрузка"
                />
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
              <button 
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-[#014596] text-white rounded-lg font-medium text-sm sm:text-base hover:bg-blue-800 transition disabled:opacity-50"
                disabled={loading}
              >
                Добавить камеру
              </button>
              <button 
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm sm:text-base hover:bg-gray-50 transition disabled:opacity-50"
                disabled={loading}
              >
                Настройки
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Поиск камер..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              className="px-4 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 lg:w-64 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonLoader key={index} type="card" />
          ))}
        </div>
      )}

      {/* Сетка камер */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredCameras.map((camera) => (
              <div key={camera.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Превью камеры */}
                <div className="aspect-video bg-gray-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Статус камеры */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      camera.status === 'active' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {camera.status === 'active' ? '●' : '●'}
                    </span>
                  </div>
                </div>
                
                {/* Информация о камере */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{camera.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{camera.location}</p>
                    </div>
                    <span className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      camera.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {camera.status === 'active' ? 'Активна' : 'Неактивна'}
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-gray-500 mb-4">{camera.description}</p>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 text-blue-900 hover:text-blue-700 text-xs sm:text-sm font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition">
                      Просмотр
                    </button>
                    <button className="flex-1 text-gray-900 hover:text-gray-700 text-xs sm:text-sm font-medium py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      Настройки
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Пустое состояние */}
          {filteredCameras.length === 0 && !loading && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">Камеры не найдены</h3>
              <p className="text-gray-500 text-sm sm:text-base">Попробуйте изменить поисковый запрос</p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default Cameras;
