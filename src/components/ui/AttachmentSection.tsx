import React, { useState, useEffect, useRef } from 'react';
import {
  Paperclip,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  FileArchive,
} from 'lucide-react';
import {
  attachmentService,
  type AttachmentData,
} from '../../services/attachmentService';
import { Button } from './Button';

interface AttachmentSectionProps {
  itemType: 'ticket' | 'complaint';
  itemId: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

export const AttachmentSection: React.FC<AttachmentSectionProps> = ({
  itemType,
  itemId,
  canUpload = true,
  canDelete = true,
}) => {
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attachmentService.getAttachments(itemType, itemId);
      setAttachments(data);
    } catch (err: any) {
      console.error('Failed to load attachments:', err);
      setError('Could not load attached documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId) {
      fetchAttachments();
    }
  }, [itemId, itemType]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 5) {
      setError('You can upload a maximum of 5 files at once.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await attachmentService.uploadAttachments(itemType, itemId, Array.from(files));
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchAttachments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload attachments.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await attachmentService.deleteAttachment(id);
      setAttachments((prev) => prev.filter((att) => att._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete attachment.');
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (mimetype === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (mimetype.includes('sheet') || mimetype.includes('csv'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (mimetype.includes('zip') || mimetype.includes('rar'))
      return <FileArchive className="w-5 h-5 text-amber-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-gray-500" />
          <h4 className="text-sm font-semibold text-gray-900">
            Documents & Evidence ({attachments.length})
          </h4>
        </div>
        {canUpload && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              id={`file-upload-${itemId}`}
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.zip"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-xs"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Evidence
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 text-xs text-red-700 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-4 text-xs text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading attachments...
        </div>
      ) : attachments.length === 0 ? (
        <div className="p-4 text-center rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
          <Paperclip className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
          <p className="text-xs text-gray-500">No documents or evidence attached yet.</p>
          {canUpload && (
            <p className="text-[11px] text-gray-400 mt-1">
              Upload photos, error screenshots, PDFs, or log files (up to 10MB each).
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {attachments.map((att) => {
            const isImage = att.mimetype.startsWith('image/');
            const fileUrl = attachmentService.getFileUrl(att.filename);

            return (
              <div
                key={att._id}
                className="group relative flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {isImage ? (
                    <div className="w-9 h-9 rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                      <img
                        src={fileUrl}
                        alt={att.originalName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                      {getFileIcon(att.mimetype)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p
                      className="text-xs font-medium text-gray-900 truncate"
                      title={att.originalName}
                    >
                      {att.originalName}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {attachmentService.formatFileSize(att.size)}
                      {att.uploadedBy?.name ? ` • by ${att.uploadedBy.name}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="View / Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(att._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttachmentSection;
