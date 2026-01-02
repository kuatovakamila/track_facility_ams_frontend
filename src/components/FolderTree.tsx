import React, { useState } from 'react';
import { 
  FolderIcon, 
  FolderOpenIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import type { FolderTree as FolderTreeType } from '../types';

interface FolderTreeProps {
  folders: FolderTreeType[];
  currentFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
  className?: string;
}

interface FolderNodeProps {
  folder: FolderTreeType;
  currentFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
  level: number;
}

const FolderNode: React.FC<FolderNodeProps> = ({ 
  folder, 
  currentFolderId, 
  onFolderSelect, 
  level 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = currentFolderId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onFolderSelect(folder.id);
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 rounded cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-blue-100 text-blue-700' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
      >
        <button
          onClick={handleToggle}
          className="flex items-center justify-center w-4 h-4 mr-1 text-gray-400 hover:text-gray-600"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            )
          ) : (
            <div className="w-3 h-3" />
          )}
        </button>
        
        {isSelected || isExpanded ? (
          <FolderOpenIcon className="w-4 h-4 mr-2 text-blue-500" />
        ) : (
          <FolderIcon className="w-4 h-4 mr-2 text-gray-500" />
        )}
        
        <span className="text-sm font-medium truncate flex-1">
          {folder.name}
        </span>
        
        {folder.file_count > 0 && (
          <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {folder.file_count}
          </span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              currentFolderId={currentFolderId}
              onFolderSelect={onFolderSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree: React.FC<FolderTreeProps> = ({ 
  folders, 
  currentFolderId, 
  onFolderSelect, 
  className = '' 
}) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
          <FolderIcon className="w-4 h-4 mr-2" />
          Структура папок
        </h3>
      </div>
      
      <div className="p-2 max-h-96 overflow-y-auto">
        {/* Root folder */}
        <div
          className={`flex items-center py-1 px-2 rounded cursor-pointer transition-colors ${
            currentFolderId === null 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <div className="w-4 h-4 mr-1" />
          <FolderIcon className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium">
            Корневая папка
          </span>
        </div>
        
        {folders.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <DocumentIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Папки не найдены</p>
          </div>
        ) : (
          folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              currentFolderId={currentFolderId}
              onFolderSelect={onFolderSelect}
              level={0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FolderTree;
