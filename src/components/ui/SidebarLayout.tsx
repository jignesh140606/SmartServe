import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  TicketCheck,
  Layers,
  Users,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'primary' | 'warning' | 'neutral';
  active?: boolean;
}

export interface SidebarLayoutProps {
  children: React.ReactNode;
  activeNavId?: string;
  onNavSelect?: (id: string) => void;
  onNewTicketClick?: () => void;
  topbarTitle?: string;
  ticketsBadge?: number | string;
  queuesBadge?: number | string;
  navItems?: NavItem[];
}

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
}

export function SidebarLayout({
  children,
  activeNavId = 'tickets',
  onNavSelect,
  onNewTicketClick,
  topbarTitle = 'SmartServe Dashboard',
  ticketsBadge,
  queuesBadge,
  navItems,
}: SidebarLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Sarah Support Lead assigned to TCK-ECDC66',
      time: '10 mins ago',
      type: 'info',
      read: false,
    },
    {
      id: 'n2',
      title: 'Critical Incident: DB Connection Drop flagged for SLA triage',
      time: '35 mins ago',
      type: 'warning',
      read: false,
    },
    {
      id: 'n3',
      title: 'SSO Certificate Renewal Request marked as Resolved',
      time: '1 hour ago',
      type: 'success',
      read: false,
    },
    {
      id: 'n4',
      title: 'Customer account John Customer registered',
      time: '2 hours ago',
      type: 'info',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'SS';

  const userRoleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'employee'
      ? 'Support Specialist'
      : user?.role === 'customer'
      ? 'Customer Account'
      : 'User';

  const defaultNavItems: NavItem[] = navItems || [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'tickets',
      label: user?.role === 'customer' ? 'My Tickets' : user?.role === 'employee' ? 'My Work' : 'Service Tickets',
      icon: <TicketCheck className="w-4 h-4" />,
      badge: ticketsBadge !== undefined ? ticketsBadge : undefined,
      badgeVariant: 'primary',
    },
    {
      id: 'queues',
      label: user?.role === 'admin' ? 'Unassigned Triage' : user?.role === 'customer' ? 'My Complaints' : 'SLA Queues',
      icon: <Layers className="w-4 h-4" />,
      badge: queuesBadge !== undefined ? queuesBadge : undefined,
      badgeVariant: 'warning',
    },
    ...(user?.role === 'admin'
      ? [{ id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> }]
      : []),
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (id: string) => {
    onNavSelect?.(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col lg:flex-row font-sans text-neutral-800">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto shadow-soft-xs',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex flex-col">
          <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shadow-soft-xs font-bold text-sm tracking-wide">
                <Sparkles className="w-4 h-4 text-white fill-white/20" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-neutral-900 tracking-tight leading-none flex items-center gap-1.5">
                  SmartServe
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-100">
                    Pro
                  </span>
                </span>
                <span className="text-[11px] text-neutral-400 font-medium">Service Desk System</span>
              </div>
            </div>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1 text-neutral-400 hover:text-neutral-600 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Main Menu
            </div>
            {defaultNavItems.map((item) => {
              const isActive = activeNavId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold border border-primary-100/80 shadow-soft-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn('transition-colors', isActive ? 'text-primary-600' : 'text-neutral-400')}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        item.badgeVariant === 'primary' && 'bg-primary-100 text-primary-700',
                        item.badgeVariant === 'warning' && 'bg-status-in-progress-bg text-status-in-progress-text border border-status-in-progress-border',
                        (!item.badgeVariant || item.badgeVariant === 'neutral') && 'bg-neutral-100 text-neutral-600'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 m-2 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs border border-primary-200">
                {userInitials}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-status-resolved border-2 border-white" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-neutral-900 truncate">
                {user?.name || 'User Account'}
              </span>
              <span className="text-[11px] text-neutral-500 truncate">{userRoleLabel}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area (Topbar + Content) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-neutral-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-soft-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">
              {topbarTitle}
            </h1>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3 relative">
            {/* Quick search */}
            <div className="relative hidden md:block w-64 lg:w-72">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search tickets, customers..."
                className="w-full bg-neutral-50 hover:bg-white focus:bg-white text-sm text-neutral-900 placeholder:text-neutral-400 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 shadow-soft-xs"
              />
            </div>

            {/* Notification Bell with Dropdown Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-open" />
                )}
              </button>

              {/* Interactive Notifications Popover */}
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-soft-xl border border-neutral-200 z-50 animate-in fade-in overflow-hidden">
                    <div className="p-3.5 px-4 bg-neutral-50/80 border-b border-neutral-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                          Desk Notifications
                        </span>
                        {unreadCount > 0 && (
                          <Badge variant="primary" size="sm">
                            {unreadCount} New
                          </Badge>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-primary-600 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            'p-3 px-4 flex items-start gap-3 hover:bg-neutral-50/70 transition-colors',
                            !item.read && 'bg-primary-50/30'
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            {item.type === 'warning' ? (
                              <div className="w-6 h-6 rounded-md bg-priority-high-bg text-priority-high-text flex items-center justify-center">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                            ) : item.type === 'success' ? (
                              <div className="w-6 h-6 rounded-md bg-status-resolved-bg text-status-resolved-500 flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center">
                                <UserPlus className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 leading-tight">
                              {item.title}
                            </p>
                            <span className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-2.5 text-center bg-neutral-50/50 border-t border-neutral-100">
                      <span className="text-[11px] text-neutral-500 font-medium">
                        Real-time SLA Alert Dispatcher Active
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Help Button with Modal */}
            <button
              onClick={() => setHelpModalOpen(true)}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition-colors hidden sm:inline-flex"
              aria-label="Support Documentation"
              title="Help & SLA Documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="h-5 w-[1px] bg-neutral-200 mx-1 hidden sm:block" />

            <Button
              variant="primary"
              size="sm"
              onClick={onNewTicketClick}
              className="hidden sm:inline-flex"
            >
              + New Ticket
            </Button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Interactive Quick Help & SLA Documentation Modal */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="SmartServe Help & Service Desk Guide"
        description="Quick reference guide for platform operations, SLAs, and support contacts."
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setHelpModalOpen(false)}>
            Close Reference
          </Button>
        }
      >
        <div className="space-y-5 text-sm">
          {/* SLA Response Targets Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary-600" /> Contractual SLA Resolution Targets
            </h4>
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-100 font-semibold text-neutral-700">
                  <tr>
                    <th className="p-2.5">Priority Level</th>
                    <th className="p-2.5">Target Response</th>
                    <th className="p-2.5">Target Resolution</th>
                    <th className="p-2.5">Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr>
                    <td className="p-2.5 font-bold text-priority-critical-text">Critical (P1)</td>
                    <td className="p-2.5">&lt; 15 mins</td>
                    <td className="p-2.5">&lt; 2 hours</td>
                    <td className="p-2.5 text-neutral-500">Total system outages & data loss</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-priority-high-text">High (P2)</td>
                    <td className="p-2.5">&lt; 30 mins</td>
                    <td className="p-2.5">&lt; 4 hours</td>
                    <td className="p-2.5 text-neutral-500">Core feature degradation & auth failures</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-priority-medium-text">Medium (P3)</td>
                    <td className="p-2.5">&lt; 2 hours</td>
                    <td className="p-2.5">&lt; 24 hours</td>
                    <td className="p-2.5 text-neutral-500">Minor bugs with workarounds</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-priority-low-text">Low (P4)</td>
                    <td className="p-2.5">&lt; 8 hours</td>
                    <td className="p-2.5">&lt; 48 hours</td>
                    <td className="p-2.5 text-neutral-500">General inquiries & feature requests</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Shortcuts & Contact Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-primary-50/50 border border-primary-100">
              <p className="font-bold text-primary-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-600" /> Platform Security & RBAC
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Data segregation is enforced server-side. Customers can only view their own items.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
              <p className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500" /> Support Desk Contact
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Emergency escalation email: <strong className="text-neutral-800">support@smartserve.io</strong>
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
