import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
        <Skeleton key={index} className={`h-4 ${index === rows - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );

  const renderCardSkeleton = () => (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/4" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <Skeleton className="h-6 w-1/3" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="px-6 py-4 flex space-x-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderDashboardSkeleton = () => (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'card': return renderCardSkeleton();
    case 'table': return renderTableSkeleton();
    case 'dashboard': return renderDashboardSkeleton();
    default: return renderTextSkeleton();
  }
};

export default SkeletonLoader;
