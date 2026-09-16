/**
 * Pre-defined canned response templates for support specialists.
 * Organized by category with one-click reusable messages.
 */

export interface CannedResponse {
  id: string;
  label: string;
  category: string;
  message: string;
}

export const CANNED_RESPONSES: CannedResponse[] = [
  {
    id: 'ack-general',
    label: 'General Acknowledgement',
    category: 'General',
    message: 'Thank you for reaching out. We have received your request and our team is reviewing it. You will receive updates as we progress.',
  },
  {
    id: 'req-logs',
    label: 'Request Log Files',
    category: 'Technical Support',
    message: 'To help us investigate this issue further, could you please provide the relevant log files or error screenshots? This will help us identify the root cause more efficiently.',
  },
  {
    id: 'req-steps',
    label: 'Request Reproduction Steps',
    category: 'Technical Support',
    message: 'Could you please provide detailed steps to reproduce this issue? Include the browser/device you are using, and any specific actions that trigger the problem.',
  },
  {
    id: 'known-outage',
    label: 'Known Service Outage',
    category: 'Infrastructure',
    message: 'We are aware of the current service disruption and our engineering team is actively working on a resolution. We will provide an update within the next 2 hours. We apologize for the inconvenience.',
  },
  {
    id: 'billing-review',
    label: 'Billing Under Review',
    category: 'Billing Operations',
    message: 'We have forwarded your billing inquiry to our accounts team for review. You should expect a detailed response within 24-48 hours. If the issue is urgent, please contact our billing hotline directly.',
  },
  {
    id: 'escalated',
    label: 'Escalated to Senior Team',
    category: 'General',
    message: 'This issue has been escalated to our senior engineering team for priority handling. You will be notified as soon as we have an update or resolution.',
  },
  {
    id: 'resolution-confirm',
    label: 'Resolution Confirmed',
    category: 'General',
    message: 'The reported issue has been resolved. Please verify on your end and confirm if everything is working as expected. If the problem persists, feel free to reopen this ticket.',
  },
  {
    id: 'feature-noted',
    label: 'Feature Request Noted',
    category: 'Feature Request',
    message: 'Thank you for your feature suggestion! We have added it to our product backlog for evaluation. Our product team reviews all suggestions during sprint planning cycles.',
  },
  {
    id: 'security-patch',
    label: 'Security Patch Applied',
    category: 'Security',
    message: 'A security patch has been deployed to address the reported vulnerability. We recommend clearing your browser cache and logging in again. If you continue to experience issues, please let us know.',
  },
  {
    id: 'closing-inactive',
    label: 'Closing Due to Inactivity',
    category: 'General',
    message: 'This ticket has been inactive for over 7 days. We are closing it as resolved. If you still need assistance, please reopen the ticket or create a new one.',
  },
];

/**
 * Get canned responses filtered by category (optional).
 */
export function getCannedResponses(category?: string): CannedResponse[] {
  if (!category || category === 'all') {
    return CANNED_RESPONSES;
  }
  return CANNED_RESPONSES.filter(
    (r) => r.category.toLowerCase() === category.toLowerCase()
  );
}
