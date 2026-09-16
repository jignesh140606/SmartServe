import api from './api';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface CustomerSummary {
  _id: string;
  userId: UserSummary;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface EmployeeSummary {
  _id: string;
  userId: UserSummary;
  department?: string;
  designation?: string;
  isActive?: boolean;
}

export interface ComplaintData {
  _id: string;
  customerId: CustomerSummary;
  title: string;
  description: string;
  category: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedTo?: EmployeeSummary | null;
  slaDeadline?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintPayload {
  title: string;
  description: string;
  category?: string;
  priority?: ComplaintPriority;
}

export interface UpdateComplaintPayload {
  title?: string;
  description?: string;
  category?: string;
  priority?: ComplaintPriority;
}

export const complaintService = {
  async getComplaints(params?: {
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<ComplaintData[]> {
    const res = await api.get('/complaints', { params });
    return res.data?.data?.complaints || [];
  },

  async getComplaintById(id: string): Promise<ComplaintData> {
    const res = await api.get(`/complaints/${id}`);
    return res.data?.data?.complaint;
  },

  async createComplaint(payload: CreateComplaintPayload): Promise<ComplaintData> {
    const res = await api.post('/complaints', payload);
    return res.data?.data?.complaint;
  },

  async updateComplaint(id: string, payload: UpdateComplaintPayload): Promise<ComplaintData> {
    const res = await api.put(`/complaints/${id}`, payload);
    return res.data?.data?.complaint;
  },

  async updateComplaintStatus(id: string, status: ComplaintStatus): Promise<ComplaintData> {
    const res = await api.patch(`/complaints/${id}/status`, { status });
    return res.data?.data?.complaint;
  },

  async assignComplaint(id: string, employeeId: string | null): Promise<ComplaintData> {
    const res = await api.patch(`/complaints/${id}/assign`, { employeeId });
    return res.data?.data?.complaint;
  },
};

export default complaintService;
