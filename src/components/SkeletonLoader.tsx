import React from 'react';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'table' | 'dashboard';
  rows?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  type = 'text', 
  rows = 3,
  className = ''
}) => {
  const renderTextSkeleton = () => (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div 
            className={`h-4 bg-gray-200 rounded ${
              index === rows - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        </div>
      ))}
    </div>
  );

  const renderCardSkeleton = () => (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="px-6 py-4 flex space-x-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDashboardSkeleton = () => (
    <div className={`space-y-6 ${className}`}>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Chart area */}
      <div className="animate-pulse">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'card':
      return renderCardSkeleton();
    case 'table':
      return renderTableSkeleton();
    case 'dashboard':
      return renderDashboardSkeleton();
    default:
      return renderTextSkeleton();
  }
};

export default SkeletonLoader;
