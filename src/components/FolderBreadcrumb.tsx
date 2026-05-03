import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import type { BreadcrumbItem } from '../types';
import { Button } from '@/components/ui/button';

interface FolderBreadcrumbProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (folderId: number | null) => void;
}

const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({ breadcrumbs, onNavigate }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="flex items-center h-auto p-1 hover:text-blue-600"
      >
        <HomeIcon className="w-4 h-4 mr-1" />
        Корневая папка
      </Button>

      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.id || 'root'}>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.id)}
            className={`h-auto p-1 hover:text-blue-600 ${
              index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}
          >
            {item.name}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default FolderBreadcrumb;
