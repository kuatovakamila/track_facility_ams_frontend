import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import FilePreviewModal from './components/FilePreviewModal';
import FolderTree from './components/FolderTree';
import FolderBreadcrumb from './components/FolderBreadcrumb';
import FolderCreateModal from './components/FolderCreateModal';
import { 
  MagnifyingGlassIcon, 
  DocumentIcon, 
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  EyeIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon
} from '@heroicons/react/24/outline';
import { 
  formatFileSize, 
  getFileTypeDisplay, 
  getAuthorName 
} from './data/mockData';
import { filesApi, foldersApi } from './services/api';
import type {
  FileMetadata,
  Folder,
  FolderTree as FolderTreeType,
  BreadcrumbItem,
  FolderCreate
} from './types';

const Files = () => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderTree, setFolderTree] = useState<FolderTreeType[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedFiles = await filesApi.getFiles({ folder_id: currentFolderId });
      setFiles(fetchedFiles);

      const fetchedFolders = await foldersApi.getFolders(currentFolderId);
      setFolders(fetchedFolders);

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Не удалось загрузить данные. Бэкенд мог быть неактивен — попробуйте ещё раз.');
      setFiles([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  // Load data on component mount and when current folder changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load folder tree on component mount
  useEffect(() => {
    const loadFolderTree = async () => {
      try {
        const tree = await foldersApi.getFolderTree();
        setFolderTree(tree);
      } catch (error) {
        console.error('Error loading folder tree:', error);
        // Don't show error for folder tree as it's not critical
      }
    };

    loadFolderTree();
  }, []);

  // Update breadcrumbs when current folder changes
  useEffect(() => {
    const updateBreadcrumbs = () => {
      if (currentFolderId === null) {
        setBreadcrumbs([]);
        return;
      }

      // Find the path to current folder
      const findPath = (folders: FolderTreeType[], targetId: number): BreadcrumbItem[] | null => {
        for (const folder of folders) {
          if (folder.id === targetId) {
            return [{ id: folder.id, name: folder.name, path: folder.path }];
          }
          
          if (folder.children && folder.children.length > 0) {
            const childPath = findPath(folder.children, targetId);
            if (childPath) {
              return [
                { id: folder.id, name: folder.name, path: folder.path },
                ...childPath
              ];
            }
          }
        }
        return null;
      };

      const path = findPath(folderTree, currentFolderId);
      setBreadcrumbs(path || []);
    };

    updateBreadcrumbs();
  }, [currentFolderId, folderTree]);

  // Filter files based on search query and date range
  const filteredFiles = files.filter(file => {
    const matchesSearch = searchQuery === '' || 
      file.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getAuthorName(file.uploaded_by).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const totalFiles = files.length;
      const uploadedFiles: FileMetadata[] = [];

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        // Update progress for each file
        const baseProgress = (i / totalFiles) * 100;
        setUploadProgress(baseProgress);

        try {
          // Upload file to backend with current folder
          const uploadResponse = await filesApi.uploadFile(file, undefined, currentFolderId || undefined);
          
          // Convert backend response to FileMetadata format
          const newFile: FileMetadata = {
            id: uploadResponse.file.id,
            filename: uploadResponse.file.filename,
            original_filename: uploadResponse.file.original_filename,
            file_size: uploadResponse.file.file_size,
            mime_type: uploadResponse.file.mime_type,
            uploaded_by: uploadResponse.file.uploaded_by,
            incident_id: uploadResponse.file.incident_id,
            folder_id: uploadResponse.file.folder_id,
            created_at: uploadResponse.file.created_at,
            updated_at: uploadResponse.file.updated_at
          };

          uploadedFiles.push(newFile);
          
          // Update progress to show completion of this file
          setUploadProgress(((i + 1) / totalFiles) * 100);
          
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error);
          const reason = error instanceof Error ? error.message : String(error);
          setError(`Не удалось загрузить файл "${file.name}": ${reason}`);
        }
      }

      // Add successfully uploaded files to the list
      if (uploadedFiles.length > 0) {
        setFiles(prev => [...uploadedFiles, ...prev]);
        setSuccess(`Успешно загружено ${uploadedFiles.length} файл(ов)`);
        setTimeout(() => setSuccess(null), 3000); // Clear success message after 3 seconds
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setError('Ошибка при загрузке файлов');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  // Handle file actions
  const handleFileAction = async (fileId: number, action: 'view' | 'download' | 'delete') => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      setError(null);
      switch (action) {
        case 'view':
          // Open file preview modal
          setPreviewFile(file);
          break;
        case 'download':
          // Download file from backend
          const blob = await filesApi.downloadFile(fileId);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.original_filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          break;
        case 'delete':
          // Delete file with confirmation
          if (window.confirm(`Удалить файл "${file.original_filename}"?`)) {
            await filesApi.deleteFile(fileId);
            setFiles(prev => prev.filter(f => f.id !== fileId));
            setSuccess(`Файл "${file.original_filename}" удален`);
            setTimeout(() => setSuccess(null), 3000);
          }
          break;
      }
    } catch (error) {
      console.error(`Error ${action}ing file:`, error);
      setError(`Не удалось выполнить операцию с файлом "${file.original_filename}"`);
    }
  };

  // Close file preview
  const closePreview = () => {
    setPreviewFile(null);
  };

  // Handle download from preview modal
  const handleDownloadFromPreview = async () => {
    if (previewFile) {
      await handleFileAction(previewFile.id, 'download');
    }
  };

  // Handle delete from preview modal
  const handleDeleteFromPreview = async () => {
    if (previewFile) {
      if (window.confirm(`Удалить файл "${previewFile.original_filename}"?`)) {
        try {
          await filesApi.deleteFile(previewFile.id);
          setFiles(prev => prev.filter(f => f.id !== previewFile.id));
          setSuccess(`Файл "${previewFile.original_filename}" удален`);
          setTimeout(() => setSuccess(null), 3000);
          closePreview(); // Close modal after deletion
        } catch (error) {
          console.error('Error deleting file:', error);
          setError(`Не удалось удалить файл "${previewFile.original_filename}"`);
        }
      }
    }
  };

  // Handle folder navigation
  const handleFolderNavigation = (folderId: number | null) => {
    setCurrentFolderId(folderId);
  };

  // Handle folder creation
  const handleCreateFolder = async (folderData: FolderCreate) => {
    try {
      const newFolder = await foldersApi.createFolder(folderData);
      setFolders(prev => [...prev, newFolder]);
      setSuccess(`Папка "${newFolder.name}" создана`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh folder tree
      const tree = await foldersApi.getFolderTree();
      setFolderTree(tree);
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  // Handle folder double-click to navigate
  const handleFolderDoubleClick = (folderId: number) => {
    setCurrentFolderId(folderId);
  };

  // Handle folder deletion
  const handleDeleteFolder = async (folderId: number, folderName: string) => {
    if (window.confirm(`Удалить папку "${folderName}" и все её содержимое?`)) {
      try {
        await foldersApi.deleteFolder(folderId);
        setFolders(prev => prev.filter(f => f.id !== folderId));
        setSuccess(`Папка "${folderName}" удалена`);
        setTimeout(() => setSuccess(null), 3000);
        
        // Refresh folder tree
        const tree = await foldersApi.getFolderTree();
        setFolderTree(tree);
      } catch (error) {
        console.error('Error deleting folder:', error);
        setError(`Не удалось удалить папку "${folderName}"`);
      }
    }
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xs font-semibold">IMG</div>;
    } else if (mimeType === 'application/pdf') {
      return <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-xs font-semibold">PDF</div>;
    } else if (mimeType.startsWith('text/')) {
      return <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-semibold">TXT</div>;
    } else if (mimeType.startsWith('application/vnd.ms-excel') || mimeType.includes('spreadsheet')) {
      return <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xs font-semibold">XLS</div>;
    } else {
      return <DocumentIcon className="w-8 h-8 text-gray-400" />;
    }
  };

  // Get folder icon
  const getFolderIcon = () => {
    return <FolderIcon className="w-8 h-8 text-blue-500" />;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout title="Файлообменник">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" message="Загрузка файлов..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Файлообменник">
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <span className="text-green-600 text-sm font-medium">{success}</span>
            <Button variant="ghost" size="icon" onClick={() => setSuccess(null)} className="ml-auto h-6 w-6 text-green-400 hover:text-green-600">×</Button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <span className="text-red-600 text-sm font-medium">{error}</span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadData} className="text-red-600 border-red-300 hover:bg-red-100">Повторить</Button>
              <Button variant="ghost" size="icon" onClick={() => setError(null)} className="h-6 w-6 text-red-400 hover:text-red-600">×</Button>
            </div>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <FolderBreadcrumb 
          breadcrumbs={breadcrumbs}
          onNavigate={handleFolderNavigation}
        />

        {/* Header with Search and Upload */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск файлов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowCreateFolderModal(true)} className="bg-green-600 hover:bg-green-700">
              <FolderPlusIcon className="w-5 h-5" />
              Создать папку
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <CloudArrowUpIcon className="w-5 h-5" />
              Загрузить файл
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            aria-label="Выбрать файлы для загрузки"
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Загрузка файлов...</span>
              <span className="text-sm text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Folder Tree Sidebar */}
          <div className="lg:col-span-1">
            <FolderTree
              folders={folderTree}
              currentFolderId={currentFolderId}
              onFolderSelect={handleFolderNavigation}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Drag and Drop Area */}
            <div
              ref={dropRef}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Перетащите файлы сюда или{' '}
                <Button variant="link" onClick={() => fileInputRef.current?.click()} className="h-auto p-0 text-blue-600 hover:text-blue-700 font-medium">
                  выберите файлы
                </Button>
              </p>
              <p className="text-sm text-gray-500">
                Поддерживаются: PDF, DOC, TXT, изображения (до 10 МБ)
                {currentFolderId && (
                  <span className="block mt-1">
                    Файлы будут загружены в текущую папку
                  </span>
                )}
              </p>
            </div>

            {/* Files and Folders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Размер</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Автор</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folders.map((folder) => (
                    <TableRow
                      key={`folder-${folder.id}`}
                      className="cursor-pointer"
                      onDoubleClick={() => handleFolderDoubleClick(folder.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFolderIcon()}
                          <div>
                            <div className="font-medium text-gray-900">{folder.name}</div>
                            {folder.description && <div className="text-sm text-gray-500">{folder.description}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">Папка</TableCell>
                      <TableCell className="text-sm text-gray-600">—</TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(folder.created_at)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{getAuthorName(folder.created_by)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleFolderDoubleClick(folder.id)} title="Открыть папку" className="text-blue-600 hover:text-blue-700 h-8 w-8">
                            <FolderOpenIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFolder(folder.id, folder.name)} title="Удалить папку" className="text-red-600 hover:text-red-700 h-8 w-8">
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.mime_type)}
                          <div className="font-medium text-gray-900">{file.original_filename}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="muted">{getFileTypeDisplay(file.mime_type)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatFileSize(file.file_size)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(file.created_at)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{getAuthorName(file.uploaded_by)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleFileAction(file.id, 'view')} aria-label="Просмотр файла" className="text-blue-600 hover:bg-blue-100 h-8 w-8">
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleFileAction(file.id, 'download')} aria-label="Скачать файл" className="text-green-600 hover:bg-green-100 h-8 w-8">
                            <DocumentArrowDownIcon className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleFileAction(file.id, 'delete')} aria-label="Удалить файл" className="text-red-600 hover:bg-red-100 h-8 w-8">
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {folders.length === 0 && filteredFiles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <DocumentIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">
                          {searchQuery ? 'Ничего не найдено' : 'Папка пуста'}
                        </h3>
                        <p className="text-gray-500">
                          {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Создайте папку или загрузите файлы'}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-blue-600">{folders.length}</div>
                <div className="text-sm text-gray-600">Папок</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{files.length}</div>
                <div className="text-sm text-gray-600">Файлов</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">
                  {formatFileSize(files.reduce((total, file) => total + file.file_size, 0))}
                </div>
                <div className="text-sm text-gray-600">Общий размер</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(files.map(f => f.uploaded_by)).size}
                </div>
                <div className="text-sm text-gray-600">Авторов</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={closePreview}
          onDownload={handleDownloadFromPreview}
          onDelete={handleDeleteFromPreview}
        />
      )}

      {/* Folder Create Modal */}
      <FolderCreateModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onSubmit={handleCreateFolder}
        parentFolderId={currentFolderId}
        parentFolderName={
          currentFolderId === null 
            ? 'Корневая папка' 
            : breadcrumbs[breadcrumbs.length - 1]?.name || 'Текущая папка'
        }
      />
    </Layout>
  );
};

export default Files;
