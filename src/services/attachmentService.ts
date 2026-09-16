import api from './api';

export interface AttachmentData {
  _id: string;
  itemId: string;
  itemType: 'Ticket' | 'Complaint';
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const attachmentService = {
  /**
   * Upload one or more files attached to a ticket or complaint.
   */
  async uploadAttachments(
    itemType: 'ticket' | 'complaint',
    itemId: string,
    files: File[]
  ): Promise<AttachmentData[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const res = await api.post(`/attachments/${itemType}/${itemId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data?.data?.attachments || [];
  },

  /**
   * Get all attachments for a ticket or complaint.
   */
  async getAttachments(
    itemType: 'ticket' | 'complaint',
    itemId: string
  ): Promise<AttachmentData[]> {
    const res = await api.get(`/attachments/${itemType}/${itemId}`);
    return res.data?.data?.attachments || [];
  },

  /**
   * Delete an attachment by ID.
   */
  async deleteAttachment(id: string): Promise<void> {
    await api.delete(`/attachments/${id}`);
  },

  /**
   * Helper to format full public URL for an uploaded file.
   */
  getFileUrl(filename: string): string {
    return `${SERVER_BASE_URL}/uploads/${filename}`;
  },

  /**
   * Format file size helper.
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },
};

export default attachmentService;
