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
  UserCheck,
  Building,
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Ticket,
  CheckCircle2,
  Loader2,
  Users,
  Edit2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { customerService, type CustomerData, type UpdateCustomerPayload } from '../../services/customerService';
import type { AxiosError } from 'axios';

const INITIAL_FALLBACK_CUSTOMERS: CustomerData[] = [
  {
    _id: 'cust-201',
    userId: {
      _id: 'usr-201',
      name: 'John Customer',
      email: 'john.customer@example.com',
      role: 'customer',
      phone: '+1 (555) 999-8888',
      createdAt: '2026-08-19',
    },
    address: {
      street: '123 Innovation Way',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
    },
    createdAt: '2026-08-19',
    updatedAt: '2026-08-19',
  },
  {
    _id: 'cust-202',
    userId: {
      _id: 'usr-202',
      name: 'Acme Enterprise Admin',
      email: 'it-support@acmecorp.com',
      role: 'customer',
      phone: '+1 (555) 876-5432',
      createdAt: '2026-08-12',
    },
    address: {
      street: '500 Enterprise Blvd',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      country: 'USA',
    },
    createdAt: '2026-08-12',
    updatedAt: '2026-08-12',
  },
];

export function CustomerManagement() {
  const [customers, setCustomers] = useState<CustomerData[]>(INITIAL_FALLBACK_CUSTOMERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerService.getCustomers();
      if (data && data.length > 0) {
        setCustomers(data);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomerDetails = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  const openEditCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setEditFormData({
      name: customer.userId?.name || '',
      phone: customer.userId?.phone || '',
      street: customer.address?.street || '',
      city: customer.address?.city || '',
      state: customer.address?.state || '',
      zipCode: customer.address?.zipCode || '',
      country: customer.address?.country || '',
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload: UpdateCustomerPayload = {
        name: editFormData.name,
        phone: editFormData.phone,
        address: {
          street: editFormData.street,
          city: editFormData.city,
          state: editFormData.state,
          zipCode: editFormData.zipCode,
          country: editFormData.country,
        },
      };

      const updated = await customerService.updateCustomer(selectedCustomer._id, payload);
      if (updated) {
        setCustomers((prev) =>
          prev.map((c) => (c._id === selectedCustomer._id ? updated : c))
        );
      } else {
        // Optimistic update
        setCustomers((prev) =>
          prev.map((c) =>
            c._id === selectedCustomer._id
              ? {
                  ...c,
                  userId: { ...c.userId, name: editFormData.name, phone: editFormData.phone },
                  address: payload.address,
                }
              : c
          )
        );
      }

      setIsEditModalOpen(false);
      setToastMessage('Customer account details updated successfully.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || 'Failed to update customer account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const nameMatch = c.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = c.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const cityMatch = c.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const countryMatch = c.address?.country?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch || cityMatch || countryMatch;
  });

  return (
    <div className="space-y-6">
      {/* Action Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-status-resolved-bg border border-status-resolved-border flex items-center justify-between text-status-resolved-text text-sm shadow-soft-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-resolved-500 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-semibold text-status-resolved-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card hoverEffect>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Total Customer Accounts
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">{customers.length}</span>
              <Badge variant="primary" size="sm">
                Active Client Base
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Verified Registrations
              </span>
              <div className="w-8 h-8 rounded-lg bg-status-resolved-bg text-status-resolved-500 flex items-center justify-center border border-status-resolved-border">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">100%</span>
              <Badge status="resolved" size="sm" dot>
                Verified
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card hoverEffect>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Enterprise Accounts
              </span>
              <div className="w-8 h-8 rounded-lg bg-priority-low-bg text-priority-low-text flex items-center justify-center border border-priority-low-border">
                <Building className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-neutral-900">Tier 1 & 2</span>
              <Badge variant="neutral" size="sm">
                SLA Tier
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Customers Table Card */}
      <Card>
        <CardHeader border>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>
                Client accounts registered on the SmartServe service desk platform (Admin Management)
              </CardDescription>
            </div>

            <div className="w-64 sm:w-72">
              <Input
                placeholder="Search customers or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent noPadding>
          <TableContainer className="border-none rounded-none shadow-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Account</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-neutral-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                      Loading customer records...
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-neutral-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No customers found matching your search.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0 border border-primary-200">
                            {c.userId?.name
                              ? c.userId.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .substring(0, 2)
                                  .toUpperCase()
                              : 'CU'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-neutral-900 leading-tight">
                              {c.userId?.name || 'Customer User'}
                            </span>
                            <span className="text-xs text-neutral-400 mt-0.5">
                              ID: {c._id.length > 8 ? c._id.substring(c._id.length - 6).toUpperCase() : c._id}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-neutral-700">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" />
                          {c.userId?.email || 'N/A'}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-neutral-600">
                        {c.userId?.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-neutral-400" />
                            {c.userId.phone}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">Not set</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-neutral-600">
                        {c.address?.city ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            {c.address.city}, {c.address.state || c.address.country}
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic">No address on file</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-neutral-500 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => openCustomerDetails(c)}
                          >
                            View
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                            onClick={() => openEditCustomer(c)}
                          >
                            Edit
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
          <span>Total {filteredCustomers.length} customer records listed</span>
          <span>Role: Administrator Access Only</span>
        </CardFooter>
      </Card>

      {/* View Customer Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={selectedCustomer ? `${selectedCustomer.userId?.name} — Account Profile` : 'Customer Profile'}
        description="Comprehensive client overview, contact address, and service history"
        size="lg"
        footer={
          <>
            <Button
              variant="primary"
              onClick={() => {
                setIsDetailsModalOpen(false);
                if (selectedCustomer) openEditCustomer(selectedCustomer);
              }}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Account
            </Button>
            <Button variant="secondary" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Account Summary Header Card */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary-600 text-white font-bold text-base flex items-center justify-center shadow-soft-xs">
                  {selectedCustomer.userId?.name
                    ? selectedCustomer.userId.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()
                    : 'CU'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-neutral-900">{selectedCustomer.userId?.name}</h4>
                  <p className="text-xs text-neutral-500">{selectedCustomer.userId?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="primary" size="md">
                  Active Customer
                </Badge>
              </div>
            </div>

            {/* Contact & Address Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary-600" /> Contact Info
                </span>
                <div className="text-xs space-y-1.5 text-neutral-700">
                  <p>
                    <strong>Email:</strong> {selectedCustomer.userId?.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedCustomer.userId?.phone || 'Not provided'}
                  </p>
                  <p>
                    <strong>User ID:</strong> {selectedCustomer.userId?._id}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" /> Physical Address
                </span>
                <div className="text-xs space-y-1 text-neutral-700">
                  {selectedCustomer.address?.street ? (
                    <>
                      <p>{selectedCustomer.address.street}</p>
                      <p>
                        {selectedCustomer.address.city}, {selectedCustomer.address.state}{' '}
                        {selectedCustomer.address.zipCode}
                      </p>
                      <p>{selectedCustomer.address.country}</p>
                    </>
                  ) : (
                    <p className="text-neutral-400 italic">No address on file for this account.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Service History Timeline Placeholder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-primary-600" /> Service History & Tickets
                </h4>
                <Badge variant="neutral" size="sm">
                  Recent Interactions
                </Badge>
              </div>

              <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 bg-white overflow-hidden">
                <div className="p-3.5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-status-resolved-bg text-status-resolved-500 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-900">
                        High Priority License Inquiry
                      </p>
                      <span className="text-[11px] text-neutral-400">Assigned to Technical Support Desk</span>
                    </div>
                  </div>
                  <Badge status="in-progress" size="sm" dot>
                    In Progress
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Admin Edit Customer Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer Account"
        description="Update customer contact profile and physical address information."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateCustomer} isLoading={isSubmitting} leftIcon={<Save className="w-3.5 h-3.5" />}>
              Save Updates
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-status-open-bg border border-status-open-border flex items-start gap-2 text-status-open-text text-xs">
              <AlertCircle className="w-4 h-4 text-status-open-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />

            <Input
              label="Contact Phone"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Address Information
            </span>

            <Input
              label="Street Address"
              value={editFormData.street}
              onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
              placeholder="e.g. 123 Market St"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="City"
                value={editFormData.city}
                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                placeholder="City"
              />

              <Input
                label="State / Province"
                value={editFormData.state}
                onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                placeholder="State"
              />

              <Input
                label="Postal / Zip Code"
                value={editFormData.zipCode}
                onChange={(e) => setEditFormData({ ...editFormData, zipCode: e.target.value })}
                placeholder="Zip"
              />

              <Input
                label="Country"
                value={editFormData.country}
                onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                placeholder="Country"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
