import { expect, type Page, type Response } from '@playwright/test';
import type { AccountDraft } from '../core/models';

const FIELD_MAP: Array<[keyof AccountDraft, string]> = [
  ['fullName', 'name'],
  ['gmail', 'email'],
  ['password', 'password'],
  ['phone', 'phone_number'],
  ['nid', 'nid'],
];

export class SignUpScreen {
  constructor(private readonly page: Page) {}

  get pendingNotice() {
    return this.page.getByText('Registration successful. Your account is pending approval by an admin.');
  }

  get gmailOnlyError() {
    return this.page.getByText('Only Gmail addresses (@gmail.com) are allowed for registration.');
  }

  get createButton() {
    return this.page.getByRole('button', { name: /create account/i });
  }

  /** Home page -> "Sign Up" link, the way a real visitor reaches the form. */
  async reachFromHome(): Promise<void> {
    await this.page.goto('/');
    await this.page.getByRole('link', { name: 'Sign Up' }).first().click();
    await expect(this.page).toHaveURL(/\/register$/);
  }

  async complete(draft: AccountDraft): Promise<void> {
    for (const [key, inputName] of FIELD_MAP) {
      await this.page.locator(`input[name="${inputName}"]`).fill(String(draft[key]));
    }
    await this.page.getByRole('combobox').click();
    await this.page.getByRole('option', { name: new RegExp(draft.role, 'i') }).click();
  }

  /** Clicks "Create account" and hands back the POST /user/register response. */
  async create(): Promise<Response> {
    const registerCall = this.page.waitForResponse(
      (res) => res.request().method() === 'POST' && res.url().endsWith('/user/register'),
    );
    await this.createButton.click();
    return registerCall;
  }
}
