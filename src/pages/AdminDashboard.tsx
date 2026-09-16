import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  SidebarLayout,
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
  Textarea,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  SlaBadge,
  QRCodeModal,
  AttachmentSection,
} from '../components/ui';
import {
  Search,
  LogOut,
  Sparkles,
  UserCog,
  Contact2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  FileQuestion,
  UserPlus,
  Ticket,
  AlertTriangle,
  Inbox,
  ArrowUpDown,
  LayoutDashboard,
  ArrowRight,
  Plus,
  QrCode,
  Paperclip,
  Star,
} from 'lucide-react';
import { ratingService, type RatingStats } from '../services/ratingService';
import { EmployeeManagement } from './admin/EmployeeManagement';
import { CustomerManagement } from './admin/CustomerManagement';
import {
  complaintService,
  type ComplaintData,
} from '../services/complaintService';
import {
  ticketService,
  type TicketData,
  type TicketPriority,
} from '../services/ticketService';
import { employeeService, type EmployeeData } from '../services/employeeService';
import { customerService, type CustomerData } from '../services/customerService';
import { formatTimeAgo, getPriorityWeight } from '../lib/dateUtils';
import { AnalyticsView } from './shared/AnalyticsView';
import { SettingsView } from './shared/SettingsView';

type AdminTab = 'overview' | 'unassigned' | 'tickets' | 'complaints' | 'employees' | 'customers' | 'analytics' | 'settings';

interface UnifiedItem {
  id: string;
  kind: 'Ticket' | 'Complaint';
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  customerName: string;
  customerEmail: string;
  assignedTo?: { _id: string; name?: string; department?: string; userId?: { name: string } } | null;
  slaDeadline?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
  raw: TicketData | ComplaintData;
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // New Feature States
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<{
    isOpen: boolean;
    itemType: 'ticket' | 'complaint';
    itemId: string;
    title: string;
    qrCode?: string | null;
  }>({
    isOpen: false,
    itemType: 'ticket',
    itemId: '',
    title: '',
    qrCode: null,
  });

  const [activeAttachmentModal, setActiveAttachmentModal] = useState<{
    isOpen: boolean;
    itemType: 'ticket' | 'complaint';
    itemId: string;
    title: string;
  }>({
    isOpen: false,
    itemType: 'ticket',
    itemId: '',
    title: '',
  });

