import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Select,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
} from '../../components/ui';
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  Search,
  Plus,
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import {
  employeeService,
  type EmployeeData,
  type CreateEmployeePayload,
  type UpdateEmployeePayload,
} from '../../services/employeeService';
import type { AxiosError } from 'axios';

const INITIAL_FALLBACK_EMPLOYEES: EmployeeData[] = [
  {
    _id: 'emp-101',
    userId: {
      _id: 'usr-101',
      name: 'Sarah Connor',
      email: 'sarah.connor@smartserve.io',
      role: 'employee',
      phone: '+1 (555) 321-7890',
      createdAt: '2026-08-01',
    },
    department: 'Tier 2 Technical Support',
    designation: 'Senior Incident Specialist',
    isActive: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    _id: 'emp-102',
    userId: {
      _id: 'usr-102',
      name: 'David Chen',
      email: 'david.chen@smartserve.io',
      role: 'employee',
      phone: '+1 (555) 432-8765',
      createdAt: '2026-08-05',
    },
    department: 'DevOps & Cloud',
    designation: 'Lead Infrastructure Engineer',
    isActive: true,
    createdAt: '2026-08-05',
    updatedAt: '2026-08-05',
  },
  {
    _id: 'emp-103',
    userId: {
      _id: 'usr-103',
      name: 'Elena Rostova',
      email: 'elena.rostova@smartserve.io',
      role: 'employee',
      phone: '+1 (555) 987-1234',
      createdAt: '2026-08-10',
    },
    department: 'Billing Operations',
    designation: 'Accounts Resolution Specialist',
    isActive: false,
    createdAt: '2026-08-10',
    updatedAt: '2026-08-10',
  },
];

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<EmployeeData[]>(INITIAL_FALLBACK_EMPLOYEES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);

  // Form States
  const [addForm, setAddForm] = useState<CreateEmployeePayload>({
    name: '',
    email: '',
    password: '',
    department: 'Tier 1 Support',
    designation: 'Support Engineer',
    phone: '',
  });

  const [editForm, setEditForm] = useState<UpdateEmployeePayload>({
    name: '',
    department: '',
    designation: '',
    phone: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch from API on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await employeeService.getEmployees();
      if (data && data.length > 0) {
        setEmployees(data);
      }
    } catch {
      // Keep initial fallback if offline
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!addForm.name || !addForm.email || !addForm.password || !addForm.department || !addForm.designation) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newEmp = await employeeService.createEmployee(addForm);
      setEmployees([newEmp, ...employees]);
      setIsAddModalOpen(false);
      setActionSuccess(`Employee account for ${addForm.name} created successfully.`);
      setAddForm({
        name: '',
        email: '',
        password: '',
        department: 'Tier 1 Support',
        designation: 'Support Engineer',
        phone: '',
      });
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || 'Failed to create employee account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (emp: EmployeeData) => {
    setSelectedEmployee(emp);
    setEditForm({
      name: emp.userId?.name || '',
      department: emp.department || '',
      designation: emp.designation || '',
      phone: emp.userId?.phone || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      setIsSubmitting(true);
      const updated = await employeeService.updateEmployee(selectedEmployee._id, editForm);
      setEmployees(employees.map((emp) => (emp._id === selectedEmployee._id ? updated : emp)));
      setIsEditModalOpen(false);
      setActionSuccess(`Updated ${editForm.name}'s employee details.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || 'Failed to update employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (emp: EmployeeData) => {
    try {
      const newStatus = !emp.isActive;
      const updated = await employeeService.toggleEmployeeStatus(emp._id, newStatus);
      setEmployees(employees.map((item) => (item._id === emp._id ? updated : item)));
      setActionSuccess(`${emp.userId?.name}'s account is now ${newStatus ? 'Active' : 'Inactive'}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch {
      // Optimistic fallback toggle
      setEmployees(
        employees.map((item) => (item._id === emp._id ? { ...item, isActive: !item.isActive } : item))
      );
    }
  };

  // Filtering
  const filteredEmployees = employees.filter((emp) => {
    const nameMatch = emp.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = emp.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const deptMatch = emp.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const desigMatch = emp.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || emailMatch || deptMatch || desigMatch;

    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && emp.isActive) ||
      (statusFilter === 'inactive' && !emp.isActive);

    return matchesSearch && matchesDept && matchesStatus;
  });

  const uniqueDepartments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.filter((e) => !e.isActive).length;

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-status-resolved-bg border border-status-resolved-border flex items-center justify-between text-status-resolved-text text-sm shadow-soft-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-status-resolved-500 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-xs font-semibold text-status-resolved-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Total Staff
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">{employees.length}</span>
              <Badge variant="primary" size="sm">
                Staff Records
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Active Staff
              </span>
              <div className="w-8 h-8 rounded-lg bg-status-resolved-bg text-status-resolved-500 flex items-center justify-center border border-status-resolved-border">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">{activeCount}</span>
              <Badge status="resolved" size="sm" dot>
                Authorized
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Inactive Staff
              </span>
              <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center border border-neutral-200">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">{inactiveCount}</span>
              <Badge status="closed" size="sm">
                Suspended
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Departments
              </span>
              <div className="w-8 h-8 rounded-lg bg-priority-low-bg text-priority-low-text flex items-center justify-center border border-priority-low-border">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">{uniqueDepartments.length}</span>
              <Badge variant="neutral" size="sm">
                Units
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Employee Table Card */}
      <Card>
        <CardHeader border>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Staff & Employee Directory</CardTitle>
              <CardDescription>
                Manage service desk specialists, support agents, and system access status
              </CardDescription>
            </div>

            {/* Actions & Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-48 sm:w-56">
                <Input
                  placeholder="Search staff or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                />
              </div>

              <div className="w-36">
                <Select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="w-32">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>

              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setFormError(null);
                  setIsAddModalOpen(true);
                }}
              >
                Add Employee
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent noPadding>
          <TableContainer className="border-none rounded-none shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-neutral-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                      Loading staff records...
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-neutral-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No employees match your filter criteria.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0 border border-primary-200">
                            {emp.userId?.name
                              ? emp.userId.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .substring(0, 2)
                                  .toUpperCase()
                              : 'EM'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-900 leading-tight">
                              {emp.userId?.name || 'Unknown Employee'}
                            </span>
                            <span className="text-xs text-neutral-400 mt-0.5">
                              ID: {emp._id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center text-xs font-medium text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200">
                          {emp.department}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm font-medium text-neutral-800">
                        {emp.designation}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col text-xs text-neutral-600 space-y-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-neutral-400" />
                            {emp.userId?.email || 'N/A'}
                          </span>
                          {emp.userId?.phone && (
                            <span className="flex items-center gap-1 text-neutral-400">
                              <Phone className="w-3 h-3 text-neutral-400" />
                              {emp.userId.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge status={emp.isActive ? 'resolved' : 'closed'} dot size="sm">
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                            onClick={() => openEditModal(emp)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={emp.isActive ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleStatus(emp)}
                          >
                            {emp.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>

        <CardFooter border className="justify-between text-xs text-neutral-500">
          <span>Showing {filteredEmployees.length} of {employees.length} employees</span>
          <span>Role: Employee (RBAC Provisioned)</span>
        </CardFooter>
      </Card>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision New Employee Account"
        description="Creates a staff User account and linked Employee record."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddSubmit} isLoading={isSubmitting}>
              Create Employee
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-status-open-bg border border-status-open-border flex items-start gap-2 text-status-open-text text-xs">
              <AlertCircle className="w-4 h-4 text-status-open-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              leftIcon={<UserIcon className="w-4 h-4" />}
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              required
            />
            <Input
              label="Work Email"
              type="email"
              placeholder="alex.morgan@smartserve.io"
              leftIcon={<Mail className="w-4 h-4" />}
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Temporary Password"
              type="password"
              placeholder="Min 6 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              required
            />
            <Input
              label="Contact Phone (Optional)"
              type="tel"
              placeholder="+1 (555) 000-0000"
              leftIcon={<Phone className="w-4 h-4" />}
              value={addForm.phone || ''}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department"
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
              required
            >
              <option value="Tier 1 Support">Tier 1 Support</option>
              <option value="Tier 2 Technical Support">Tier 2 Technical Support</option>
              <option value="DevOps & Cloud">DevOps & Cloud</option>
              <option value="Billing Operations">Billing Operations</option>
              <option value="Enterprise Solutions">Enterprise Solutions</option>
            </Select>

            <Input
              label="Designation / Title"
              placeholder="e.g. Senior Incident Specialist"
              value={addForm.designation}
              onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Information"
        description={selectedEmployee ? `Modify details for ${selectedEmployee.userId?.name}` : 'Update staff details'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} isLoading={isSubmitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-status-open-bg border border-status-open-border flex items-start gap-2 text-status-open-text text-xs">
              <AlertCircle className="w-4 h-4 text-status-open-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Full Name"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />

          <Select
            label="Department"
            value={editForm.department || ''}
            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
            required
          >
            <option value="Tier 1 Support">Tier 1 Support</option>
            <option value="Tier 2 Technical Support">Tier 2 Technical Support</option>
            <option value="DevOps & Cloud">DevOps & Cloud</option>
            <option value="Billing Operations">Billing Operations</option>
            <option value="Enterprise Solutions">Enterprise Solutions</option>
          </Select>

          <Input
            label="Designation / Title"
            value={editForm.designation || ''}
            onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
            required
          />

          <Input
            label="Contact Phone"
            value={editForm.phone || ''}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
