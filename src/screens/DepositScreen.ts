import { expect, type Page } from '@playwright/test';
import type { Receipt } from '../core/models';
import { TopBar } from './TopBar';

/** "Cash In" screen. Used by System (top-up to an Agent) and by the Agent (deposit to a Customer). */
export class DepositScreen {
  readonly topBar: TopBar;

  constructor(private readonly page: Page) {
    this.topBar = new TopBar(page);
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Cash In' }).first().click();
    await expect(this.page).toHaveURL(/\/agent\/cash-in$/);
  }

  async send(phone: string, amount: number): Promise<Receipt> {
    await this.page.locator('input[name="customer"]').fill(phone);
    await this.page.locator('input[name="amount"]').fill(amount.toString());
    await this.page.getByRole('button', { name: /cash in/i }).click();
    return this.readReceipt();
  }

  private async readReceipt(): Promise<Receipt> {
    const main = this.page.locator('main');
    const valueAfter = (label: string) => main.getByText(label).locator('xpath=following-sibling::*[1]');

    await expect(main.getByText('TRANSACTION ID')).toBeVisible();
    const [title, txnId, total] = await Promise.all([
      main.getByText(/successful$/).first().innerText(),
      valueAfter('TRANSACTION ID').innerText(),
      valueAfter('TOTAL AMOUNT').innerText(),
    ]);
    return { title: title.trim(), txnId: txnId.trim(), total: total.trim() };
  }
}