  // Data states
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Ticket / Incident Modal Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'API & Infrastructure',
    priority: 'High' as TicketPriority,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ticketsData, complaintsData, employeesData, customersData, statsData] = await Promise.all([
        ticketService.getTickets().catch(() => []),
        complaintService.getComplaints().catch(() => []),
        employeeService.getEmployees().catch(() => []),
        customerService.getCustomers().catch(() => []),
        ratingService.getRatingStats().catch(() => null),
      ]);
      if (ticketsData) setTickets(ticketsData);
      if (complaintsData) setComplaints(complaintsData);
      if (employeesData) setEmployees(employeesData);
      if (customersData) setCustomers(customersData);
      if (statsData) setRatingStats(statsData);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTicket = async (ticketId: string, employeeId: string) => {
    try {
      const targetEmpId = employeeId === 'unassigned' ? null : employeeId;
      const updated = await ticketService.assignTicket(ticketId, targetEmpId);
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? updated : t)));

      const assignedEmp = employees.find((e) => e._id === employeeId);
      const msg = assignedEmp
        ? `Ticket assigned to ${assignedEmp.userId?.name} (Status: In Progress).`
        : 'Ticket unassigned.';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Failed to update ticket assignment.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleAssignComplaint = async (complaintId: string, employeeId: string) => {
    try {
      const targetEmpId = employeeId === 'unassigned' ? null : employeeId;
      const updated = await complaintService.assignComplaint(complaintId, targetEmpId);
      setComplaints((prev) => prev.map((c) => (c._id === complaintId ? updated : c)));

      const assignedEmp = employees.find((e) => e._id === employeeId);
      const msg = assignedEmp
        ? `Complaint assigned to ${assignedEmp.userId?.name} (Status: In Progress).`
        : 'Complaint unassigned.';
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Failed to update complaint assignment.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    try {
      setIsSubmitting(true);
      if (activeTab === 'complaints') {
        const newComplaint = await complaintService.createComplaint(formData);
        setComplaints([newComplaint, ...complaints]);
        setToastMessage('Administrative complaint logged.');
      } else {
        const newTicket = await ticketService.createTicket(formData);
        setTickets([newTicket, ...tickets]);
        setToastMessage('Administrative ticket created.');
      }
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'API & Infrastructure',
        priority: 'High',
      });
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Failed to create item.');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aggregated Unified Items list
  const allUnifiedItems: UnifiedItem[] = [
    ...tickets.map((t) => ({
      id: t._id,
      kind: 'Ticket' as const,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      customerName: t.customerId?.userId?.name || 'Customer Account',
      customerEmail: t.customerId?.userId?.email || 'N/A',
      assignedTo: t.assignedTo ? { _id: t.assignedTo._id, name: t.assignedTo.userId?.name, department: t.assignedTo.department } : null,
      slaDeadline: t.slaDeadline,
      qrCode: t.qrCode,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      raw: t,
    })),
    ...complaints.map((c) => ({
      id: c._id,
      kind: 'Complaint' as const,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      customerName: c.customerId?.userId?.name || 'Customer Account',
      customerEmail: c.customerId?.userId?.email || 'N/A',
      assignedTo: c.assignedTo ? { _id: c.assignedTo._id, name: c.assignedTo.userId?.name, department: c.assignedTo.department } : null,
      slaDeadline: c.slaDeadline,
      qrCode: c.qrCode,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      raw: c,
    })),
  ].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  // Unassigned Items for Triage
  const unassignedItems = allUnifiedItems
    .filter((item) => !item.assignedTo)
    .sort((a, b) => {
      const pDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (pDiff !== 0) return pDiff;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

  const filteredUnassigned = unassignedItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(query);
    const customerMatch = item.customerName.toLowerCase().includes(query);
    const categoryMatch = item.category?.toLowerCase().includes(query);
    const searchPass = !searchQuery || titleMatch || customerMatch || categoryMatch;
    const priorityPass =
      priorityFilter === 'all' || item.priority.toLowerCase() === priorityFilter.toLowerCase();
    return searchPass && priorityPass;
  });

  // Filter Active View for Tickets / Complaints tabs
  const currentList = activeTab === 'tickets' ? tickets : complaints;
  const filteredList = currentList.filter((item) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(query);
    const customerMatch = item.customerId?.userId?.name?.toLowerCase().includes(query) || false;
    const categoryMatch = item.category?.toLowerCase().includes(query) || false;
    const searchPass = !searchQuery || titleMatch || customerMatch || categoryMatch;

    const statusPass =
      statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    const priorityPass =
      priorityFilter === 'all' || item.priority.toLowerCase() === priorityFilter.toLowerCase();

    return searchPass && statusPass && priorityPass;
  });

  // Top Metric Counts
  const totalComplaintsCount = complaints.length;
  const totalTicketsCount = tickets.length;
  const totalOpenCount = allUnifiedItems.filter((i) => i.status === 'Open').length;
  const totalResolvedCount = allUnifiedItems.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length;
  const totalEmployeesCount = employees.length;
  const totalCustomersCount = customers.length;
  const totalUnassignedCount = unassignedItems.length;

  // SLA & CSAT Advanced Metrics
  const now = new Date();
  const breachedItems = allUnifiedItems.filter(
    (i) => i.slaDeadline && new Date(i.slaDeadline) < now && i.status !== 'Resolved' && i.status !== 'Closed'
  );
  const breachedCount = breachedItems.length;
  const slaCompliancePercent =
    allUnifiedItems.length > 0
      ? Math.max(0, Math.round(((allUnifiedItems.length - breachedCount) / allUnifiedItems.length) * 100))
      : 100;
  const csatAvg =
    ratingStats && ratingStats.totalRatings > 0
      ? Number(ratingStats.averageRating).toFixed(1)
      : '0.0';
  const csatTotal = ratingStats?.totalRatings || 0;

  return (
    <SidebarLayout
      activeNavId={activeTab === 'overview' ? 'dashboard' : activeTab === 'unassigned' ? 'queues' : activeTab === 'tickets' ? 'tickets' : activeTab === 'customers' ? 'customers' : activeTab === 'analytics' ? 'analytics' : activeTab === 'settings' ? 'settings' : 'dashboard'}
      topbarTitle="Administrator Control Center"
      ticketsBadge={totalTicketsCount}
      queuesBadge={totalUnassignedCount}
      onNavSelect={(id) => {
        if (id === 'dashboard') setActiveTab('overview');
        else if (id === 'queues') setActiveTab('unassigned');
        else if (id === 'tickets') setActiveTab('tickets');
        else if (id === 'customers') setActiveTab('customers');
        else if (id === 'analytics') setActiveTab('analytics');
        else if (id === 'settings') setActiveTab('settings');
      }}
      onNewTicketClick={() => setIsModalOpen(true)}
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">System Administration</h2>
            <Badge variant="primary" size="sm">
              Admin Access
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Logged in as <strong className="text-neutral-700">{user?.name}</strong> ({user?.email})
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 shadow-soft-xs flex-wrap">
            <button
              onClick={() => {
                setActiveTab('overview');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('unassigned');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'unassigned'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              Unassigned ({totalUnassignedCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('tickets');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'tickets'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              Tickets ({totalTicketsCount})
            </button>
            <button
              onClick={() => {
                setActiveTab('complaints');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'complaints'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Complaints ({totalComplaintsCount})
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'employees'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <UserCog className="w-3.5 h-3.5" />
              Staff ({totalEmployeesCount})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'customers'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Contact2 className="w-3.5 h-3.5" />
              Customers ({totalCustomersCount})
            </button>
          </div>

          <Button variant="secondary" size="sm" leftIcon={<LogOut className="w-3.5 h-3.5" />} onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-between text-primary-800 text-sm shadow-soft-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-semibold text-primary-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Render Active View */}
      {activeTab === 'analytics' ? (
        <AnalyticsView tickets={tickets} complaints={complaints} roleTitle="System-Wide" />
      ) : activeTab === 'settings' ? (
        <SettingsView />
      ) : activeTab === 'overview' ? (
        /* 1. ADMIN DASHBOARD OVERVIEW HOME VIEW */
        <div className="space-y-6">
          {/* Executive Stat Cards (6 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card hoverEffect className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => setActiveTab('complaints')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Total Complaints
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-status-open-bg text-status-open-500 flex items-center justify-center border border-status-open-border">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{totalComplaintsCount}</span>
                  <Badge variant="danger" size="sm">
                    Inquiries
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => setActiveTab('tickets')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Total Tickets
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{totalTicketsCount}</span>
                  <Badge variant="primary" size="sm">
                    Requests
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => setActiveTab('unassigned')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Open Actions
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-priority-high-bg text-priority-high-text flex items-center justify-center border border-priority-high-border">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{totalOpenCount}</span>
                  <Badge status="open" size="sm" dot>
                    Needs Action
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => setActiveTab('tickets')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Resolved Items
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-status-resolved-bg text-status-resolved-500 flex items-center justify-center border border-status-resolved-border">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{totalResolvedCount}</span>
                  <Badge status="resolved" size="sm" dot>
                    Closed Out
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => setActiveTab('employees')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Total Staff
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-priority-low-bg text-priority-low-text flex items-center justify-center border border-priority-low-border">
                    <UserCog className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{totalEmployeesCount}</span>
                  <Badge variant="neutral" size="sm">
                    Engineers
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect className="cursor-pointer transition-transform hover:-translate-y-0.5" onClick={() => setActiveTab('customers')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Total Customers
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center border border-neutral-200">
                    <Contact2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{totalCustomersCount}</span>
                  <Badge variant="neutral" size="sm">
                    Clients
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Executive SLA & CSAT Insights Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-soft-xs">
                      <Star className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">CSAT Customer Satisfaction</h4>
                      <p className="text-xs text-neutral-500">Live aggregated customer resolution ratings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-2xl font-black text-amber-600">{csatAvg}</span>
                      <span className="text-xs font-semibold text-neutral-400">/ 5.0</span>
                    </div>
                    <span className="text-[11px] text-neutral-500">{csatTotal} verified reviews</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs text-neutral-600">
                  <span className="flex items-center gap-1 text-amber-700 font-medium">
                    ⭐ 5-star customer rating system active
                  </span>
                  <span className="text-neutral-400">Automatic CSAT survey on resolution</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200/80 bg-gradient-to-br from-blue-50/40 via-white to-white">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-soft-xs">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">SLA Breach & Health Monitor</h4>
                      <p className="text-xs text-neutral-500">Real-time service level agreement compliance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-black ${breachedCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {slaCompliancePercent}%
                    </span>
                    <p className="text-[11px] font-medium text-neutral-500">
                      {breachedCount > 0 ? (
                        <span className="text-red-600 font-bold">{breachedCount} Breached Items</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">100% On-Track</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-xs text-neutral-600">
                  <span>Critical: 4h • High: 12h • Medium: 48h</span>
                  <span className="text-blue-700 font-medium">Auto Email SLA Alerts Enabled</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-primary-50 via-white to-primary-50/30 border border-primary-100 shadow-soft-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-soft-xs shrink-0">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900">
                  {totalUnassignedCount > 0 ? `${totalUnassignedCount} Items Awaiting Triage Assignment` : 'All Incoming Items Assigned!'}
                </h4>
                <p className="text-xs text-neutral-500">
                  Prioritize and assign incoming client tickets and complaints to support specialists.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab('unassigned')}
              >
                Open Triage Feed
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsModalOpen(true)}
              >
                Provision Ticket
              </Button>
            </div>
          </div>

          {/* Recent Activity List */}
          <Card>
            <CardHeader border>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Service Desk Activity</CardTitle>
                  <CardDescription>Live stream of incoming requests, status updates, and resolutions</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => setActiveTab('tickets')}
                >
                  View All ({allUnifiedItems.length})
                </Button>
              </div>
            </CardHeader>

            <CardContent noPadding>
              {isLoading ? (
                <div className="py-12 text-center text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading recent desk events...
                </div>
              ) : allUnifiedItems.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No recent desk activity found.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {allUnifiedItems.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5">
                          <Badge variant={item.kind === 'Ticket' ? 'primary' : 'danger'} size="sm">
                            {item.kind}
                          </Badge>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-neutral-900 text-sm">{item.title}</span>
                            <Badge priority={item.priority as any} dot size="sm">
                              {item.priority}
                            </Badge>
                            <SlaBadge deadline={item.slaDeadline} status={item.status} />
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Customer: <strong className="text-neutral-700">{item.customerName}</strong> • Category:{' '}
                            <span className="text-neutral-700">{item.category}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-neutral-500 hover:text-primary-600"
                          title="Documents & Evidence"
                          onClick={() =>
                            setActiveAttachmentModal({
                              isOpen: true,
                              itemType: item.kind === 'Ticket' ? 'ticket' : 'complaint',
                              itemId: item.id,
                              title: item.title,
                            })
                          }
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-neutral-500 hover:text-primary-600"
                          title="Live QR Tracking"
                          onClick={() =>
                            setActiveQrModal({
                              isOpen: true,
                              itemType: item.kind === 'Ticket' ? 'ticket' : 'complaint',
                              itemId: item.id,
                              title: item.title,
                              qrCode: item.qrCode,
                            })
                          }
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>

                        <div className="text-right ml-1">
                          <Badge status={item.status as any} dot size="sm">
                            {item.status}
                          </Badge>
                          <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(item.updatedAt || item.createdAt)}
                          </p>
                        </div>

                        <div className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200">
                          {item.assignedTo?.name ? (
                            <span>Eng: {item.assignedTo.name}</span>
                          ) : (
                            <span className="text-status-open-500 font-semibold">Unassigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter border className="justify-between text-xs text-neutral-500">
              <span>Showing latest {Math.min(6, allUnifiedItems.length)} desk events</span>
              <span className="flex items-center gap-1 text-primary-600 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> High priority SLA guaranteed
              </span>
            </CardFooter>
          </Card>
        </div>
      ) : activeTab === 'employees' ? (
        <EmployeeManagement />
      ) : activeTab === 'customers' ? (
        <CustomerManagement />
      ) : activeTab === 'unassigned' ? (
        /* UNASSIGNED ITEMS TRIAGE VIEW */
        <div className="space-y-6">
          <Card>
            <CardHeader border>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Unassigned Items Triage</CardTitle>
                    <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3" /> Sorted by Priority & Date
                    </span>
                  </div>
                  <CardDescription>
                    Combined feed of incoming service tickets and complaints awaiting engineering assignment
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="w-48">
                    <Input
                      placeholder="Search unassigned..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-3.5 h-3.5" />}
                    />
                  </div>

                  <div className="w-36">
                    <Select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="all">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent noPadding>
              <TableContainer className="border-none rounded-none shadow-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type & ID</TableHead>
                      <TableHead>Subject & Customer</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA Timer</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="min-w-[170px]">Assign To Engineer</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-neutral-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                          Loading triage queue...
                        </TableCell>
                      </TableRow>
                    ) : filteredUnassigned.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-neutral-400">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-status-resolved-500 opacity-80" />
                          <p className="font-semibold text-neutral-800">Inbox Zero!</p>
                          <p className="text-xs text-neutral-500 mt-0.5">All tickets and complaints have been assigned.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUnassigned.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs font-semibold text-primary-700">
                                {item.kind === 'Ticket' ? 'TCK' : 'CMP'}-{item.id.substring(item.id.length - 6).toUpperCase()}
                              </span>
                              <Badge variant={item.kind === 'Ticket' ? 'primary' : 'danger'} size="sm">
                                {item.kind}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-neutral-900 leading-tight">{item.title}</span>
                              <span className="text-xs text-neutral-500 mt-0.5">
                                Customer: {item.customerName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                          </TableCell>

                          <TableCell>
                            <Badge priority={item.priority as any} dot size="sm">
                              {item.priority}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge status={item.status as any} dot size="sm">
                              {item.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <SlaBadge deadline={item.slaDeadline} status={item.status} />
                          </TableCell>

                          <TableCell className="text-xs text-neutral-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              {formatTimeAgo(item.updatedAt || item.createdAt)}
                            </span>
                          </TableCell>

                          {/* Inline Assign dropdown that updates assignedTo and sets status to "In Progress" */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <UserPlus className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                              <select
                                defaultValue="unassigned"
                                onChange={(e) => {
                                  if (item.kind === 'Ticket') {
                                    handleAssignTicket(item.id, e.target.value);
                                  } else {
                                    handleAssignComplaint(item.id, e.target.value);
                                  }
                                }}
                                className="w-full text-xs font-semibold bg-primary-50/50 border border-primary-200 rounded-lg px-2 py-1.5 text-primary-900 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                              >
                                <option value="unassigned">-- Select Assignee --</option>
                                {employees.map((emp) => (
                                  <option key={emp._id} value={emp._id}>
                                    {emp.userId?.name} ({emp.department || 'Support'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-1.5 text-neutral-500 hover:text-primary-600"
                                title="Documents & Evidence"
                                onClick={() =>
                                  setActiveAttachmentModal({
                                    isOpen: true,
                                    itemType: item.kind === 'Ticket' ? 'ticket' : 'complaint',
                                    itemId: item.id,
                                    title: item.title,
                                  })
                                }
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-1.5 text-neutral-500 hover:text-primary-600"
                                title="Live QR Tracking"
                                onClick={() =>
                                  setActiveQrModal({
                                    isOpen: true,
                                    itemType: item.kind === 'Ticket' ? 'ticket' : 'complaint',
                                    itemId: item.id,
                                    title: item.title,
                                    qrCode: item.qrCode,
                                  })
                                }
                              >
                                <QrCode className="w-3.5 h-3.5" />
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
              <span>{filteredUnassigned.length} items awaiting triage assignment</span>
              <span className="flex items-center gap-1 text-primary-600 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Assigning moves status to "In Progress"
              </span>
            </CardFooter>
          </Card>
        </div>
      ) : (
        /* Regular Tickets or Complaints Table View */
        <div className="space-y-6">
          <Card>
            <CardHeader border>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle>
                    {activeTab === 'tickets' ? 'All Service Tickets' : 'All Service Complaints'}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === 'tickets'
                      ? 'System-wide service queue with employee assignment control'
                      : 'System-wide formal complaints with employee assignment control'}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="w-48">
                    <Input
                      placeholder="Search queue..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      leftIcon={<Search className="w-3.5 h-3.5" />}
                    />
                  </div>

                  <div className="w-36">
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </Select>
                  </div>

                  <div className="w-36">
                    <Select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="all">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent noPadding>
              <TableContainer className="border-none rounded-none shadow-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Subject & Customer</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA Timer</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead className="min-w-[180px]">Assign To Employee</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-neutral-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                          Loading queue...
                        </TableCell>
                      </TableRow>
                    ) : filteredList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-neutral-400">
                          <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-medium">No records found matching your filters.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredList.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-mono text-xs font-semibold text-primary-700">
                            {item._id.length > 8
                              ? `${activeTab === 'tickets' ? 'TCK' : 'CMP'}-${item._id
                                  .substring(item._id.length - 6)
                                  .toUpperCase()}`
                              : item._id}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-neutral-900 leading-tight">{item.title}</span>
                              <span className="text-xs text-neutral-500 mt-0.5">
                                Customer: {item.customerId?.userId?.name || 'Customer Account'}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-xs text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                          </TableCell>

                          <TableCell>
                            <Badge priority={item.priority as any} dot size="sm">
                              {item.priority}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Badge status={item.status as any} dot size="sm">
                              {item.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <SlaBadge deadline={(item as any).slaDeadline} status={item.status} />
                          </TableCell>

                          <TableCell className="text-xs text-neutral-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              {formatTimeAgo(item.updatedAt || item.createdAt)}
                            </span>
                          </TableCell>

                          {/* Inline Assign-to-Employee Dropdown */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <UserPlus className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <select
                                value={item.assignedTo?._id || 'unassigned'}
                                onChange={(e) => {
                                  if (activeTab === 'tickets') {
                                    handleAssignTicket(item._id, e.target.value);
                                  } else {
                                    handleAssignComplaint(item._id, e.target.value);
                                  }
                                }}
                                className="w-full text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-neutral-800 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                              >
                                <option value="unassigned">-- Unassigned --</option>
                                {employees.map((emp) => (
                                  <option key={emp._id} value={emp._id}>
                                    {emp.userId?.name} ({emp.department || 'Support'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-1.5 text-neutral-500 hover:text-primary-600"
                                title="Documents & Evidence"
                                onClick={() =>
                                  setActiveAttachmentModal({
                                    isOpen: true,
                                    itemType: activeTab === 'tickets' ? 'ticket' : 'complaint',
                                    itemId: item._id,
                                    title: item.title,
                                  })
                                }
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-1.5 text-neutral-500 hover:text-primary-600"
                                title="Live QR Tracking"
                                onClick={() =>
                                  setActiveQrModal({
                                    isOpen: true,
                                    itemType: activeTab === 'tickets' ? 'ticket' : 'complaint',
                                    itemId: item._id,
                                    title: item.title,
                                    qrCode: (item as any).qrCode,
                                  })
                                }
                              >
                                <QrCode className="w-3.5 h-3.5" />
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
              <span>Total {filteredList.length} items listed</span>
              <span className="flex items-center gap-1 text-primary-600 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Real-time RBAC synchronized
              </span>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Provision Incident Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'tickets' ? 'Create Service Ticket' : 'Log Service Complaint'}
        description="Provision an administrative ticket or incident directly."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateNewItem} isLoading={isSubmitting}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateNewItem} className="space-y-4">
          <Input
            label="Title"
            placeholder="Subject..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </Select>

            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="API & Infrastructure">API & Infrastructure</option>
              <option value="Authentication">Authentication</option>
              <option value="Billing & Plans">Billing & Plans</option>
              <option value="Security">Security</option>
            </Select>
          </div>

          <Textarea
            label="Description"
            placeholder="Technical details..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </form>
      </Modal>

      {/* QR Code Tracking Modal */}
      <QRCodeModal
        isOpen={activeQrModal.isOpen}
        onClose={() => setActiveQrModal({ ...activeQrModal, isOpen: false })}
        itemId={activeQrModal.itemId}
        itemType={activeQrModal.itemType}
        itemTitle={activeQrModal.title}
        qrCodeDataUrl={activeQrModal.qrCode || undefined}
      />

      {/* Attachments / Document Evidence Modal */}
      <Modal
        isOpen={activeAttachmentModal.isOpen}
        onClose={() => setActiveAttachmentModal({ ...activeAttachmentModal, isOpen: false })}
        title={`Documents & Evidence - ${activeAttachmentModal.title}`}
        description="Verify uploaded evidence, photos, audit logs, and technical documents."
        size="lg"
      >
        <AttachmentSection
          itemId={activeAttachmentModal.itemId}
          itemType={activeAttachmentModal.itemType}
          canUpload={true}
        />
      </Modal>
    </SidebarLayout>
  );
}
