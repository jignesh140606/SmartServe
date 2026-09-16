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
  RatingModal,
  AttachmentSection,
} from '../components/ui';
import {
  LifeBuoy,
  Plus,
  Clock,
  FileQuestion,
  LogOut,
  Sparkles,
  AlertCircle,
  Edit2,
  Loader2,
  CheckCircle2,
  Ticket,
  AlertTriangle,
  LayoutDashboard,
  ArrowRight,
  Send,
  MessageSquarePlus,
  QrCode,
  Paperclip,
  Star,
} from 'lucide-react';
import {
  complaintService,
  type ComplaintData,
  type ComplaintPriority,
  type CreateComplaintPayload,
} from '../services/complaintService';
import {
  ticketService,
  type TicketData,
  type TicketPriority,
  type CreateTicketPayload,
} from '../services/ticketService';
import { formatTimeAgo } from '../lib/dateUtils';
import { AnalyticsView } from './shared/AnalyticsView';
import { SettingsView } from './shared/SettingsView';
import { ratingService } from '../services/ratingService';
import type { AxiosError } from 'axios';

type CustomerViewSection = 'overview' | 'tickets' | 'complaints' | 'analytics' | 'settings';

interface CustomerFeedItem {
  id: string;
  kind: 'Ticket' | 'Complaint';
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedToName?: string;
  slaDeadline?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<CustomerViewSection>('overview');

  // Modal states for new features
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

