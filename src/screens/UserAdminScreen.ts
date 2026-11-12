import { expect, type Locator, type Page } from '@playwright/test';
import type { AccountStatus } from '../core/models';
import { TopBar } from './TopBar';

export class UserAdminScreen {
  readonly topBar: TopBar;

  constructor(private readonly page: Page) {
    this.topBar = new TopBar(page);
  }

  async openList(): Promise<void> {
    await this.page.getByRole('link', { name: 'User List' }).first().click();
    await expect(this.page).toHaveURL(/\/admin\/users$/);
    await expect(this.page.getByText(/^Total: \d+/)).toBeVisible();
  }

  async findByEmail(email: string): Promise<Locator> {
    await this.page.getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: 'Search by Email' }).click();
    await this.page.getByPlaceholder('e.g., user@example.com').fill(email);
    await this.page.getByRole('button', { name: 'SEARCH' }).click();
    return this.page.getByRole('row').filter({ hasText: email });
  }

  async openDetails(row: Locator): Promise<void> {
    await row.getByRole('button', { name: 'VIEW' }).click();
    await expect(this.page).toHaveURL(/\/admin\/users\/\d+$/);
  }

  /** The chip right after the "Account Status" label (upper-cased by CSS only). */
  statusChip(): Locator {
    return this.page.getByText(/^Account Status$/i).first().locator('xpath=following-sibling::*[1]');
  }

  async changeStatus(target: AccountStatus): Promise<number> {
    await this.page.getByRole('button', { name: 'Edit User' }).click();
    const statusSelect = this.page.getByRole('combobox').nth(1);
    await statusSelect.click();
    await this.page.getByRole('option', { name: target }).click();
    const saved = this.page.waitForResponse(
      (res) => res.request().method() === 'PATCH' && /\/user\/update\/\d+$/.test(res.url()),
    );
    await this.page.getByRole('button', { name: 'Save Changes' }).click();
    return (await saved).status();
  }
}
