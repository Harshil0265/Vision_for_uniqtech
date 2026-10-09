import nodemailer from 'nodemailer';

export interface InvitationEmailOptions {
  to: string;
  projectName: string;
  inviterName: string;
  role: string;
  inviteLink: string;
  isNewUser: boolean;
}

export async function sendInvitationEmail(opts: InvitationEmailOptions): Promise<{ success: boolean; error?: string }> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass) {
    console.warn('[Email] SMTP not configured — skipping email');
    return { success: false, error: 'SMTP not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: smtpUser, pass: smtpPass },
  });

  const fromName = process.env.SMTP_FROM_NAME || 'Vision Project Management';
  const signupNote = opts.isNewUser
    ? '<p style="color:#6b7280;font-size:13px;">New to Vision? You will need to create an account first, then visit the link above to accept.</p>'
    : '';

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#1e40af;">You have been invited to ${opts.projectName}</h2>
      <p>${opts.inviterName} has invited you to join <strong>${opts.projectName}</strong> as a <strong>${opts.role}</strong>.</p>
      <a href="${opts.inviteLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invitation</a>
      ${signupNote}
      <p style="color:#6b7280;font-size:12px;">This invitation was sent by Vision Project Management.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${smtpUser}>`,
      to: opts.to,
      subject: `You have been invited to ${opts.projectName} on Vision`,
      html,
    });
    return { success: true };
  } catch (err: any) {
    console.error('[Email] Failed to send:', err.message);
    return { success: false, error: err.message };
  }
}
