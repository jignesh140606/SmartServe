import api from './api';

export interface CustomerUser {
  _id: string;
  name: string;
  email: string;
  role: 'customer';
  phone?: string;
  createdAt?: string;
}

export interface CustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface CustomerData {
  _id: string;
  userId: CustomerUser;
  address?: CustomerAddress;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string;
  address?: CustomerAddress;
}

export const customerService = {
  async getCustomers(): Promise<CustomerData[]> {
    const res = await api.get('/customers');
    return res.data?.data?.customers || [];
  },

  async getCustomerById(id: string): Promise<CustomerData> {
    const res = await api.get(`/customers/${id}`);
    return res.data?.data?.customer;
  },

  async updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<CustomerData> {
    const res = await api.put(`/customers/${id}`, payload);
    return res.data?.data?.customer;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};

export default customerService;
