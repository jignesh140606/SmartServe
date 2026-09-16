/**
 * SLA (Service Level Agreement) configuration and utilities.
 * Maps priority levels to resolution window in hours.
 */

export interface SlaConfig {
  priority: string;
  hoursToResolve: number;
  label: string;
}

/**
 * SLA resolution windows per priority level.
 */
export const SLA_CONFIG: Record<string, SlaConfig> = {
  Critical: { priority: 'Critical', hoursToResolve: 4, label: '4 Hours' },
  High: { priority: 'High', hoursToResolve: 12, label: '12 Hours' },
  Medium: { priority: 'Medium', hoursToResolve: 48, label: '48 Hours' },
  Low: { priority: 'Low', hoursToResolve: 168, label: '7 Days' },
};

/**
 * Calculate the SLA deadline based on priority and creation time.
 * @param priority - The priority level (Critical, High, Medium, Low)
 * @param createdAt - The creation date (defaults to now)
 * @returns The SLA deadline as a Date object
 */
export function calculateSlaDeadline(priority: string, createdAt?: Date): Date {
  const config = SLA_CONFIG[priority] || SLA_CONFIG['Medium'];
  const baseTime = createdAt ? new Date(createdAt) : new Date();
  const deadlineMs = baseTime.getTime() + config.hoursToResolve * 60 * 60 * 1000;
  return new Date(deadlineMs);
}

/**
 * Check if an SLA deadline has been breached.
 * @param slaDeadline - The SLA deadline
 * @returns true if the deadline has passed
 */
export function isSlaBreached(slaDeadline: Date | string): boolean {
  const deadline = typeof slaDeadline === 'string' ? new Date(slaDeadline) : slaDeadline;
  return new Date() > deadline;
}

/**
 * Get remaining time until SLA breach in milliseconds.
 * Returns negative value if already breached.
 */
export function getSlaRemainingMs(slaDeadline: Date | string): number {
  const deadline = typeof slaDeadline === 'string' ? new Date(slaDeadline) : slaDeadline;
  return deadline.getTime() - Date.now();
}
