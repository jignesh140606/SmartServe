import React from 'react';
import { cn } from '../../lib/utils';

export type StatusType =
  | 'resolved'
  | 'in-progress'
  | 'inprogress'
  | 'open'
  | 'closed'
  | 'Resolved'
  | 'In Progress'
  | 'Open'
  | 'Closed';

export type PriorityType =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  status?: StatusType;
  priority?: PriorityType;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  className,
  variant,
  status,
  priority,
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  let badgeClasses = 'bg-neutral-100 text-neutral-700 border-neutral-200';
  let dotColor = 'bg-neutral-500';

  if (status) {
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
    switch (normalizedStatus) {
      case 'resolved':
        badgeClasses = 'bg-status-resolved-bg text-status-resolved-text border-status-resolved-border';
        dotColor = 'bg-status-resolved-500';
        break;
      case 'in-progress':
      case 'inprogress':
        badgeClasses = 'bg-status-in-progress-bg text-status-in-progress-text border-status-in-progress-border';
        dotColor = 'bg-status-in-progress-500 animate-pulse';
        break;
      case 'open':
        badgeClasses = 'bg-status-open-bg text-status-open-text border-status-open-border';
        dotColor = 'bg-status-open-500';
        break;
      case 'closed':
        badgeClasses = 'bg-status-closed-bg text-status-closed-text border-status-closed-border';
        dotColor = 'bg-status-closed-500';
        break;
    }
  } else if (priority) {
    const normalizedPriority = priority.toLowerCase();
    switch (normalizedPriority) {
      case 'low':
        badgeClasses = 'bg-priority-low-bg text-priority-low-text border-priority-low-border';
        dotColor = 'bg-priority-low-500';
        break;
      case 'medium':
        badgeClasses = 'bg-priority-medium-bg text-priority-medium-text border-priority-medium-border';
        dotColor = 'bg-priority-medium-500';
        break;
      case 'high':
        badgeClasses = 'bg-priority-high-bg text-priority-high-text border-priority-high-border';
        dotColor = 'bg-priority-high-500';
        break;
      case 'critical':
        badgeClasses = 'bg-priority-critical-bg text-priority-critical-text border-priority-critical-border';
        dotColor = 'bg-priority-critical-500';
        break;
    }
  } else if (variant) {
    switch (variant) {
      case 'primary':
        badgeClasses = 'bg-primary-50 text-primary-700 border-primary-200';
        dotColor = 'bg-primary-600';
        break;
      case 'neutral':
        badgeClasses = 'bg-neutral-100 text-neutral-700 border-neutral-200';
        dotColor = 'bg-neutral-500';
        break;
      case 'success':
        badgeClasses = 'bg-status-resolved-bg text-status-resolved-text border-status-resolved-border';
        dotColor = 'bg-status-resolved-500';
        break;
      case 'warning':
        badgeClasses = 'bg-status-in-progress-bg text-status-in-progress-text border-status-in-progress-border';
        dotColor = 'bg-status-in-progress-500';
        break;
      case 'danger':
        badgeClasses = 'bg-status-open-bg text-status-open-text border-status-open-border';
        dotColor = 'bg-status-open-500';
        break;
      case 'outline':
        badgeClasses = 'bg-white text-neutral-600 border-neutral-300';
        dotColor = 'bg-neutral-400';
        break;
      default:
        badgeClasses = 'bg-neutral-100 text-neutral-700 border-neutral-200';
        dotColor = 'bg-neutral-500';
    }
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-full gap-1.5',
    md: 'text-xs px-2.5 py-1 font-medium rounded-full gap-1.5',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center border select-none transition-colors whitespace-nowrap',
        sizeClasses,
        badgeClasses,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />}
      <span>{children}</span>
    </span>
  );
}
