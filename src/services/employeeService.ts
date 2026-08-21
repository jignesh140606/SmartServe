import api from './api';

export interface EmployeeUser {
  _id: string;
  name: string;
  email: string;
  role: 'employee';
  phone?: string;
  createdAt?: string;
}

export interface EmployeeData {
  _id: string;
  userId: EmployeeUser;
  department: string;
  designation: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  department: string;
  designation: string;
  phone?: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  department?: string;
  designation?: string;
  phone?: string;
}

export const employeeService = {
  async getEmployees(params?: { department?: string; isActive?: boolean }): Promise<EmployeeData[]> {
    const res = await api.get('/employees', { params });
    return res.data?.data?.employees || [];
  },

  async getEmployeeById(id: string): Promise<EmployeeData> {
    const res = await api.get(`/employees/${id}`);
    return res.data?.data?.employee;
  },

  async createEmployee(payload: CreateEmployeePayload): Promise<EmployeeData> {
    const res = await api.post('/employees', payload);
    return res.data?.data?.employee;
  },

  async updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<EmployeeData> {
    const res = await api.put(`/employees/${id}`, payload);
    return res.data?.data?.employee;
  },

  async toggleEmployeeStatus(id: string, isActive?: boolean): Promise<EmployeeData> {
    const res = await api.patch(`/employees/${id}/status`, { isActive });
    return res.data?.data?.employee;
  },
};

export default employeeService;
