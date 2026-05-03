import React, { useEffect, useState } from 'react';
import { DocumentArrowDownIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { FileMetadata } from '../types';
import { formatFileSize, getFileTypeDisplay, getAuthorName } from '../data/mockData';
import { filesApi } from '../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FilePreviewModalProps {
  file: FileMetadata;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDelete?: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, isOpen, onClose, onDownload, onDelete }) => {
  const [textContent, setTextContent] = useState<string>('');
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const isImage = file.mime_type.startsWith('image/');
  const isPDF = file.mime_type === 'application/pdf';
  const isText = file.mime_type.startsWith('text/');

  useEffect(() => {
    if (isOpen && isText && !textContent && !loadingText) {
      setLoadingText(true);
      setTextError(null);
      filesApi.getFileContent(file.id).then(setTextContent).catch((error) => { console.error('Failed to load text content:', error); setTextError('Не удалось загрузить содержимое файла'); }).finally(() => setLoadingText(false));
    }
  }, [isOpen, isText, file.id, textContent, loadingText]);

  useEffect(() => {
    if (isOpen && isImage && !imageBlob && !loadingImage) {
      setLoadingImage(true);
      setImageError(null);
      filesApi.downloadFile(file.id).then(blob => setImageBlob(URL.createObjectURL(blob))).catch((error) => { console.error('Failed to load image:', error); setImageError('Не удалось загрузить изображение'); }).finally(() => setLoadingImage(false));
    }
  }, [isOpen, isImage, file.id, imageBlob, loadingImage]);

  useEffect(() => {
    if (isOpen && isPDF && !pdfBlob && !loadingPdf) {
      setLoadingPdf(true);
      setPdfError(null);
      filesApi.downloadFile(file.id).then(blob => setPdfBlob(URL.createObjectURL(blob))).catch((error) => { console.error('Failed to load PDF:', error); setPdfError('Не удалось загрузить PDF файл'); }).finally(() => setLoadingPdf(false));
    }
  }, [isOpen, isPDF, file.id, pdfBlob, loadingPdf]);

  useEffect(() => {
    if (!isOpen) {
      if (imageBlob) { URL.revokeObjectURL(imageBlob); setImageBlob(null); }
      if (pdfBlob) { URL.revokeObjectURL(pdfBlob); setPdfBlob(null); }
      setTextContent(''); setTextError(null); setImageError(null); setPdfError(null);
    }
  }, [isOpen, imageBlob, pdfBlob]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === 'Escape') onClose();
      if ((event.key === 'd' || event.key === 'D') && (event.ctrlKey || event.metaKey)) { event.preventDefault(); onDownload(); }
      if (event.key === 'Delete' && onDelete) { event.preventDefault(); onDelete(); }
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onDownload, onDelete]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const spinnerEl = <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2" />;

  const getFilePreviewContent = () => {
    if (isImage) return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg h-96">
        {loadingImage ? <div className="text-gray-500 text-center">{spinnerEl}<div>Загрузка изображения...</div></div>
          : imageError ? <div className="text-red-500 text-center"><div className="text-lg mb-2">Ошибка загрузки изображения</div><div className="text-sm">{imageError}</div><a href={filesApi.getFileUrl(file.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline text-sm mt-2 block">Открыть в новой вкладке</a></div>
          : imageBlob ? <img src={imageBlob} alt={file.original_filename} className="max-h-full max-w-full object-contain rounded-lg" />
          : <div className="text-gray-500 text-center"><div className="text-lg mb-2">Предварительный просмотр недоступен</div></div>}
      </div>
    );

    if (isPDF) return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg h-96">
        {loadingPdf ? <div className="text-gray-500 text-center">{spinnerEl}<div>Загрузка PDF...</div></div>
          : pdfError ? <div className="text-red-500 text-center"><div className="text-lg mb-2">Ошибка загрузки PDF</div><div className="text-sm">{pdfError}</div><a href={filesApi.getFileUrl(file.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline text-sm mt-2 block">Открыть в новой вкладке</a></div>
          : pdfBlob ? <iframe src={pdfBlob} className="w-full h-full rounded-lg" title={file.original_filename} />
          : <div className="text-gray-500 text-center"><div className="text-lg mb-2">Предварительный просмотр недоступен</div></div>}
      </div>
    );

    if (isText) return (
      <div className="bg-gray-100 rounded-lg h-96 p-4 overflow-auto">
        {loadingText ? <div className="flex items-center justify-center h-full"><div className="text-gray-500 text-center">{spinnerEl}<div>Загрузка содержимого...</div></div></div>
          : textError ? <div className="text-red-500 text-center py-20"><div className="text-lg mb-2">Ошибка загрузки</div><div className="text-sm">{textError}</div><a href={filesApi.getFileUrl(file.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline text-sm mt-2 block">Открыть в новой вкладке</a></div>
          : textContent ? <pre className="whitespace-pre-wrap text-sm text-gray-800">{textContent}</pre>
          : <div className="text-gray-500 text-center py-20"><div className="text-lg mb-2">Предварительный просмотр текстового файла</div><a href={filesApi.getFileUrl(file.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline text-sm mt-2 block">Открыть в новой вкладке</a></div>}
      </div>
    );

    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg h-96">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-gray-600">{getFileTypeDisplay(file.mime_type)}</span>
          </div>
          <div className="text-lg mb-2">Предварительный просмотр недоступен</div>
          <a href={filesApi.getFileUrl(file.id)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline text-sm">Открыть в новой вкладке</a>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="truncate pr-8">{file.original_filename}</DialogTitle>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            <span>Тип: {getFileTypeDisplay(file.mime_type)}</span>
            <span>Размер: {formatFileSize(file.file_size)}</span>
            <span>Дата: {formatDate(file.created_at)}</span>
            <span>Автор: {getAuthorName(file.uploaded_by)}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button onClick={onDownload} size="sm" title="Скачать файл (Ctrl+D)">
              <DocumentArrowDownIcon className="w-4 h-4" /> Скачать
            </Button>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete} title="Удалить файл (Delete)">
                <TrashIcon className="w-4 h-4" /> Удалить
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="p-6">{getFilePreviewContent()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
