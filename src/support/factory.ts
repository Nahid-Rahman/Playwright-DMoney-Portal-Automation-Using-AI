import { randomInt } from 'node:crypto';
import type { AccountDraft, AccountRole } from '../core/models';

const randomDigits = (count: number): string => {
  let out = '';
  while (out.length < count) out += randomInt(10).toString();
  return out;
};

/**
 * A unique account for one run. Portal rules: Gmail only, phone 01 + 9 digits, NID 7–13 digits.
 */
export function freshAccount(role: AccountRole, password: string): AccountDraft {
  const suffix = Date.now().toString(36) + randomDigits(4);
  return {
    role,
    fullName: `Auto ${role} ${suffix.slice(-6).toUpperCase()}`,
    gmail: `dmoney.e2e.${role.toLowerCase()}.${suffix}@gmail.com`,
    phone: '01' + randomDigits(9),
    nid: randomDigits(11),
    password,
  };
}

/** Local calendar date as YYYY-MM-DD (used in the CSV file name). */
export function localDate(at: Date = new Date()): string {
  const offsetMs = at.getTimezoneOffset() * 60_000;
  return new Date(at.getTime() - offsetMs).toISOString().slice(0, 10);
}
