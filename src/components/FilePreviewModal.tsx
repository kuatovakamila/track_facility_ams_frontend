import React, { useEffect, useState } from 'react';
import { XMarkIcon, DocumentArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { FileMetadata } from '../types';
import { formatFileSize, getFileTypeDisplay, getAuthorName } from '../data/mockData';
import { filesApi } from '../services/api';

interface FilePreviewModalProps {
  file: FileMetadata;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDelete?: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onDelete
}) => {
  const [textContent, setTextContent] = useState<string>('');
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // File type detection
  const isImage = file.mime_type.startsWith('image/');
  const isPDF = file.mime_type === 'application/pdf';
  const isText = file.mime_type.startsWith('text/');

  // Load text content for text files
  useEffect(() => {
    if (isOpen && isText && !textContent && !loadingText) {
      setLoadingText(true);
      setTextError(null);
      
      filesApi.getFileContent(file.id)
        .then(content => {
          setTextContent(content);
        })
        .catch(error => {
          console.error('Failed to load text content:', error);
          setTextError('Не удалось загрузить содержимое файла');
        })
        .finally(() => {
          setLoadingText(false);
        });
    }
  }, [isOpen, isText, file.id, textContent, loadingText]);

  // Load image content for image files
  useEffect(() => {
    if (isOpen && isImage && !imageBlob && !loadingImage) {
      setLoadingImage(true);
      setImageError(null);
      
      filesApi.downloadFile(file.id)
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setImageBlob(url);
        })
        .catch(error => {
          console.error('Failed to load image content:', error);
          setImageError('Не удалось загрузить изображение');
        })
        .finally(() => {
          setLoadingImage(false);
        });
    }
  }, [isOpen, isImage, file.id, imageBlob, loadingImage]);

  // Load PDF content for PDF files
  useEffect(() => {
    if (isOpen && isPDF && !pdfBlob && !loadingPdf) {
      setLoadingPdf(true);
      setPdfError(null);
      
      filesApi.downloadFile(file.id)
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setPdfBlob(url);
        })
        .catch(error => {
          console.error('Failed to load PDF content:', error);
          setPdfError('Не удалось загрузить PDF файл');
        })
        .finally(() => {
          setLoadingPdf(false);
        });
    }
  }, [isOpen, isPDF, file.id, pdfBlob, loadingPdf]);

  // Cleanup blob URLs when component unmounts or modal closes
  useEffect(() => {
    if (!isOpen) {
      if (imageBlob) {
        URL.revokeObjectURL(imageBlob);
        setImageBlob(null);
      }
      if (pdfBlob) {
        URL.revokeObjectURL(pdfBlob);
        setPdfBlob(null);
      }
      setTextContent('');
      setTextError(null);
      setImageError(null);
      setPdfError(null);
    }
  }, [isOpen, imageBlob, pdfBlob]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'd':
        case 'D':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onDownload();
          }
          break;
        case 'Delete':
          if (onDelete) {
            event.preventDefault();
            onDelete();
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onDownload, onDelete]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilePreviewContent = () => {
    if (isImage) {
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg h-96">
          {loadingImage ? (
            <div className="text-gray-500 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
              <div>Загрузка изображения...</div>
            </div>
          ) : imageError ? (
            <div className="text-red-500 text-center">
              <div className="text-lg mb-2">Ошибка загрузки изображения</div>
              <div className="text-sm">{imageError}</div>
              <div className="text-sm mt-2">
                <a 
                  href={filesApi.getFileUrl(file.id)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Открыть файл в новой вкладке
                </a>
              </div>
            </div>
          ) : imageBlob ? (
            <img
              src={imageBlob}
              alt={file.original_filename}
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-gray-500 text-center">
              <div className="text-lg mb-2">Предварительный просмотр недоступен</div>
              <div className="text-sm">Используйте кнопку "Скачать" для просмотра файла</div>
            </div>
          )}
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="flex items-center justify-center bg-gray-100 rounded-lg h-96">
          {loadingPdf ? (
            <div className="text-gray-500 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
              <div>Загрузка PDF...</div>
            </div>
          ) : pdfError ? (
            <div className="text-red-500 text-center">
              <div className="text-lg mb-2">Ошибка загрузки PDF</div>
              <div className="text-sm">{pdfError}</div>
              <div className="text-sm mt-2">
                <a 
                  href={filesApi.getFileUrl(file.id)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Открыть файл в новой вкладке
                </a>
              </div>
            </div>
          ) : pdfBlob ? (
            <iframe
              src={pdfBlob}
              className="w-full h-full rounded-lg"
              title={file.original_filename}
            />
          ) : (
            <div className="text-gray-500 text-center">
              <div className="text-lg mb-2">Предварительный просмотр недоступен</div>
              <div className="text-sm">Используйте кнопку "Скачать" для просмотра файла</div>
            </div>
          )}
        </div>
      );
    }

    if (isText) {
      return (
        <div className="bg-gray-100 rounded-lg h-96 p-4 overflow-auto">
          {loadingText ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                <div>Загрузка содержимого...</div>
              </div>
            </div>
          ) : textError ? (
            <div className="text-red-500 text-center py-20">
              <div className="text-lg mb-2">Ошибка загрузки</div>
              <div className="text-sm">{textError}</div>
              <div className="text-sm mt-2">
                <a 
                  href={filesApi.getFileUrl(file.id)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Открыть файл в новой вкладке
                </a>
              </div>
            </div>
          ) : textContent ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{textContent}</pre>
          ) : (
            <div className="text-gray-500 text-center py-20">
              <div className="text-lg mb-2">Предварительный просмотр текстового файла</div>
              <div className="text-sm">Содержимое файла будет загружено здесь</div>
              <div className="text-sm mt-2">
                <a 
                  href={filesApi.getFileUrl(file.id)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Открыть файл в новой вкладке
                </a>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default preview for other file types
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg h-96">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-gray-600">
              {getFileTypeDisplay(file.mime_type)}
            </span>
          </div>
          <div className="text-lg mb-2">Предварительный просмотр недоступен</div>
          <div className="text-sm">Используйте кнопку "Скачать" для просмотра файла</div>
          <div className="text-sm mt-2">
            <a 
              href={filesApi.getFileUrl(file.id)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Открыть файл в новой вкладке
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 truncate">
              {file.original_filename}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Тип: {getFileTypeDisplay(file.mime_type)}</span>
              <span>Размер: {formatFileSize(file.file_size)}</span>
              <span>Дата: {formatDate(file.created_at)}</span>
              <span>Автор: {getAuthorName(file.uploaded_by)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Скачать файл (Ctrl+D)"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Скачать
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Удалить файл (Delete)"
              >
                <TrashIcon className="w-5 h-5" />
                Удалить
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Закрыть предварительный просмотр"
              title="Закрыть (Esc)"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {getFilePreviewContent()}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
