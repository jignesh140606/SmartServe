import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#6B7280"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * 72 - 36, "SmartServe — Cloud Service Desk & Incident Management Platform")
            self.drawRightString(8.5 * 72 - 54, 11 * 72 - 36, "System User Guide & Architectural Manual")
            self.setStrokeColor(colors.HexColor("#E5E7EB"))
            self.setLineWidth(0.75)
            self.line(54, 11 * 72 - 42, 8.5 * 72 - 54, 11 * 72 - 42)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.75)
        self.line(54, 45, 8.5 * 72 - 54, 45)
        
        self.drawString(54, 32, "Confidential — For Internal & Operational Use Only")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * 72 - 54, 32, page_str)
        self.restoreState()

def build_pdf(filename="User_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY = colors.HexColor("#0284C7")      # Sky / Primary
    PRIMARY_DARK = colors.HexColor("#0369A1")
    NEUTRAL_DARK = colors.HexColor("#0F172A") # Slate 900
    NEUTRAL_BODY = colors.HexColor("#334155") # Slate 700
    NEUTRAL_MUTED = colors.HexColor("#64748B")# Slate 500
    BG_LIGHT = colors.HexColor("#F8FAFC")     # Slate 50
    BORDER_COLOR = colors.HexColor("#E2E8F0") # Slate 200
    ACCENT_WARN = colors.HexColor("#D97706")
    ACCENT_DANGER = colors.HexColor("#DC2626")
    ACCENT_SUCCESS = colors.HexColor("#16A34A")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY_DARK,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=NEUTRAL_MUTED,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=NEUTRAL_DARK,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=PRIMARY_DARK,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=NEUTRAL_BODY,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=PRIMARY_DARK
    )

    story = []

    # ==================== COVER / HEADER ====================
    story.append(Paragraph("SmartServe Platform User Guide", title_style))
    story.append(Paragraph("A Comprehensive Architectural, Business & Operational Manual", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceAfter=14))

    # Meta Overview Box
    meta_data = [
        [
            Paragraph("<b>Version:</b> 1.0.0 (Production)", body_style),
            Paragraph("<b>Platform:</b> React 19 + Express + MongoDB Atlas", body_style),
            Paragraph("<b>Target Audience:</b> Admins, Agents, Customers", body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[165, 185, 154])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('PADDING', (0, 0), (-1, -1), 7),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # ==================== 1. WHAT IS SMARTSERVE ABOUT? ====================
    story.append(Paragraph("1. Executive Summary: What is SmartServe?", h1_style))
    story.append(Paragraph(
        "<b>SmartServe</b> is a multi-tier, enterprise-grade cloud service desk and incident lifecycle management system. "
        "Modern businesses often struggle with fragmented customer support channels—handling support queries across messy email chains, "
        "unstructured chat messages, and spreadsheets. This chaos causes missed SLAs, duplicate work, lost customer grievances, and zero accountability.",
        body_style
    ))
    story.append(Paragraph(
        "SmartServe solves this problem by delivering a single, unified digital workspace that automates the end-to-end incident pipeline: "
        "from initial customer request submission, to intelligent administrator triage and engineer assignment, through active technical resolution and final customer sign-off. "
        "Strict <b>Role-Based Access Control (RBAC)</b> guarantees complete data segregation, compliance, and enterprise security.",
        body_style
    ))
    story.append(Spacer(1, 8))

    # ==================== 2. REAL-LIFE USE CASES ====================
    story.append(Paragraph("2. Real-Life Scenarios: Where is SmartServe Helpful?", h1_style))
    
    scenarios = [
        ("A. B2B Enterprise SaaS Platforms (Fintech, Cloud, CRM, DevOps Tools)",
         "Enterprise customers paying thousands per month require guaranteed SLAs for technical issues, SSO/SAML configuration, and API bug escalations. "
         "SmartServe enables enterprise clients to log high-priority tickets, provides real-time status visibility, and ensures support leads assign senior engineers immediately."),
        
        ("B. IT Service Management (ITSM) & Internal Corporate Helpdesks",
         "Large organizations with hundreds of employees can deploy SmartServe as their internal IT desk. Employees submit hardware requests, software license provisioning, and VPN issues. "
         "IT Admins triage tickets to specialized network or hardware engineers without cross-department clutter."),
        
        ("C. Telecommunications, ISPs & Infrastructure Providers",
         "When customers encounter network downtime or billing disputes, SmartServe separates routine general inquiries from urgent formal complaints. "
         "Critical severity complaints are flagged with high-visibility alerts, guaranteeing quick escalation and regulatory compliance."),
        
        ("D. Managed Service Providers (MSPs) & Logistics Organizations",
         "MSPs manage support across multiple client accounts simultaneously. SmartServe's triage feeds and customer directories allow support teams to monitor incoming queue health and resolve incidents under tight contractual deadlines.")
    ]

    for title, desc in scenarios:
        story.append(Paragraph(f"<b>{title}</b>", h2_style))
        story.append(Paragraph(desc, body_style))

    story.append(Spacer(1, 8))

    # ==================== 3. FEATURE-BY-FEATURE BREAKDOWN ====================
    story.append(Paragraph("3. Feature-by-Feature Breakdown: Why & How It Works", h1_style))
    story.append(Paragraph(
        "Every feature in SmartServe was built with a specific operational purpose to eliminate bottlenecks in support workflows:",
        body_style
    ))

    features = [
        ("1. Role-Based Access Control (RBAC) & Secure JWT Auth",
         "<b>Why we implemented it:</b> Data privacy and operational security. Customers must never see other customers' confidential technical tickets, and agents should only see work assigned to their desk.<br/>"
         "<b>How it works:</b> Passwords are encrypted with bcrypt. On login, the server issues a signed JSON Web Token (JWT) with user ID and role claims. Express middleware guards (<code>authMiddleware</code>, <code>roleMiddleware</code>) inspect every HTTP request. Frontend <code>ProtectedRoute</code> guards dynamically route users to their dedicated dashboard."),

        ("2. Dual Lifecycle Architecture: Tickets vs. Formal Complaints",
         "<b>Why we implemented it:</b> In real operations, routine inquiries (e.g., 'How do I add a team member?') have very different escalation paths than formal grievances (e.g., 'SLA violation: 2-hour billing outage').<br/>"
         "<b>How it works:</b> Separate Mongoose data models and Express routes manage Tickets and Complaints. Both support 4 priority tiers (Low, Medium, High, Critical) and 4 status stages (Open, In Progress, Resolved, Closed)."),

        ("3. Unassigned Items Triage Feed with Auto-Advancement",
         "<b>Why we implemented it:</b> To prevent requests from falling through the cracks ('Inbox Zero' principle).<br/>"
         "<b>How it works:</b> The Admin Triage view filters all tickets and complaints where <code>assignedTo == null</code>, sorted automatically by priority weight (Critical first) and recency. When the Admin selects an engineer from the inline dropdown, the server assigns the engineer and automatically advances the status from 'Open' to 'In Progress' in a single transaction."),

        ("4. Customer Edit-Lock Mechanism",
         "<b>Why we implemented it:</b> To eliminate race conditions and moving targets while an engineer is actively debugging or resolving an issue.<br/>"
         "<b>How it works:</b> Controller logic checks the item state before allowing customer updates. If an item is already assigned or moved past 'Open', the server rejects the edit with <code>400 Bad Request</code> ('Modification prohibited: Item has already been assigned'). In the UI, the Edit button is automatically replaced with a 'Locked' status indicator."),

        ("5. Support Specialist Unified 'My Work' Workspace",
         "<b>Why we implemented it:</b> Context switching between separate ticket and complaint tabs causes agent fatigue and missed deadlines.<br/>"
         "<b>How it works:</b> Aggregates all assigned items into one unified queue, sortable by priority weight or recency. Support engineers can update status directly from each row (Open &rarr; In Progress &rarr; Resolved &rarr; Closed)."),

        ("6. Executive Stat Cards & Scannable Dashboard Overviews",
         "<b>Why we implemented it:</b> Department leads need immediate situational awareness in under 3 seconds.<br/>"
         "<b>How it works:</b> Live aggregation pipelines compute metrics (Total Complaints, Total Tickets, Open Action Items, Resolved Items, Staff Count, Customer Count) rendered in clean light-theme cards with color-coded status badges."),

        ("7. Relative Activity Timestamps (Powered by date-fns)",
         "<b>Why we implemented it:</b> Static dates (e.g., '2026-08-19 14:22') require mental calculations to assess urgency. Relative times (e.g., 'Updated 5 minutes ago') instantly highlight stagnant tickets.<br/>"
         "<b>How it works:</b> A shared <code>dateUtils.ts</code> module leverages <code>formatDistanceToNow</code> across all activity streams, tables, and triage feeds."),

        ("8. Centralized Staff & Customer Directory Management",
         "<b>Why we implemented it:</b> Rapid employee onboarding and instant deactivation upon staff offboarding to protect company assets.<br/>"
         "<b>How it works:</b> Admin-only controllers allow creating new staff accounts, editing designations, and toggling active status with immediate effect."),

        ("9. Global Resilience: React Error Boundary & 404 Routing",
         "<b>Why we implemented it:</b> Production reliability. Unhandled runtime errors should never result in blank white screens.<br/>"
         "<b>How it works:</b> A class-based <code>ErrorBoundary</code> catches JavaScript exceptions and displays a recovery card with 'Reload Page' and 'Return Home' options. A custom <code>NotFoundPage</code> handles invalid URL paths gracefully.")
    ]

    for title, desc in features:
        story.append(Paragraph(title, h2_style))
        story.append(Paragraph(desc, body_style))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 8))

    # ==================== 4. STEP-BY-STEP USER ROLES GUIDE ====================
    story.append(Paragraph("4. Step-by-Step Role Operations Guide", h1_style))

    # Role Table
    role_guide_data = [
        [
            Paragraph("<b>User Role</b>", body_style),
            Paragraph("<b>Core Workflow & Capabilities</b>", body_style),
            Paragraph("<b>Default Landing Path</b>", body_style)
        ],
        [
            Paragraph("<b>Administrator</b>", body_style),
            Paragraph("1. Monitor executive 6-card health dashboard.<br/>"
                      "2. Open 'Unassigned Triage' to assign incoming high-priority items to engineers.<br/>"
                      "3. Manage staff in 'Staff Management' (create, edit, activate/deactivate).<br/>"
                      "4. Review customer profiles in 'Customer Directory'.", body_style),
            Paragraph("<code>/admin</code>", body_style)
        ],
        [
            Paragraph("<b>Support Specialist (Employee)</b>", body_style),
            Paragraph("1. Review personal 4-card metric overview.<br/>"
                      "2. Action items in 'Urgent Action Queue' (Critical & High priority).<br/>"
                      "3. Work through 'My Work' combined queue.<br/>"
                      "4. Update status to 'In Progress' & 'Resolved' as tasks are completed.", body_style),
            Paragraph("<code>/employee</code>", body_style)
        ],
        [
            Paragraph("<b>Customer Account</b>", body_style),
            Paragraph("1. Self-register via <code>/signup</code> and log in.<br/>"
                      "2. Click 'Create Service Ticket' for technical/general inquiries.<br/>"
                      "3. Click 'Raise Formal Complaint' for urgent escalations.<br/>"
                      "4. Edit details while open; track assigned engineer and resolution time.", body_style),
            Paragraph("<code>/customer</code>", body_style)
        ]
    ]

    role_table = Table(role_guide_data, colWidths=[110, 290, 104])
    role_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(role_table)
    story.append(Spacer(1, 14))

    # ==================== 5. DEMO SEED CREDENTIALS ====================
    story.append(Paragraph("5. Demo Credentials Reference", h1_style))

    cred_data = [
        [
            Paragraph("<b>Role</b>", body_style),
            Paragraph("<b>Email</b>", body_style),
            Paragraph("<b>Password</b>", body_style),
            Paragraph("<b>Assigned Workspace</b>", body_style)
        ],
        [
            Paragraph("Administrator", body_style),
            Paragraph("<code>admin@smartserve.io</code>", body_style),
            Paragraph("<code>SecurePassword123!</code>", body_style),
            Paragraph("Executive Control Center", body_style)
        ],
        [
            Paragraph("Support Specialist", body_style),
            Paragraph("<code>sarah.support@smartserve.io</code>", body_style),
            Paragraph("<code>AgentSecurePassword123!</code>", body_style),
            Paragraph("Specialist Work Desk", body_style)
        ],
        [
            Paragraph("Customer Account", body_style),
            Paragraph("<code>john.customer@example.com</code>", body_style),
            Paragraph("<code>CustomerPass123!</code>", body_style),
            Paragraph("Client Support Portal", body_style)
        ]
    ]

    cred_table = Table(cred_data, colWidths=[110, 160, 130, 104])
    cred_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NEUTRAL_DARK),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(cred_table)
    story.append(Spacer(1, 14))

    # ==================== 6. CONCLUSION & SUMMARY ====================
    story.append(Paragraph("6. Architectural Summary", h1_style))
    story.append(Paragraph(
        "SmartServe delivers a modern, robust, and intuitive service desk experience. "
        "By enforcing strict RBAC on the server, providing intuitive light-theme triage interfaces, "
        "and automating routine operational transitions, SmartServe reduces support resolution times, "
        "prevents missed SLAs, and elevates customer satisfaction across the organization.",
        body_style
    ))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"User Guide successfully generated at: {filename}")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(os.path.abspath(__file__)), "User_Guide.pdf")
    build_pdf(target)