  const [activeRatingModal, setActiveRatingModal] = useState<{
    isOpen: boolean;
    itemType: 'Ticket' | 'Complaint';
    itemId: string;
    title: string;
  }>({
    isOpen: false,
    itemType: 'Ticket',
    itemId: '',
    title: '',
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

  // Tickets state
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState<boolean>(true);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isEditTicketModalOpen, setIsEditTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketFormData, setTicketFormData] = useState<CreateTicketPayload>({
    title: '',
    category: 'General Request',
    priority: 'Medium',
    description: '',
  });
  const [editTicketFormData, setEditTicketFormData] = useState<CreateTicketPayload>({
    title: '',
    category: 'General Request',
    priority: 'Medium',
    description: '',
  });

  // Complaints state
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [isComplaintsLoading, setIsComplaintsLoading] = useState<boolean>(true);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [isEditComplaintModalOpen, setIsEditComplaintModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintData | null>(null);
  const [complaintFormData, setComplaintFormData] = useState<CreateComplaintPayload>({
    title: '',
    category: 'Technical Support',
    priority: 'Medium',
    description: '',
  });
  const [editComplaintFormData, setEditComplaintFormData] = useState<CreateComplaintPayload>({
    title: '',
    category: 'Technical Support',
    priority: 'Medium',
    description: '',
  });

  // Common UI State
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [myRatingsMap, setMyRatingsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchTickets();
    fetchComplaints();
    fetchMyRatings();
  }, []);

  const fetchMyRatings = async () => {
    try {
      const ratings = await ratingService.getMyRatings();
      const map: Record<string, number> = {};
      ratings.forEach((r) => {
        map[r.itemId] = r.rating;
      });
      setMyRatingsMap(map);
    } catch {
      // ignore
    }
  };

  const fetchTickets = async () => {
    try {
      setIsTicketsLoading(true);
      const data = await ticketService.getTickets();
      if (data) setTickets(data);
    } catch {
      // Fallback
    } finally {
      setIsTicketsLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setIsComplaintsLoading(true);
      const data = await complaintService.getComplaints();
      if (data) setComplaints(data);
    } catch {
      // Fallback
    } finally {
      setIsComplaintsLoading(false);
    }
  };

  // Ticket Handlers
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!ticketFormData.title || !ticketFormData.description) {
      setFormError('Please enter both a title and description for your ticket.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newTicket = await ticketService.createTicket(ticketFormData);
      setTickets([newTicket, ...tickets]);
      setIsTicketModalOpen(false);
      setActionSuccess('Service ticket created successfully.');
      setTicketFormData({
        title: '',
        category: 'General Request',
        priority: 'Medium',
        description: '',
      });
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || 'Failed to create ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditTicketModal = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setEditTicketFormData({
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      description: ticket.description,
    });
    setFormError(null);
    setIsEditTicketModalOpen(true);
  };

  const handleEditTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setIsSubmitting(true);
      const updated = await ticketService.updateTicket(selectedTicket._id, editTicketFormData);
      setTickets(tickets.map((t) => (t._id === selectedTicket._id ? updated : t)));
      setIsEditTicketModalOpen(false);
      setActionSuccess('Ticket details updated.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || 'Failed to update ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complaint Handlers
  const handleRaiseComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!complaintFormData.title || !complaintFormData.description) {
      setFormError('Please enter both a title and description for your complaint.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newComplaint = await complaintService.createComplaint(complaintFormData);
      setComplaints([newComplaint, ...complaints]);
      setIsComplaintModalOpen(false);
      setActionSuccess('Your service complaint has been submitted successfully.');
      setComplaintFormData({
        title: '',
        category: 'Technical Support',
        priority: 'Medium',
        description: '',
      });
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditComplaintModal = (complaint: ComplaintData) => {
    setSelectedComplaint(complaint);
    setEditComplaintFormData({
      title: complaint.title,
      category: complaint.category,
      priority: complaint.priority,
      description: complaint.description,
    });
    setFormError(null);
    setIsEditComplaintModalOpen(true);
  };

  const handleEditComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setIsSubmitting(true);
      const updated = await complaintService.updateComplaint(selectedComplaint._id, editComplaintFormData);
      setComplaints(complaints.map((c) => (c._id === selectedComplaint._id ? updated : c)));
      setIsEditComplaintModalOpen(false);
      setActionSuccess('Complaint details updated.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setFormError(axiosError.response?.data?.message || 'Failed to update complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [solvingItemId, setSolvingItemId] = useState<string | null>(null);

  const handleMarkItemSolved = async (item: { id: string; kind: 'Ticket' | 'Complaint'; title: string }) => {
    try {
      setSolvingItemId(item.id);
      if (item.kind === 'Ticket') {
        await ticketService.updateTicketStatus(item.id, 'Resolved');
      } else {
        await complaintService.updateComplaintStatus(item.id, 'Resolved');
      }
      setActionSuccess(`Great! ${item.kind} "${item.title}" has been marked as Solved. Please share your rating!`);
      await Promise.all([fetchTickets(), fetchComplaints(), fetchMyRatings()]);
      setActiveRatingModal({
        isOpen: true,
        itemType: item.kind,
        itemId: item.id,
        title: item.title,
      });
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      alert(axiosError.response?.data?.message || `Failed to mark ${item.kind.toLowerCase()} as solved.`);
    } finally {
      setSolvingItemId(null);
    }
  };

  // All combined customer items
  const combinedCustomerFeed: CustomerFeedItem[] = [
    ...tickets.map((t) => ({
      id: t._id,
      kind: 'Ticket' as const,
      title: t.title,
      description: t.description,
      category: t.category,
      priority: t.priority,
      status: t.status,
      assignedToName: t.assignedTo?.userId?.name,
      slaDeadline: t.slaDeadline,
      qrCode: t.qrCode,
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
      assignedToName: c.assignedTo?.userId?.name,
      slaDeadline: c.slaDeadline,
      qrCode: c.qrCode,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  ].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  // Metrics
  const totalSubmittedCount = combinedCustomerFeed.length;
  const openCount = combinedCustomerFeed.filter((item) => item.status === 'Open').length;
  const inProgressCount = combinedCustomerFeed.filter((item) => item.status === 'In Progress').length;
  const resolvedCount = combinedCustomerFeed.filter((item) => item.status === 'Resolved' || item.status === 'Closed').length;

  return (
    <SidebarLayout
      activeNavId={activeSection === 'overview' ? 'dashboard' : activeSection === 'tickets' ? 'tickets' : activeSection === 'complaints' ? 'queues' : activeSection === 'analytics' ? 'analytics' : activeSection === 'settings' ? 'settings' : 'dashboard'}
      topbarTitle="Customer Service Portal"
      ticketsBadge={tickets.length}
      queuesBadge={complaints.length}
      onNavSelect={(id) => {
        if (id === 'dashboard') setActiveSection('overview');
        else if (id === 'tickets') setActiveSection('tickets');
        else if (id === 'queues') setActiveSection('complaints');
        else if (id === 'analytics') setActiveSection('analytics');
        else if (id === 'settings') setActiveSection('settings');
      }}
      onNewTicketClick={() => {
        setFormError(null);
        setIsTicketModalOpen(true);
      }}
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Customer Support Portal</h2>
            <Badge variant="primary" size="sm">
              Customer Account
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Welcome back, <strong className="text-neutral-700">{user?.name}</strong> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Section Switcher */}
          <div className="inline-flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 shadow-soft-xs flex-wrap">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeSection === 'overview'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview
            </button>
            <button
              onClick={() => setActiveSection('tickets')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeSection === 'tickets'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              My Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setActiveSection('complaints')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeSection === 'complaints'
                  ? 'bg-white text-primary-700 shadow-soft-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              My Complaints ({complaints.length})
            </button>
          </div>

          <Button variant="secondary" size="sm" leftIcon={<LogOut className="w-3.5 h-3.5" />} onClick={logout}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-status-resolved-bg border border-status-resolved-border flex items-center justify-between text-status-resolved-text text-sm shadow-soft-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-status-resolved-500 shrink-0" />
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

      {/* Render Active View */}
      {activeSection === 'analytics' ? (
        <AnalyticsView tickets={tickets} complaints={complaints} roleTitle="Customer" />
      ) : activeSection === 'settings' ? (
        <SettingsView />
      ) : activeSection === 'overview' ? (
        /* 3. CUSTOMER DASHBOARD OVERVIEW HOME VIEW */
        <div className="space-y-6">
          {/* Status Breakdown Stat Cards (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card hoverEffect>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Total Submitted
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                    <LifeBuoy className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{totalSubmittedCount}</span>
                  <Badge variant="primary" size="sm">
                    All Inquiries
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Open / Under Review
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-status-open-bg text-status-open-500 flex items-center justify-center border border-status-open-border">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{openCount}</span>
                  <Badge status="open" size="sm" dot>
                    Queued
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    In Progress with Engineer
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-status-in-progress-bg text-status-in-progress-500 flex items-center justify-center border border-status-in-progress-border">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{inProgressCount}</span>
                  <Badge status="in-progress" size="sm" dot>
                    Under Handling
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Resolved & Closed
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-status-resolved-bg text-status-resolved-500 flex items-center justify-center border border-status-resolved-border">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-neutral-900">{resolvedCount}</span>
                  <Badge status="resolved" size="sm" dot>
                    Resolved
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* "Raise New" Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card hoverEffect className="border-primary-200 bg-gradient-to-br from-primary-50/40 via-white to-white">
              <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-soft-xs shrink-0">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">Create a Service Ticket</h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Need help with technical integration, billing questions, or general service inquiries? Our support team will assist you.
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setFormError(null);
                      setIsTicketModalOpen(true);
                    }}
                  >
                    Create Service Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card hoverEffect className="border-priority-high-border bg-gradient-to-br from-priority-high-bg/30 via-white to-white">
              <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-priority-high-text text-white flex items-center justify-center shadow-soft-xs shrink-0">
                    <MessageSquarePlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900">Raise a Formal Complaint</h3>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Facing service disruptions, SLA violations, or urgent downtime? Submit a complaint for prioritized escalation.
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full justify-center border-priority-high-border text-priority-high-text hover:bg-priority-high-bg"
                    leftIcon={<AlertTriangle className="w-4 h-4" />}
                    onClick={() => {
                      setFormError(null);
                      setIsComplaintModalOpen(true);
                    }}
                  >
                    Raise Formal Complaint
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Inquiries Activity Snapshot */}
          <Card>
            <CardHeader border>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Service Inquiries</CardTitle>
                  <CardDescription>Latest status updates on your submitted tickets and complaints</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => setActiveSection('tickets')}
                >
                  View All History
                </Button>
              </div>
            </CardHeader>

            <CardContent noPadding>
              {isTicketsLoading || isComplaintsLoading ? (
                <div className="py-12 text-center text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading your inquiries...
                </div>
              ) : combinedCustomerFeed.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No service inquiries submitted yet.</p>
                  <p className="text-xs text-neutral-500 mt-1">Use the quick actions above to submit your first ticket.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {combinedCustomerFeed.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 transition-colors"
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
                            <SlaBadge deadline={item.slaDeadline} status={item.status} />
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Category: <span className="text-neutral-700">{item.category}</span> • Specialist:{' '}
                            <span className="text-neutral-700 font-medium">
                              {item.assignedToName || 'Awaiting Assignment'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-neutral-500 hover:text-primary-600"
                          title="View / Upload Documents"
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
                        {item.status === 'Resolved' || item.status === 'Closed' ? (
                          myRatingsMap[item.id] ? (
                            <span
                              className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md cursor-default"
                              title="Feedback Submitted (Only allowed once)"
                            >
                              <Star className="w-3 h-3 text-amber-500 fill-amber-400 mr-1" />
                              {myRatingsMap[item.id]}★ Rated
                            </span>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-amber-700 bg-amber-50/70 border-amber-300 hover:bg-amber-100/70 text-xs font-semibold shadow-2xs"
                              title="Rate Service Experience (1-5 Stars)"
                              onClick={() =>
                                setActiveRatingModal({
                                  isOpen: true,
                                  itemType: item.kind,
                                  itemId: item.id,
                                  title: item.title,
                                })
                              }
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 mr-1.5" />
                              Rate CSAT
                            </Button>
                          )
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-emerald-700 bg-emerald-50/80 border-emerald-300 hover:bg-emerald-100 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                            title="Mark this issue as solved from your side"
                            disabled={solvingItemId === item.id}
                            onClick={() => handleMarkItemSolved({ id: item.id, kind: item.kind, title: item.title })}
                          >
                            {solvingItemId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            <span>Mark as Solved</span>
                          </Button>
                        )}
                        <div className="text-right ml-1">
                          <Badge status={item.status as any} dot size="sm">
                            {item.status}
                          </Badge>
                          <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(item.updatedAt || item.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <CardFooter border className="justify-between text-xs text-neutral-500">
              <span>Showing latest {Math.min(5, combinedCustomerFeed.length)} interactions</span>
              <span className="flex items-center gap-1 text-primary-600 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> High priority complaints assigned within 30 minutes
              </span>
            </CardFooter>
          </Card>
        </div>
      ) : (
        /* Dedicated Tickets or Complaints Table View */
        <Card>
          <CardHeader border>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>
                  {activeSection === 'tickets' ? 'My Service Tickets' : 'My Service Complaints'}
                </CardTitle>
                <CardDescription>
                  {activeSection === 'tickets'
                    ? 'Track and manage service requests and inquiries'
                    : 'Track formal complaints and resolution progress'}
                </CardDescription>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setFormError(null);
                  if (activeSection === 'tickets') setIsTicketModalOpen(true);
                  else setIsComplaintModalOpen(true);
                }}
              >
                {activeSection === 'tickets' ? 'Create Ticket' : 'Raise Complaint'}
              </Button>
            </div>
          </CardHeader>

          <CardContent noPadding>
            <TableContainer className="border-none rounded-none shadow-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Subject & Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA Timer</TableHead>
                    <TableHead>Assigned Specialist</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSection === 'tickets' ? (
                    isTicketsLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-neutral-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                          Loading your service tickets...
                        </TableCell>
                      </TableRow>
                    ) : tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-neutral-400">
                          <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-medium">No service tickets submitted yet.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((t) => (
                        <TableRow key={t._id}>
                          <TableCell className="font-mono text-xs font-semibold text-primary-700">
                            {t._id.length > 8 ? `TCK-${t._id.substring(t._id.length - 6).toUpperCase()}` : t._id}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-neutral-900 leading-tight">{t.title}</span>
                              <span className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{t.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center text-xs font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                              {t.category}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge priority={t.priority} dot size="sm">
                              {t.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge status={t.status} dot size="sm">
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <SlaBadge deadline={t.slaDeadline} status={t.status} />
                          </TableCell>
                          <TableCell className="text-xs text-neutral-600">
                            {t.assignedTo?.userId?.name ? (
                              <span className="font-medium text-neutral-800">{t.assignedTo.userId.name}</span>
                            ) : (
                              <span className="text-neutral-400 italic">Pending Assignment</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-neutral-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              {formatTimeAgo(t.updatedAt || t.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-1.5 text-neutral-500 hover:text-primary-600"
                                title="Documents & Evidence"
                                onClick={() =>
                                  setActiveAttachmentModal({
                                    isOpen: true,
                                    itemType: 'ticket',
                                    itemId: t._id,
                                    title: t.title,
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
                                    itemType: 'ticket',
                                    itemId: t._id,
                                    title: t.title,
                                    qrCode: t.qrCode,
                                  })
                                }
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </Button>
                              {t.status === 'Resolved' || t.status === 'Closed' ? (
                                myRatingsMap[t._id] ? (
                                  <span
                                    className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md cursor-default"
                                    title="Feedback Submitted (Only allowed once)"
                                  >
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-400 mr-1" />
                                    {myRatingsMap[t._id]}★ Rated
                                  </span>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-amber-700 bg-amber-50/70 border-amber-300 hover:bg-amber-100/70 text-xs font-semibold"
                                    title="Rate Service Experience (1-5 Stars)"
                                    onClick={() =>
                                      setActiveRatingModal({
                                        isOpen: true,
                                        itemType: 'Ticket',
                                        itemId: t._id,
                                        title: t.title,
                                      })
                                    }
                                  >
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-400 mr-1" />
                                    Rate CSAT
                                  </Button>
                                )
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-emerald-700 bg-emerald-50/80 border-emerald-300 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1"
                                  title="Mark this ticket as solved from your side"
                                  disabled={solvingItemId === t._id}
                                  onClick={() => handleMarkItemSolved({ id: t._id, kind: 'Ticket', title: t.title })}
                                >
                                  {solvingItemId === t._id ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  )}
                                  <span>Solved</span>
                                </Button>
                              )}
                              {t.status === 'Open' && !t.assignedTo ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-7 text-xs"
                                  leftIcon={<Edit2 className="w-3 h-3" />}
                                  onClick={() => openEditTicketModal(t)}
                                >
                                  Edit
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    isComplaintsLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-neutral-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                          Loading your complaints...
                        </TableCell>
                      </TableRow>
                    ) : complaints.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-neutral-400">
                          <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-medium">No complaints submitted yet.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      complaints.map((c) => (
                        <TableRow key={c._id}>
                          <TableCell className="font-mono text-xs font-semibold text-primary-700">
                            {c._id.length > 8 ? `CMP-${c._id.substring(c._id.length - 6).toUpperCase()}` : c._id}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-neutral-900 leading-tight">{c.title}</span>
                              <span className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{c.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center text-xs font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                              {c.category}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge priority={c.priority} dot size="sm">
                              {c.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge status={c.status} dot size="sm">
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <SlaBadge deadline={c.slaDeadline} status={c.status} />
                          </TableCell>
                          <TableCell className="text-xs text-neutral-600">
                            {c.assignedTo?.userId?.name ? (
                              <span className="font-medium text-neutral-800">{c.assignedTo.userId.name}</span>
                            ) : (
                              <span className="text-neutral-400 italic">Pending Assignment</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-neutral-500 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              {formatTimeAgo(c.updatedAt || c.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-1.5 text-neutral-500 hover:text-primary-600"
                                title="Documents & Evidence"
                                onClick={() =>
                                  setActiveAttachmentModal({
                                    isOpen: true,
                                    itemType: 'complaint',
                                    itemId: c._id,
                                    title: c.title,
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
                                    itemType: 'complaint',
                                    itemId: c._id,
                                    title: c.title,
                                    qrCode: c.qrCode,
                                  })
                                }
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </Button>
                              {c.status === 'Resolved' || c.status === 'Closed' ? (
                                myRatingsMap[c._id] ? (
                                  <span
                                    className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md cursor-default"
                                    title="Feedback Submitted (Only allowed once)"
                                  >
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-400 mr-1" />
                                    {myRatingsMap[c._id]}★ Rated
                                  </span>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-amber-700 bg-amber-50/70 border-amber-300 hover:bg-amber-100/70 text-xs font-semibold"
                                    title="Rate Service Experience (1-5 Stars)"
                                    onClick={() =>
                                      setActiveRatingModal({
                                        isOpen: true,
                                        itemType: 'Complaint',
                                        itemId: c._id,
                                        title: c.title,
                                      })
                                    }
                                  >
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-400 mr-1" />
                                    Rate CSAT
                                  </Button>
                                )
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-emerald-700 bg-emerald-50/80 border-emerald-300 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1"
                                  title="Mark this complaint as solved from your side"
                                  disabled={solvingItemId === c._id}
                                  onClick={() => handleMarkItemSolved({ id: c._id, kind: 'Complaint', title: c.title })}
                                >
                                  {solvingItemId === c._id ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  )}
                                  <span>Solved</span>
                                </Button>
                              )}
                              {c.status === 'Open' && !c.assignedTo ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-7 text-xs"
                                  leftIcon={<Edit2 className="w-3 h-3" />}
                                  onClick={() => openEditComplaintModal(c)}
                                >
                                  Edit
                                </Button>
                              ) : null}
                            </div>
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
              Showing {activeSection === 'tickets' ? tickets.length : complaints.length} records in {activeSection}
            </span>
            <span className="flex items-center gap-1 text-primary-600 font-medium">
              <Sparkles className="w-3.5 h-3.5" /> High priority items assigned within 30 minutes
            </span>
          </CardFooter>
        </Card>
      )}

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Create a Service Ticket"
        description="Submit a service inquiry or technical request to our team."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsTicketModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateTicket} isLoading={isSubmitting}>
              Submit Ticket
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-status-open-bg border border-status-open-border flex items-start gap-2 text-status-open-text text-xs">
              <AlertCircle className="w-4 h-4 text-status-open-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Ticket Subject"
            placeholder="Brief description of your inquiry"
            value={ticketFormData.title}
            onChange={(e) => setTicketFormData({ ...ticketFormData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category"
              value={ticketFormData.category}
              onChange={(e) => setTicketFormData({ ...ticketFormData, category: e.target.value })}
            >
              <option value="General Request">General Request</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Billing & Invoicing">Billing & Invoicing</option>
              <option value="API & Integrations">API & Integrations</option>
              <option value="Account Settings">Account Settings</option>
            </Select>

            <Select
              label="Priority Level"
              value={ticketFormData.priority}
              onChange={(e) => setTicketFormData({ ...ticketFormData, priority: e.target.value as TicketPriority })}
            >
              <option value="Low">Low (Blue)</option>
              <option value="Medium">Medium (Yellow)</option>
              <option value="High">High (Orange)</option>
              <option value="Critical">Critical (Red)</option>
            </Select>
          </div>

          <Textarea
            label="Details & Context"
            placeholder="Please provide full details about your inquiry..."
            rows={4}
            value={ticketFormData.description}
            onChange={(e) => setTicketFormData({ ...ticketFormData, description: e.target.value })}
            required
          />
        </form>
      </Modal>

      {/* Edit Ticket Modal */}
      <Modal
        isOpen={isEditTicketModalOpen}
        onClose={() => setIsEditTicketModalOpen(false)}
        title="Edit Ticket Details"
        description="Update ticket information while it is in Open status prior to assignment."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditTicketModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditTicket} isLoading={isSubmitting}>
              Save Updates
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditTicket} className="space-y-4">
          <Input
            label="Subject"
            value={editTicketFormData.title}
            onChange={(e) => setEditTicketFormData({ ...editTicketFormData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={editTicketFormData.category}
              onChange={(e) => setEditTicketFormData({ ...editTicketFormData, category: e.target.value })}
            >
              <option value="General Request">General Request</option>
              <option value="Technical Support">Technical Support</option>
              <option value="Billing & Invoicing">Billing & Invoicing</option>
              <option value="API & Integrations">API & Integrations</option>
            </Select>

            <Select
              label="Priority"
              value={editTicketFormData.priority}
              onChange={(e) => setEditTicketFormData({ ...editTicketFormData, priority: e.target.value as TicketPriority })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </Select>
          </div>

          <Textarea
            label="Description"
            rows={3}
            value={editTicketFormData.description}
            onChange={(e) => setEditTicketFormData({ ...editTicketFormData, description: e.target.value })}
            required
          />
        </form>
      </Modal>

      {/* Raise Complaint Modal */}
      <Modal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        title="Raise a Service Complaint"
        description="Describe your incident or formal complaint. Our service team will take action immediately."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsComplaintModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRaiseComplaint} isLoading={isSubmitting}>
              Submit Complaint
            </Button>
          </>
        }
      >
        <form onSubmit={handleRaiseComplaint} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-status-open-bg border border-status-open-border flex items-start gap-2 text-status-open-text text-xs">
              <AlertCircle className="w-4 h-4 text-status-open-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Complaint Subject"
            placeholder="Brief summary of the issue"
            value={complaintFormData.title}
            onChange={(e) => setComplaintFormData({ ...complaintFormData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Issue Category"
              value={complaintFormData.category}
              onChange={(e) => setComplaintFormData({ ...complaintFormData, category: e.target.value })}
            >
              <option value="Technical Support">Technical Support</option>
              <option value="Billing & Subscriptions">Billing & Subscriptions</option>
              <option value="API & Infrastructure">API & Infrastructure</option>
              <option value="Security & Compliance">Security & Compliance</option>
              <option value="Feature Request">Feature Request</option>
            </Select>

            <Select
              label="Priority Level"
              value={complaintFormData.priority}
              onChange={(e) => setComplaintFormData({ ...complaintFormData, priority: e.target.value as ComplaintPriority })}
            >
              <option value="Low">Low (Blue)</option>
              <option value="Medium">Medium (Yellow)</option>
              <option value="High">High (Orange)</option>
              <option value="Critical">Critical (Red)</option>
            </Select>
          </div>

          <Textarea
            label="Detailed Description"
            placeholder="Please include full details, error messages, and reproduction steps..."
            rows={4}
            value={complaintFormData.description}
            onChange={(e) => setComplaintFormData({ ...complaintFormData, description: e.target.value })}
            required
          />
        </form>
      </Modal>

      {/* Edit Complaint Modal */}
      <Modal
        isOpen={isEditComplaintModalOpen}
        onClose={() => setIsEditComplaintModalOpen(false)}
        title="Edit Complaint Details"
        description="You can update details while the complaint is in Open status prior to assignment."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditComplaintModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditComplaint} isLoading={isSubmitting}>
              Save Updates
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditComplaint} className="space-y-4">
          <Input
            label="Subject"
            value={editComplaintFormData.title}
            onChange={(e) => setEditComplaintFormData({ ...editComplaintFormData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={editComplaintFormData.category}
              onChange={(e) => setEditComplaintFormData({ ...editComplaintFormData, category: e.target.value })}
            >
              <option value="Technical Support">Technical Support</option>
              <option value="Billing & Subscriptions">Billing & Subscriptions</option>
              <option value="API & Infrastructure">API & Infrastructure</option>
              <option value="Security & Compliance">Security & Compliance</option>
            </Select>

            <Select
              label="Priority"
              value={editComplaintFormData.priority}
              onChange={(e) => setEditComplaintFormData({ ...editComplaintFormData, priority: e.target.value as ComplaintPriority })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </Select>
          </div>

          <Textarea
            label="Description"
            rows={3}
            value={editComplaintFormData.description}
            onChange={(e) => setEditComplaintFormData({ ...editComplaintFormData, description: e.target.value })}
            required
          />
        </form>
      </Modal>

      {/* QR Code Live Tracking Modal */}
      <QRCodeModal
        isOpen={activeQrModal.isOpen}
        onClose={() => setActiveQrModal((prev) => ({ ...prev, isOpen: false }))}
        itemType={activeQrModal.itemType}
        itemId={activeQrModal.itemId}
        itemTitle={activeQrModal.title}
        qrCodeDataUrl={activeQrModal.qrCode}
      />

      {/* CSAT Customer Satisfaction Rating Modal */}
      <RatingModal
        isOpen={activeRatingModal.isOpen}
        onClose={() => setActiveRatingModal((prev) => ({ ...prev, isOpen: false }))}
        itemType={activeRatingModal.itemType}
        itemId={activeRatingModal.itemId}
        itemTitle={activeRatingModal.title}
        onRatingSubmitted={(rating) => {
          setMyRatingsMap((prev) => ({ ...prev, [rating.itemId]: rating.rating }));
          fetchTickets();
          fetchComplaints();
        }}
      />

      {/* Documents & Evidence Attachment Modal */}
      <Modal
        isOpen={activeAttachmentModal.isOpen}
        onClose={() => setActiveAttachmentModal((prev) => ({ ...prev, isOpen: false }))}
        title={`Documents & Evidence — ${activeAttachmentModal.title}`}
        size="lg"
      >
        <AttachmentSection
          itemType={activeAttachmentModal.itemType}
          itemId={activeAttachmentModal.itemId}
          canUpload={true}
          canDelete={true}
        />
      </Modal>
    </SidebarLayout>
  );
}
