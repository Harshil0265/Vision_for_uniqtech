/**
 * Professional HTML Email Templates for Vision Project Management
 * 
 * This module provides HTML email template builders that follow email best practices:
 * - Table-based layout for email client compatibility (Outlook, Gmail, Apple Mail)
 * - Inline CSS only (no external stylesheets)
 * - Responsive design with max-width 600px
 * - Proper fallback links for CTA buttons
 * - Professional styling with brand colors
 * 
 * All templates follow a consistent structure:
 * 1. Header with brand identity
 * 2. Greeting and message body
 * 3. Information card with key details
 * 4. Call-to-action button with fallback link
 * 5. Professional footer with disclaimer
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface InvitationEmailParams {
  to: string;
  recipientName?: string;
  projectName: string;
  inviterName: string;
  inviteLink: string;
  isNewUser: boolean;
}

export interface TaskAssignmentEmailParams {
  to: string;
  taskKey: string;
  taskTitle: string;
  taskUrl: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectName: string;
  assignedBy: {
    name: string;
    email: string;
  };
  assigneeName: string;
}

export interface MentionEmailParams {
  to: string;
  issueKey: string;
  issueTitle: string;
  issueUrl: string;
  commentSnippet: string;
  authorName: string;
  projectName: string;
  mentionedUserName: string;
}

export interface TaskReminderEmailParams {
  to: string;
  taskKey: string;
  taskTitle: string;
  taskUrl: string;
  dueDate: string;
  status: string;
  priority: string;
  projectName: string;
  assigneeName: string;
}

export interface SprintCompletionEmailParams {
  to: string;
  sprintName: string;
  projectName: string;
  completionDate: string;
  completedPoints: number;
  totalPoints: number;
  reportUrl: string;
  recipientName: string;
}

// ============================================================================
// Shared Utility Functions
// ============================================================================

/**
 * Build the email header with brand identity
 */
function buildEmailHeader(): string {
  return `
    <tr>
      <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
          Vision
        </h1>
        <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 14px; font-weight: 500;">
          Project Management
        </p>
      </td>
    </tr>
  `;
}

/**
 * Build the email footer with disclaimer
 */
function buildEmailFooter(): string {
  return `
    <tr>
      <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
          This email was sent by Vision Project Management
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
          You received this email because you are a member of a project workspace.
        </p>
      </td>
    </tr>
  `;
}

/**
 * Build a CTA button with fallback link
 */
