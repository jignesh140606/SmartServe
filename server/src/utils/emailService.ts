import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create a reusable Nodemailer transporter.
 * Falls back to Ethereal (test) account if SMTP credentials not configured.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback: log emails to console (no actual sending)
  console.log('[Email] SMTP not configured. Emails will be logged to console only.');
  return null;
}

const transporter = createTransporter();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using the configured transporter.
 * If transporter is null, logs to console instead.
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  const from = process.env.SMTP_FROM || 'SmartServe <noreply@smartserve.io>';

  try {
    if (transporter) {
      await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[Email] Sent: "${options.subject}" → ${options.to}`);
    } else {
      console.log(`[Email Console] To: ${options.to} | Subject: ${options.subject}`);
    }
    return true;
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${options.to}:`, (error as Error).message);
    return false;
  }
}

/**
 * Build a styled HTML email wrapper.
 */
function emailWrapper(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px 32px;">
      <h1 style="color:#fff;font-size:20px;margin:0;letter-spacing:-0.3px;">⚡ SmartServe</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:12px;margin:4px 0 0 0;">${title}</p>
    </div>
    <div style="padding:32px;">
      ${body}
    </div>
    <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">SmartServe Cloud Service Desk Platform &copy; 2026</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send ticket/complaint creation email with QR code.
 */
export async function sendCreationEmail(
  customerEmail: string,
  customerName: string,
  itemType: 'Ticket' | 'Complaint',
  itemData: {
    _id: string;
    title: string;
    category: string;
    priority: string;
    slaDeadline?: string;
  },
  qrCodeBase64?: string
): Promise<boolean> {
  const trackUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/track/${itemType.toLowerCase()}/${itemData._id}`;
  const slaText = itemData.slaDeadline
    ? new Date(itemData.slaDeadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'N/A';

  const priorityColor: Record<string, string> = {
    Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#2563eb',
  };

  const body = `
    <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px 0;">Hello ${customerName},</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
      Your <strong>${itemType.toLowerCase()}</strong> has been successfully submitted and is now being tracked in our system.
    </p>
    
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reference ID</td>
          <td style="padding:6px 0;color:#1e293b;font-size:13px;font-weight:700;font-family:monospace;">${itemType.substring(0, 3).toUpperCase()}-${itemData._id.substring(itemData._id.length - 8).toUpperCase()}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Title</td>
          <td style="padding:6px 0;color:#1e293b;font-size:13px;">${itemData.title}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Category</td>
          <td style="padding:6px 0;color:#1e293b;font-size:13px;">${itemData.category}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Priority</td>
          <td style="padding:6px 0;">
            <span style="display:inline-block;background:${priorityColor[itemData.priority] || '#64748b'};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;">${itemData.priority}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">SLA Deadline</td>
          <td style="padding:6px 0;color:#1e293b;font-size:13px;">⏰ ${slaText}</td>
        </tr>
      </table>
    </div>

    ${qrCodeBase64 ? `
    <div style="text-align:center;margin:0 0 24px 0;">
      <p style="color:#475569;font-size:13px;margin:0 0 12px 0;">📱 <strong>Scan this QR code</strong> to track your ${itemType.toLowerCase()} status anytime:</p>
      <img src="${qrCodeBase64}" alt="QR Code" style="width:180px;height:180px;border:2px solid #e2e8f0;border-radius:12px;padding:8px;background:#fff;" />
    </div>
    ` : ''}

    <div style="text-align:center;margin:24px 0 0 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-size:13px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">Track ${itemType} Status →</a>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `[SmartServe] ${itemType} Received — ${itemData.title}`,
    html: emailWrapper(`${itemType} Confirmation`, body),
  });
}

/**
 * Send assignment notification email.
 */
export async function sendAssignmentEmail(
  customerEmail: string,
  customerName: string,
  itemType: 'Ticket' | 'Complaint',
  itemTitle: string,
  employeeName: string,
  slaDeadline?: string
): Promise<boolean> {
  const slaText = slaDeadline
    ? new Date(slaDeadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'N/A';

  const body = `
    <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px 0;">Hello ${customerName},</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      Your ${itemType.toLowerCase()} <strong>"${itemTitle}"</strong> has been assigned to a support specialist and is now actively being worked on.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:20px 0;">
      <p style="color:#166534;font-size:14px;margin:0;">
        👤 <strong>Assigned To:</strong> ${employeeName}<br/>
        ⏰ <strong>Expected Resolution By:</strong> ${slaText}
      </p>
    </div>
    <p style="color:#475569;font-size:13px;">We'll notify you as soon as there's an update on your ${itemType.toLowerCase()}.</p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `[SmartServe] ${itemType} Assigned — ${itemTitle}`,
    html: emailWrapper(`${itemType} Assignment Update`, body),
  });
}

/**
 * Send status update email.
 */
export async function sendStatusUpdateEmail(
  customerEmail: string,
  customerName: string,
  itemType: 'Ticket' | 'Complaint',
  itemTitle: string,
  newStatus: string
): Promise<boolean> {
  const statusColor: Record<string, string> = {
    Open: '#dc2626', 'In Progress': '#ca8a04', Resolved: '#16a34a', Closed: '#64748b',
  };

  const body = `
    <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px 0;">Hello ${customerName},</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;">
      The status of your ${itemType.toLowerCase()} <strong>"${itemTitle}"</strong> has been updated:
    </p>
    <div style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;background:${statusColor[newStatus] || '#64748b'};color:#fff;font-size:16px;font-weight:700;padding:10px 28px;border-radius:10px;">${newStatus}</span>
    </div>
    ${newStatus === 'Resolved' || newStatus === 'Closed' ? `
    <p style="color:#475569;font-size:13px;text-align:center;">
      ⭐ We'd love to hear your feedback! Please rate your experience from your dashboard.
    </p>
    ` : ''}
  `;

  return sendEmail({
    to: customerEmail,
    subject: `[SmartServe] ${itemType} Status: ${newStatus} — ${itemTitle}`,
    html: emailWrapper(`${itemType} Status Update`, body),
  });
}
