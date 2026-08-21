import { formatDistanceToNow } from 'date-fns';

/**
 * Formats a date or ISO string into a relative time distance string.
 * e.g., "5 minutes ago", "about 2 hours ago"
 */
export function formatTimeAgo(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Recently';

  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return 'Recently';

    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Recently';
  }
}

/**
 * Returns numeric sorting weight for priorities (higher = more urgent).
 */
export function getPriorityWeight(priority?: string): number {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}
