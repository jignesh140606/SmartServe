import api from './api';

export interface RatingData {
  _id: string;
  itemId: string;
  itemType: 'Ticket' | 'Complaint';
  customerId: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
    };
  };
  rating: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  byType: {
    tickets: { average: number; count: number };
    complaints: { average: number; count: number };
  };
}

export interface SubmitRatingPayload {
  itemId: string;
  itemType: 'Ticket' | 'Complaint';
  rating: number;
  feedback?: string;
}

export const ratingService = {
  /**
   * Submit or update a CSAT rating for a resolved item.
   */
  async submitRating(payload: SubmitRatingPayload): Promise<RatingData> {
    const res = await api.post('/ratings', payload);
    return res.data?.data?.rating;
  },

  /**
   * Get rating for a specific ticket or complaint.
   */
  async getRating(itemType: 'Ticket' | 'Complaint', itemId: string): Promise<RatingData | null> {
    try {
      const res = await api.get(`/ratings/${itemType}/${itemId}`);
      return res.data?.data?.rating || null;
    } catch {
      return null;
    }
  },

  /**
   * Get all ratings submitted by the current customer.
   */
  async getMyRatings(): Promise<RatingData[]> {
    try {
      const res = await api.get('/ratings/my-ratings');
      return res.data?.data?.ratings || [];
    } catch {
      return [];
    }
  },

  /**
   * Get overall CSAT rating statistics (Admin & Employee).
   */
  async getRatingStats(): Promise<RatingStats | null> {
    try {
      const res = await api.get('/ratings/stats');
      return res.data?.data?.stats || res.data?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get all customer feedback & reviews (Admin & Employee).
   */
  async getAllRatings(): Promise<RatingData[]> {
    try {
      const res = await api.get('/ratings');
      return res.data?.data?.ratings || [];
    } catch {
      return [];
    }
  },
};

export default ratingService;
