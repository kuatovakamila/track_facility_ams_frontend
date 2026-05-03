import React, { useState } from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import type { FolderCreate } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FolderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderData: FolderCreate) => Promise<void>;
  parentFolderId?: number | null;
  parentFolderName?: string;
}

const FolderCreateModal: React.FC<FolderCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentFolderId = null,
  parentFolderName = 'Корневая папка'
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Название папки обязательно'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || null, parent_id: parentFolderId });
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Не удалось создать папку');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderIcon className="w-5 h-5 text-blue-600" />
            Создать папку
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div className="space-y-1">
            <Label htmlFor="folderName">Название папки *</Label>
            <Input
              id="folderName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Введите название папки"
              maxLength={255}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="folderDescription">Описание</Label>
            <textarea
              id="folderDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:bg-muted resize-none"
              placeholder="Введите описание папки (необязательно)"
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <Label>Родительская папка</Label>
            <div className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground">{parentFolderName}</div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Отмена</Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>{isSubmitting ? 'Создание...' : 'Создать папку'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FolderCreateModal;