function buildButton(text: string, url: string, color: string = '#3b82f6'): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 8px; background-color: ${color}; text-align: center;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">
      Or copy and paste this link: <a href="${url}" style="color: #3b82f6; text-decoration: none;">${url}</a>
    </p>
  `;
}

/**
 * Build an information card with key-value pairs
 */
function buildInfoCard(items: Array<{ label: string; value: string; highlight?: boolean }>): string {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6;">
            <span style="color: #6b7280; font-size: 13px; font-weight: 500;">${item.label}</span>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; text-align: right;">
            <span style="color: ${item.highlight ? '#3b82f6' : '#111827'}; font-size: 14px; font-weight: ${item.highlight ? '600' : '500'};">${item.value}</span>
          </td>
        </tr>
      `
    )
    .join('');

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 100%; margin: 24px 0; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      ${rows}
    </table>
  `;
}

/**
 * Get priority badge color
 */
function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    blocker: '#dc2626',
    high: '#ea580c',
    medium: '#f59e0b',
    low: '#3b82f6',
    lowest: '#6b7280',
  };
  return colors[priority.toLowerCase()] || '#6b7280';
}

/**
 * Base HTML structure wrapper for all email templates
 */
function wrapEmailContent(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Vision Project Management</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse:collapse;border-spacing:0;margin:0;}
    div, td {padding:0;}
    div {margin:0 !important;}
  </style>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: collapse;
      border-spacing: 0;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      display: block;
      outline: none;
      text-decoration: none;
    }
    a {
      text-decoration: none;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Main Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// Template Builder Functions
// ============================================================================

/**
 * Build project invitation email
 * 
 * Used when a user is invited to join a project workspace.
 * 
 * @param params - Invitation email parameters
 * @returns Complete HTML email string
 */
export function buildInvitationEmail(params: InvitationEmailParams): string {
  const greeting = params.recipientName ? `Hi ${params.recipientName},` : 'Hello,';
  const newUserNote = params.isNewUser
    ? `
      <div style="margin: 24px 0; padding: 16px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
          <strong>New to Vision?</strong> You'll need to create an account first, then visit the link above to accept the invitation.
        </p>
      </div>
    `
    : '';

  const content = `
    ${buildEmailHeader()}
    <tr>
      <td style="padding: 40px 32px;">
        <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.5;">
          ${greeting}
        </p>
        <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          <strong>${params.inviterName}</strong> has invited you to join <strong>${params.projectName}</strong> on Vision Project Management.
        </p>
        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
          Accept the invitation to start collaborating with your team on tasks, sprints, and project deliverables.
        </p>
        ${buildInfoCard([
          { label: 'Project', value: params.projectName, highlight: true },
          { label: 'Invited by', value: params.inviterName },
        ])}
        ${buildButton('Accept Invitation', params.inviteLink)}
        ${newUserNote}
      </td>
    </tr>
    ${buildEmailFooter()}
  `;

  return wrapEmailContent(content);
}

/**
 * Build task assignment email
 * 
 * Sent when a task/issue is assigned to a user.
 * 
 * @param params - Task assignment email parameters
 * @returns Complete HTML email string
 */
export function buildTaskAssignmentEmail(params: TaskAssignmentEmailParams): string {
  const priorityColor = getPriorityColor(params.priority);
  const dueDateInfo = params.dueDate
    ? [{ label: 'Due Date', value: params.dueDate }]
    : [];

  const content = `
    ${buildEmailHeader()}
    <tr>
      <td style="padding: 40px 32px;">
        <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.5;">
          Hi ${params.assigneeName},
        </p>
        <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          You've been assigned to <strong>${params.taskKey}</strong> by <strong>${params.assignedBy.name}</strong>.
        </p>
        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
          ${params.taskTitle}
        </p>
        ${buildInfoCard([
          { label: 'Task', value: params.taskKey, highlight: true },
          { label: 'Project', value: params.projectName },
          { label: 'Status', value: params.status },
          {
            label: 'Priority',
            value: `<span style="color: ${priorityColor}; font-weight: 600;">${params.priority}</span>`,
          },
          ...dueDateInfo,
          { label: 'Assigned by', value: params.assignedBy.name },
        ])}
        ${buildButton('Open Task', params.taskUrl)}
      </td>
    </tr>
    ${buildEmailFooter()}
  `;

  return wrapEmailContent(content);
}

/**
 * Build mention notification email
 * 
 * Sent when a user is mentioned in a comment.
 * 
 * @param params - Mention email parameters
 * @returns Complete HTML email string
 */
export function buildMentionEmail(params: MentionEmailParams): string {
  const commentPreview = params.commentSnippet.length > 200
    ? params.commentSnippet.substring(0, 197) + '...'
    : params.commentSnippet;

  const content = `
    ${buildEmailHeader()}
    <tr>
      <td style="padding: 40px 32px;">
        <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.5;">
          Hi ${params.mentionedUserName},
        </p>
        <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          <strong>${params.authorName}</strong> mentioned you in a comment on <strong>${params.issueKey}</strong>.
        </p>
        ${buildInfoCard([
          { label: 'Issue', value: `${params.issueKey}: ${params.issueTitle}`, highlight: true },
          { label: 'Project', value: params.projectName },
          { label: 'Author', value: params.authorName },
        ])}
        <div style="margin: 24px 0; padding: 16px; background-color: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
          <p style="margin: 0; color: #111827; font-size: 14px; line-height: 1.6; font-style: italic;">
            "${commentPreview}"
          </p>
        </div>
        ${buildButton('View Comment', params.issueUrl)}
      </td>
    </tr>
    ${buildEmailFooter()}
  `;

  return wrapEmailContent(content);
}

/**
 * Build task reminder email
 * 
 * Sent to remind users about upcoming due dates.
 * This will be triggered by scheduled job infrastructure (future implementation).
 * 
 * @param params - Task reminder email parameters
 * @returns Complete HTML email string
 */
export function buildTaskReminderEmail(params: TaskReminderEmailParams): string {
  const priorityColor = getPriorityColor(params.priority);

  const content = `
    ${buildEmailHeader()}
    <tr>
      <td style="padding: 40px 32px;">
        <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.5;">
          Hi ${params.assigneeName},
        </p>
        <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          This is a reminder that <strong>${params.taskKey}</strong> is due soon.
        </p>
        <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
          ${params.taskTitle}
        </p>
        ${buildInfoCard([
          { label: 'Task', value: params.taskKey, highlight: true },
          { label: 'Project', value: params.projectName },
          { label: 'Due Date', value: params.dueDate },
          { label: 'Status', value: params.status },
          {
            label: 'Priority',
            value: `<span style="color: ${priorityColor}; font-weight: 600;">${params.priority}</span>`,
          },
        ])}
        <div style="margin: 24px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
            <strong>⏰ Action Required:</strong> Please review this task and update its status if needed.
          </p>
        </div>
        ${buildButton('View Task', params.taskUrl)}
      </td>
    </tr>
    ${buildEmailFooter()}
  `;

  return wrapEmailContent(content);
}

/**
 * Build sprint completion email
 * 
 * Sent when a sprint is marked as completed.
 * This will be triggered when sprint status changes to 'completed' (future implementation).
 * 
 * @param params - Sprint completion email parameters
 * @returns Complete HTML email string
 */
export function buildSprintCompletionEmail(params: SprintCompletionEmailParams): string {
  const completionPercentage = params.totalPoints > 0
    ? Math.round((params.completedPoints / params.totalPoints) * 100)
    : 0;
  const isFullCompletion = completionPercentage === 100;
  const completionColor = isFullCompletion ? '#10b981' : '#3b82f6';

  const content = `
    ${buildEmailHeader()}
    <tr>
      <td style="padding: 40px 32px;">
        <p style="margin: 0 0 24px 0; color: #111827; font-size: 16px; line-height: 1.5;">
          Hi ${params.recipientName},
        </p>
        <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.6;">
          Great work! The sprint <strong>${params.sprintName}</strong> has been completed.
        </p>
        ${buildInfoCard([
          { label: 'Sprint', value: params.sprintName, highlight: true },
          { label: 'Project', value: params.projectName },
          { label: 'Completed', value: params.completionDate },
          {
            label: 'Points Completed',
            value: `<span style="color: ${completionColor}; font-weight: 600;">${params.completedPoints} / ${params.totalPoints}</span>`,
          },
          {
            label: 'Completion Rate',
            value: `<span style="color: ${completionColor}; font-weight: 600;">${completionPercentage}%</span>`,
          },
        ])}
        <div style="margin: 24px 0; padding: 16px; background-color: ${isFullCompletion ? '#d1fae5' : '#eff6ff'}; border-left: 4px solid ${completionColor}; border-radius: 4px;">
          <p style="margin: 0; color: ${isFullCompletion ? '#065f46' : '#1e40af'}; font-size: 14px; line-height: 1.5;">
            ${
              isFullCompletion
                ? '<strong>🎉 Perfect Sprint!</strong> All planned story points have been completed.'
                : '<strong>📊 Sprint Complete:</strong> Review the sprint report for detailed insights and retrospective notes.'
            }
          </p>
        </div>
        ${buildButton('View Sprint Report', params.reportUrl, completionColor)}
      </td>
    </tr>
    ${buildEmailFooter()}
  `;

  return wrapEmailContent(content);
}
