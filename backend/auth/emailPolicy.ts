/**
 * Which email addresses may create an account (or be invited).
 *
 * Default: genuine Gmail addresses only (gmail.com / googlemail.com).
 * Override with ALLOWED_EMAIL_DOMAINS="gmail.com,yourcompany.com", or "*" to allow any domain.
 */

const DEFAULT_DOMAINS = ['gmail.com', 'googlemail.com'];
const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

// Gmail usernames: 6-30 letters/digits/periods, no leading/trailing/consecutive periods.
// ("+tag" aliases are delivery tricks, not real account names, so they are rejected here.)
const GMAIL_LOCAL = /^[a-z0-9](?!.*\.\.)[a-z0-9.]{4,28}[a-z0-9]$/;

export function allowedDomains(): string[] | 'any' {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS?.trim();
  if (!raw) return DEFAULT_DOMAINS;
  if (raw === '*') return 'any';
  const list = raw.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
  return list.length ? list : DEFAULT_DOMAINS;
}

/** Returns a user-facing error, or null when the address is acceptable. Expects a lower-cased email. */
export function checkEmailPolicy(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 1) return 'Enter a valid email address.';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  const domains = allowedDomains();
  if (domains !== 'any' && !domains.includes(domain)) {
    return domains.every(d => GMAIL_DOMAINS.has(d))
      ? 'Only official Gmail addresses (@gmail.com) can be used.'
      : `Only these email domains can be used: ${domains.join(', ')}.`;
  }

  if (GMAIL_DOMAINS.has(domain) && !GMAIL_LOCAL.test(local)) {
    return 'That does not look like a valid Gmail address.';
  }
  return null;
}
