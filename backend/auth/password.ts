/** Password hashing (bcrypt) and validation policy. */

import bcrypt from 'bcryptjs';
import { getAuthConfig } from './config';

const MIN_LENGTH = 10;
// bcrypt only uses the first 72 bytes; reject longer input instead of silently truncating it.
const MAX_BYTES = 72;
const COMMON = new Set([
  'password123', 'password1234', '1234567890', 'qwerty12345', 'letmein1234',
  'welcome1234', 'admin12345', 'iloveyou123', 'changeme123', 'password1!'
]);

export function validatePassword(password: unknown, email = ''): string | null {
  if (typeof password !== 'string') return 'Password is required.';
  if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
  if (Buffer.byteLength(password) > MAX_BYTES) return `Password must be at most ${MAX_BYTES} bytes.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain at least one letter and one number.';
  if (COMMON.has(password.toLowerCase())) return 'That password is too common.';
  if (email && password.toLowerCase() === email.toLowerCase()) return 'Password must not be your email address.';
  return null;
}

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, getAuthConfig().bcryptCost);

export const verifyPassword = (password: string, hash: string): Promise<boolean> => bcrypt.compare(password, hash);

// Compared against when the email is unknown so response time does not reveal which emails exist.
let dummyHash: Promise<string> | null = null;
export const dummyVerify = async (password: string): Promise<void> => {
  dummyHash ??= bcrypt.hash('not-a-real-password', getAuthConfig().bcryptCost);
  await bcrypt.compare(password, await dummyHash);
};
