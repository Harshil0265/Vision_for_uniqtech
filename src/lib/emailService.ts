import nodemailer from 'nodemailer';
import {
  buildInvitationEmail,
  buildTaskAssignmentEmail,
  buildMentionEmail,
  buildTaskReminderEmail,
  buildSprintCompletionEmail,
} from './emailTemplates.js';

// ============================================================================
// Email Service Configuration
// ============================================================================

/**
 * Create and configure the nodemailer transporter
 * Returns null if SMTP is not configured
 */
function createTransporter() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });
}

/**
 * Get the email sender information
 */
function getFromAddress(): string {
  const fromName = process.env.SMTP_FROM_NAME || 'Vision Project Management';
  const smtpUser = process.env.SMTP_USER || '';
  return `"${fromName}" <${smtpUser}>`;
}

// ============================================================================
// Email Option Interfaces
// ============================================================================

export interface InvitationEmailOptions {
  to: string;
  recipientName?: string;
  projectName: string;
  inviterName: string;
  role: string;
  inviteLink: string;
  isNewUser: boolean;
}

export interface TaskAssignmentEmailOptions {
  to: string;
  taskKey: string;
  taskTitle: string;
  taskUrl: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectName: string;
  assignedByName: string;
  assignedByEmail: string;
  assigneeName: string;
}

export interface MentionEmailOptions {
  to: string;
  issueKey: string;
  issueTitle: string;
  issueUrl: string;
  commentSnippet: string;
  authorName: string;
  projectName: string;
  mentionedUserName: string;
}

export interface TaskReminderEmailOptions {
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

export interface SprintCompletionEmailOptions {
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
// Email Sending Functions
// ============================================================================

/**
 * Send project invitation email
 * 
 * Sends a professional HTML email inviting a user to join a project workspace.
 * 
 * @param opts - Invitation email options
 * @returns Promise with success status and optional error message
 */
export async function sendInvitationEmail(opts: InvitationEmailOptions): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] SMTP not configured — skipping invitation email');
    return { success: false, error: 'SMTP not configured' };
  }

  const html = buildInvitationEmail({
    to: opts.to,
    recipientName: opts.recipientName,
    projectName: opts.projectName,
    inviterName: opts.inviterName,
    inviteLink: opts.inviteLink,
    isNewUser: opts.isNewUser,
  });

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: opts.to,
      subject: `You have been invited to ${opts.projectName} on Vision`,
      html,
    });
    console.log(`[Email] Invitation sent to ${opts.to}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Email] Failed to send invitation:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send task assignment email
 * 
 * Notifies a user when they are assigned to a task/issue.
 * 
 * @param opts - Task assignment email options
 * @returns Promise with success status and optional error message
 */
export async function sendTaskAssignmentEmail(opts: TaskAssignmentEmailOptions): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] SMTP not configured — skipping task assignment email');
    return { success: false, error: 'SMTP not configured' };
  }

  const html = buildTaskAssignmentEmail({
    to: opts.to,
    taskKey: opts.taskKey,
    taskTitle: opts.taskTitle,
    taskUrl: opts.taskUrl,
    status: opts.status,
    priority: opts.priority,
    dueDate: opts.dueDate,
    projectName: opts.projectName,
    assignedBy: {
      name: opts.assignedByName,
      email: opts.assignedByEmail,
    },
    assigneeName: opts.assigneeName,
  });

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: opts.to,
      subject: `You've been assigned to ${opts.taskKey}`,
      html,
    });
    console.log(`[Email] Task assignment sent to ${opts.to} for ${opts.taskKey}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Email] Failed to send task assignment:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send mention notification email
 * 
 * Notifies a user when they are mentioned in a comment.
 * 
 * @param opts - Mention email options
 * @returns Promise with success status and optional error message
 */
export async function sendMentionNotificationEmail(opts: MentionEmailOptions): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] SMTP not configured — skipping mention notification email');
    return { success: false, error: 'SMTP not configured' };
  }

  const html = buildMentionEmail({
    to: opts.to,
    issueKey: opts.issueKey,
    issueTitle: opts.issueTitle,
    issueUrl: opts.issueUrl,
    commentSnippet: opts.commentSnippet,
    authorName: opts.authorName,
    projectName: opts.projectName,
    mentionedUserName: opts.mentionedUserName,
  });

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: opts.to,
      subject: `${opts.authorName} mentioned you in ${opts.issueKey}`,
      html,
    });
    console.log(`[Email] Mention notification sent to ${opts.to} for ${opts.issueKey}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Email] Failed to send mention notification:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send task reminder email
 * 
 * Reminds a user about an upcoming task due date.
 * This function will be triggered by scheduled job infrastructure (future implementation).
 * 
 * @param opts - Task reminder email options
 * @returns Promise with success status and optional error message
 */
export async function sendTaskReminderEmail(opts: TaskReminderEmailOptions): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] SMTP not configured — skipping task reminder email');
    return { success: false, error: 'SMTP not configured' };
  }

  const html = buildTaskReminderEmail({
    to: opts.to,
    taskKey: opts.taskKey,
    taskTitle: opts.taskTitle,
    taskUrl: opts.taskUrl,
    dueDate: opts.dueDate,
    status: opts.status,
    priority: opts.priority,
    projectName: opts.projectName,
    assigneeName: opts.assigneeName,
  });

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: opts.to,
      subject: `Reminder: ${opts.taskKey} is due soon`,
      html,
    });
    console.log(`[Email] Task reminder sent to ${opts.to} for ${opts.taskKey}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Email] Failed to send task reminder:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send sprint completion email
 * 
 * Notifies team members when a sprint is completed.
 * This function will be triggered when sprint status changes to 'completed' (future implementation).
 * 
 * @param opts - Sprint completion email options
 * @returns Promise with success status and optional error message
 */
export async function sendSprintCompletionEmail(opts: SprintCompletionEmailOptions): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] SMTP not configured — skipping sprint completion email');
    return { success: false, error: 'SMTP not configured' };
  }

  const html = buildSprintCompletionEmail({
    to: opts.to,
    sprintName: opts.sprintName,
    projectName: opts.projectName,
    completionDate: opts.completionDate,
    completedPoints: opts.completedPoints,
    totalPoints: opts.totalPoints,
    reportUrl: opts.reportUrl,
    recipientName: opts.recipientName,
  });

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: opts.to,
      subject: `Sprint Complete: ${opts.sprintName}`,
      html,
    });
    console.log(`[Email] Sprint completion sent to ${opts.to} for ${opts.sprintName}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Email] Failed to send sprint completion:', err.message);
    return { success: false, error: err.message };
  }
}
