import api from './api';

export interface TrackingData {
  _id: string;
  type: 'ticket' | 'complaint';
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  slaDeadline?: string | null;
  qrCode?: string | null;
  customerName: string;
  assignedToName?: string | null;
  rating?: {
    rating: number;
    feedback?: string;
  } | null;
  attachmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CannedResponseItem {
  id: string;
  title: string;
  text: string;
  category: string;
  tags: string[];
}

export const trackingService = {
  /**
   * Fetch public tracking info for a ticket or complaint (no auth required).
   */
  async getPublicTracking(type: string, id: string): Promise<TrackingData> {
    const res = await api.get(`/track/${type}/${id}`);
    return res.data?.data?.item;
  },

  /**
   * Fetch canned responses for employee quick replies.
   */
  async getCannedResponses(category?: string): Promise<CannedResponseItem[]> {
    const res = await api.get('/canned-responses', { params: { category } });
    return res.data?.data?.responses || [];
  },
};

export default trackingService;
