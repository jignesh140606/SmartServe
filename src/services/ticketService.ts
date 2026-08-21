import api from './api';
import type { CustomerSummary, EmployeeSummary } from './complaintService';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface TicketData {
  _id: string;
  customerId: CustomerSummary;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: EmployeeSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  category?: string;
  priority?: TicketPriority;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
}

export const ticketService = {
  async getTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<TicketData[]> {
    const res = await api.get('/tickets', { params });
    return res.data?.data?.tickets || [];
  },

  async getTicketById(id: string): Promise<TicketData> {
    const res = await api.get(`/tickets/${id}`);
    return res.data?.data?.ticket;
  },

  async createTicket(payload: CreateTicketPayload): Promise<TicketData> {
    const res = await api.post('/tickets', payload);
    return res.data?.data?.ticket;
  },

  async updateTicket(id: string, payload: UpdateTicketPayload): Promise<TicketData> {
    const res = await api.put(`/tickets/${id}`, payload);
    return res.data?.data?.ticket;
  },

  async updateTicketStatus(id: string, status: TicketStatus): Promise<TicketData> {
    const res = await api.patch(`/tickets/${id}/status`, { status });
    return res.data?.data?.ticket;
  },

  async assignTicket(id: string, employeeId: string | null): Promise<TicketData> {
    const res = await api.patch(`/tickets/${id}/assign`, { employeeId });
    return res.data?.data?.ticket;
  },
};

export default ticketService;
