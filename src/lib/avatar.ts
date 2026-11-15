import type { User } from '../types';

export const initialsOf = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || 'U';

/** Self-contained initials avatar (SVG data URI), so a user without a photo still renders everywhere. */
export function initialsAvatar(name: string): string {
  const initials = initialsOf(name).replace(/[^A-Z0-9]/g, '') || 'U';
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='150' height='150' fill='hsl(${hue},55%,46%)'/>` +
    `<text x='50%' y='50%' dy='.35em' text-anchor='middle' font-family='Inter,Arial,sans-serif' font-size='60' font-weight='600' fill='#fff'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Returns the user with an avatar guaranteed (keeps an existing photo URL). */
export const withAvatar = <T extends Pick<User, 'name' | 'avatar'>>(user: T): T =>
  user.avatar ? user : { ...user, avatar: initialsAvatar(user.name) };
