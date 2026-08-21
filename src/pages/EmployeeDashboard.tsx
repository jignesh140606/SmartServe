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
} from '../components/ui';
import {
  TicketCheck,
  CheckCircle2,
  Clock,
  LogOut,
  Search,
  Plus,
  Loader2,
  FileQuestion,
  Sparkles,
  RefreshCw,
  Mail,
  Ticket,
  AlertTriangle,
  Briefcase,
  ArrowUpDown,
  LayoutDashboard,
  Flame,
  ArrowRight,
} from 'lucide-react';
import {
  complaintService,
  type ComplaintData,
  type ComplaintStatus,
} from '../services/complaintService';
import {
  ticketService,
  type TicketData,
  type TicketPriority,
  type TicketStatus,
} from '../services/ticketService';
import { formatTimeAgo, getPriorityWeight } from '../lib/dateUtils';
import { AnalyticsView } from './shared/AnalyticsView';
import { SettingsView } from './shared/SettingsView';

type EmployeeViewTab = 'overview' | 'my-work' | 'tickets' | 'complaints' | 'analytics' | 'settings';

interface EmployeeWorkItem {
  id: string;
  kind: 'Ticket' | 'Complaint';
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<EmployeeViewTab>('overview');

  // Data states
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Direct Incident Logging Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical Support',
    priority: 'Medium' as TicketPriority,
    description: '',
  });

  useEffect(() => {
    fetchAssignedWork();
  }, []);

  const fetchAssignedWork = async () => {
    try {
      setIsLoading(true);
      const [ticketsData, complaintsData] = await Promise.all([
        ticketService.getTickets().catch(() => []),
        complaintService.getComplaints().catch(() => []),
      ]);
      if (ticketsData) setTickets(ticketsData);
      if (complaintsData) setComplaints(complaintsData);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketStatusUpdate = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const updated = await ticketService.updateTicketStatus(ticketId, newStatus);
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? updated : t)));
      setToastMessage(`Ticket status updated to ${newStatus}.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Failed to update ticket status.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleComplaintStatusUpdate = async (complaintId: string, newStatus: ComplaintStatus) => {
    try {
      const updated = await complaintService.updateComplaintStatus(complaintId, newStatus);
      setComplaints((prev) => prev.map((c) => (c._id === complaintId ? updated : c)));
      setToastMessage(`Complaint status updated to ${newStatus}.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Failed to update complaint status.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleCreateDirectItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    try {
      setIsSubmitting(true);
      if (activeTab === 'complaints') {
        const newComplaint = await complaintService.createComplaint(formData);
        setComplaints([newComplaint, ...complaints]);
        setToastMessage('Complaint logged successfully.');
      } else {
        const newTicket = await ticketService.createTicket(formData);
        setTickets([newTicket, ...tickets]);
        setToastMessage('Ticket logged successfully.');
      }
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: 'Technical Support',
        priority: 'Medium',
        description: '',
      });
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Failed to log record.');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine tickets + complaints into "My Work"
  const myWorkCombined: EmployeeWorkItem[] = [
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
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
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
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  ].sort((a, b) => {
    if (sortBy === 'priority') {
      const pDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      if (pDiff !== 0) return pDiff;
    }
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
  });

  // Urgent subset for Overview (Critical or High priority)
  const urgentItems = myWorkCombined.filter(
    (item) => (item.priority === 'Critical' || item.priority === 'High') && item.status !== 'Resolved' && item.status !== 'Closed'
  );

  const filteredMyWork = myWorkCombined.filter((item) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(query);
    const customerMatch = item.customerName.toLowerCase().includes(query);
    const categoryMatch = item.category?.toLowerCase().includes(query);
    const searchPass = !searchQuery || titleMatch || customerMatch || categoryMatch;
    const statusPass =
      statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    return searchPass && statusPass;
  });

  // Dedicated Tickets / Complaints list
  const currentTabList = activeTab === 'tickets' ? tickets : complaints;
  const filteredTabList = currentTabList.filter((item) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(query);
    const customerMatch = item.customerId?.userId?.name?.toLowerCase().includes(query) || false;
    const categoryMatch = item.category?.toLowerCase().includes(query) || false;
    const searchPass = !searchQuery || titleMatch || customerMatch || categoryMatch;
    const statusPass =
      statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    return searchPass && statusPass;
  });

  const totalAssignedCount = myWorkCombined.length;
  const inProgressCount = myWorkCombined.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = myWorkCombined.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const urgentCount = urgentItems.length;

  return (
    <SidebarLayout
      activeNavId={activeTab === 'overview' ? 'dashboard' : activeTab === 'my-work' ? 'tickets' : activeTab === 'tickets' ? 'tickets' : activeTab === 'complaints' ? 'queues' : activeTab === 'analytics' ? 'analytics' : activeTab === 'settings' ? 'settings' : 'dashboard'}
      topbarTitle="Support Specialist Workspace"
      ticketsBadge={tickets.length}
      queuesBadge={complaints.length}
      onNavSelect={(id) => {
        if (id === 'dashboard') setActiveTab('overview');
        else if (id === 'tickets') setActiveTab('my-work');
        else if (id === 'queues') setActiveTab('complaints');
        else if (id === 'analytics') setActiveTab('analytics');
        else if (id === 'settings') setActiveTab('settings');
      }}
      onNewTicketClick={() => setIsModalOpen(true)}
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Agent Service Desk</h2>
            <Badge variant="primary" size="sm">
              Assigned Specialist
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Signed in as <strong className="text-neutral-700">{user?.name}</strong> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Work Queue Switcher */}
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
                setActiveTab('my-work');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'my-work'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              My Work ({totalAssignedCount})
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
              Tickets ({tickets.length})
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
              Complaints ({complaints.length})
            </button>
          </div>

          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={fetchAssignedWork}>
            Refresh
          </Button>

          <Button variant="secondary" size="sm" leftIcon={<LogOut className="w-3.5 h-3.5" />} onClick={logout}>
            Sign Out
          </Button>

          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsModalOpen(true)}>
            Log Incident
          </Button>
        </div>
      </div>

      {/* Action Notification Toast */}
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

      {/* Render Active Tab */}
      {activeTab === 'analytics' ? (
        <AnalyticsView tickets={tickets} complaints={complaints} roleTitle="Desk" />
      ) : activeTab === 'settings' ? (
        <SettingsView />
      ) : activeTab === 'overview' ? (
        /* 2. EMPLOYEE DASHBOARD OVERVIEW HOME VIEW */
        <div className="space-y-6">
          {/* Personal Metric Cards (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverEffect>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Assigned Work Total
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                    <TicketCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{totalAssignedCount} Items</span>
                  <Badge variant="primary" size="sm">
                    Personal Queue
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    In Progress
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-status-in-progress-bg text-status-in-progress-500 flex items-center justify-center border border-status-in-progress-border">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{inProgressCount} Active</span>
                  <Badge status="in-progress" size="sm" dot>
                    Handling Now
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Resolved Successfully
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-status-resolved-bg text-status-resolved-500 flex items-center justify-center border border-status-resolved-border">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{resolvedCount} Completed</span>
                  <Badge status="resolved" size="sm" dot>
                    Closed Out
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Urgent (Critical / High)
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-priority-critical-bg text-priority-critical-text flex items-center justify-center border border-priority-critical-border">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{urgentCount} Urgent</span>
                  <Badge priority="critical" size="sm" dot>
                    High Attention
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Urgent Items List (High & Critical) */}
          <Card>
            <CardHeader border>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Urgent Action Queue</CardTitle>
                    <Badge priority="critical" size="sm">
                      Critical & High SLA
                    </Badge>
                  </div>
                  <CardDescription>
                    Assigned items requiring immediate resolution or progress status updates
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => setActiveTab('my-work')}
                >
                  View All Work ({totalAssignedCount})
                </Button>
              </div>
            </CardHeader>

            <CardContent noPadding>
              {isLoading ? (
                <div className="py-12 text-center text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading urgent assignments...
                </div>
              ) : urgentItems.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-status-resolved-500 opacity-80" />
                  <p className="font-semibold text-neutral-800">No Pending Urgent Items!</p>
                  <p className="text-xs text-neutral-500 mt-0.5">All critical and high priority tasks are handled.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {urgentItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-neutral-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
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
                            <Badge status={item.status as any} dot size="sm">
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Customer: <strong className="text-neutral-700">{item.customerName}</strong> ({item.customerEmail}) •{' '}
                            Category: <span className="text-neutral-700">{item.category}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                        <span className="text-xs text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.updatedAt || item.createdAt)}
                        </span>

                        <select
                          value={item.status}
                          onChange={(e) => {
                            if (item.kind === 'Ticket') {
                              handleTicketStatusUpdate(item.id, e.target.value as TicketStatus);
                            } else {
                              handleComplaintStatusUpdate(item.id, e.target.value as ComplaintStatus);
                            }
                          }}
                          className="text-xs font-semibold bg-neutral-100 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:bg-white focus:border-primary-500 transition-colors"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Mark Resolved</option>
                          <option value="Closed">Close</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter border className="justify-between text-xs text-neutral-500">
              <span>{urgentItems.length} urgent tasks requiring attention</span>
              <span className="flex items-center gap-1 text-primary-600 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> High priority SLA guaranteed
              </span>
            </CardFooter>
          </Card>
        </div>
      ) : (
        /* My Work (Combined) or Dedicated Views Table */
        <Card>
          <CardHeader border>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>
                    {activeTab === 'my-work' ? 'My Work — Unified Queue' : activeTab === 'tickets' ? 'My Assigned Tickets' : 'My Assigned Complaints'}
                  </CardTitle>
                  {activeTab === 'my-work' && (
                    <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3" /> Sorted by {sortBy === 'priority' ? 'Priority' : 'Recent Activity'}
                    </span>
                  )}
                </div>
                <CardDescription>
                  {activeTab === 'my-work'
                    ? 'Combined queue of all service tickets and complaints assigned to you'
                    : 'Manage specific items assigned to your engineering desk'}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-48">
                  <Input
                    placeholder="Filter work..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-3.5 h-3.5" />}
                  />
                </div>

                {activeTab === 'my-work' && (
                  <div className="w-36">
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'priority' | 'date')}
                    >
                      <option value="priority">Sort by Priority</option>
                      <option value="date">Sort by Recent</option>
                    </Select>
                  </div>
                )}

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
                    <TableHead>Current Status</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="min-w-[180px]">Update Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeTab === 'my-work' ? (
                    isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-neutral-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                          Loading assigned queue...
                        </TableCell>
                      </TableRow>
                    ) : filteredMyWork.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-neutral-400">
                          <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-medium">No assigned items found in your work queue.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMyWork.map((item) => (
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
                              <span className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-neutral-400" />
                                {item.customerName} ({item.customerEmail})
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

                          <TableCell className="text-xs text-neutral-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              {formatTimeAgo(item.updatedAt || item.createdAt)}
                            </span>
                          </TableCell>

                          {/* Status Update Dropdown (Open -> In Progress -> Resolved -> Closed) */}
                          <TableCell>
                            <select
                              value={item.status}
                              onChange={(e) => {
                                if (item.kind === 'Ticket') {
                                  handleTicketStatusUpdate(item.id, e.target.value as TicketStatus);
                                } else {
                                  handleComplaintStatusUpdate(item.id, e.target.value as ComplaintStatus);
                                }
                              }}
                              className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-neutral-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                          Loading assigned items...
                        </TableCell>
                      </TableRow>
                    ) : filteredTabList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-neutral-400">
                          <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-medium">No assigned items found.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTabList.map((item) => (
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
                              <span className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-neutral-400" />
                                {item.customerId?.userId?.name || 'Customer'} ({item.customerId?.userId?.email || 'N/A'})
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

                          <TableCell className="text-xs text-neutral-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              {formatTimeAgo(item.updatedAt || item.createdAt)}
                            </span>
                          </TableCell>

                          <TableCell>
                            <select
                              value={item.status}
                              onChange={(e) => {
                                if (activeTab === 'tickets') {
                                  handleTicketStatusUpdate(item._id, e.target.value as TicketStatus);
                                } else {
                                  handleComplaintStatusUpdate(item._id, e.target.value as ComplaintStatus);
                                }
                              }}
                              className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>

          <CardFooter border className="justify-between text-xs text-neutral-500">
            <span>
              {activeTab === 'my-work' ? filteredMyWork.length : filteredTabList.length} items in personal work queue
            </span>
            <span className="flex items-center gap-1 text-primary-600 font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Items under active SLA monitoring
            </span>
          </CardFooter>
        </Card>
      )}

      {/* Direct Incident Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'complaints' ? 'Log Support Complaint' : 'Log Service Ticket'}
        description="Record a direct client communication or technical task."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateDirectItem} isLoading={isSubmitting}>
              Add to Queue
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateDirectItem} className="space-y-4">
          <Input
            label="Subject"
            placeholder="Issue summary"
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
              <option value="Technical Support">Technical Support</option>
              <option value="API & Infrastructure">API & Infrastructure</option>
              <option value="Billing & Plans">Billing & Plans</option>
            </Select>
          </div>

          <Textarea
            label="Detailed Description"
            placeholder="Agent notes, error logs, and client details..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </form>
      </Modal>
    </SidebarLayout>
  );
}
