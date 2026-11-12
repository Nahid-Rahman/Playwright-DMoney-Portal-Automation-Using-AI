import type { APIRequestContext } from '@playwright/test';
import { settings } from '../core/settings';
import type { Account, AccountDraft } from '../core/models';

/**
 * Back-office helpers, used ONLY for (a) preparing test data and (b) reading values the portal
 * sends by e-mail (login OTP, password-reset token) for an account this run created.
 * Every behaviour the assignment verifies is driven and asserted through the UI.
 */
export function backoffice(request: APIRequestContext) {
  const url = (path: string) => `${settings.backendUrl}${path}`;

  async function adminBearer(): Promise<string> {
    const { login, password } = settings.credentials.admin;
    const res = await request.post(url('/user/login'), { data: { email: login, password } });
    if (!res.ok()) throw new Error(`admin login via API failed (${res.status()}): ${await res.text()}`);
    const body = await res.json();
    return `Bearer ${body.token}`;
  }

  async function userRecord(userId: number): Promise<Record<string, unknown>> {
    const res = await request.get(url(`/user/search/id/${userId}`), {
      headers: { Authorization: await adminBearer() },
    });
    if (!res.ok()) throw new Error(`user lookup ${userId} failed (${res.status()})`);
    return (await res.json()).user;
  }

  /** Polls the user record until `field` is filled (the value is issued asynchronously). */
  async function waitForField(userId: number, field: 'otp' | 'reset_token', tries = 10): Promise<string> {
    let attempt = 0;
    while (attempt < tries) {
      const value = (await userRecord(userId))[field];
      if (value) return String(value);
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(`no ${field} issued for user ${userId} after ${tries} tries`);
  }

  return {
    /** Registers a Customer and activates it, so the cash-in target never hits the balance cap. */
    async activeCustomer(draft: AccountDraft): Promise<Account> {
      const registration = await request.post(url('/user/register'), {
        data: {
          name: draft.fullName, email: draft.gmail, password: draft.password,
          phone_number: draft.phone, nid: draft.nid, role: draft.role,
        },
      });
      if (registration.status() !== 201) {
        throw new Error(`customer registration failed (${registration.status()}): ${await registration.text()}`);
      }
      const userId: number = (await registration.json()).user.id;

      const activation = await request.patch(url(`/user/update/${userId}`), {
        headers: { Authorization: await adminBearer(), 'x-auth-secret-key': settings.secretKey },
        data: {
          name: draft.fullName, email: draft.gmail, phone_number: draft.phone,
          nid: draft.nid, role: draft.role, status: 'active',
        },
      });
      if (!activation.ok()) throw new Error(`customer activation failed (${activation.status()})`);
      return { ...draft, userId, status: 'active' };
    },

    /** 4-digit login OTP that would be e-mailed (valid ~2 minutes). */
    otpFor: (userId: number) => waitForField(userId, 'otp'),

    /** Token from the reset-password e-mail link. */
    resetTokenFor: (userId: number) => waitForField(userId, 'reset_token'),
  };
}

export type Backoffice = ReturnType<typeof backoffice>;
