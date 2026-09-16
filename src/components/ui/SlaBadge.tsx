import React from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SlaBadgeProps {
  deadline?: string | null;
  status: string;
  className?: string;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({ deadline, status, className = '' }) => {
  if (!deadline) {
    return (
      <span className={`inline-flex items-center text-xs text-gray-400 ${className}`}>
        No SLA
      </span>
    );
  }

  const isCompleted = status === 'Resolved' || status === 'Closed';
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const isBreached = diffMs < 0;

  if (isCompleted) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        title={`SLA target: ${deadlineDate.toLocaleString()}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        SLA Met
      </span>
    );
  }

  if (isBreached) {
    const hoursAgo = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
    const daysAgo = Math.floor(hoursAgo / 24);
    const timeText = daysAgo > 0 ? `${daysAgo}d overdue` : `${hoursAgo}h overdue`;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 animate-pulse ${className}`}
        title={`Breached: ${deadlineDate.toLocaleString()}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
        Breached ({timeText})
      </span>
    );
  }

  // Not breached, calculate remaining time
  const remainingHours = Math.floor(diffMs / (1000 * 60 * 60));
  const remainingDays = Math.floor(remainingHours / 24);
  const isUrgent = remainingHours <= 4;

  let remainingText = '';
  if (remainingDays > 0) {
    remainingText = `${remainingDays}d ${remainingHours % 24}h left`;
  } else if (remainingHours > 0) {
    remainingText = `${remainingHours}h left`;
  } else {
    const remainingMins = Math.floor(diffMs / (1000 * 60));
    remainingText = `${remainingMins}m left`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
        isUrgent
          ? 'bg-amber-50 text-amber-800 border-amber-300'
          : 'bg-blue-50 text-blue-700 border-blue-200'
      } ${className}`}
      title={`Target: ${deadlineDate.toLocaleString()}`}
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-600' : 'text-blue-500'}`} />
      {remainingText}
    </span>
  );
};

export default SlaBadge;
