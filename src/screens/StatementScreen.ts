import { expect, type Locator, type Page } from '@playwright/test';
import type { LedgerEntry } from '../core/models';
import { TopBar } from './TopBar';

const TITLE = /^Transaction History \(Total: (\d+)\)/;

export class StatementScreen {
  readonly topBar: TopBar;
  private readonly bodyRows: Locator;

  constructor(private readonly page: Page) {
    this.topBar = new TopBar(page);
    this.bodyRows = page.locator('tbody tr');
  }

  async open(): Promise<void> {
    await this.page.getByRole('link', { name: 'Self Statement' }).first().click();
    await expect(this.page).toHaveURL(/\/agent\/self-statement$/);
    await expect(this.page.getByText(TITLE)).toBeVisible();
    await expect(this.bodyRows.first()).toBeVisible();
  }

  async columnNames(): Promise<string[]> {
    const names = await this.page.locator('thead th').allInnerTexts();
    return names.map((n) => n.trim());
  }

  async totalInTitle(): Promise<number> {
    const title = await this.page.getByText(TITLE).innerText();
    const match = title.match(TITLE);
    if (!match) throw new Error(`Unexpected statement title: "${title}"`);
    return Number(match[1]);
  }

  private async visibleEntries(): Promise<LedgerEntry[]> {
    const cells = await this.bodyRows.evaluateAll((rows) =>
      rows.map((row) => [...row.querySelectorAll('td')].map((td) => (td.textContent || '').replace(/\s+/g, ' ').trim())),
    );
    return cells
      .filter((c) => (c[0] || '').startsWith('TXN'))
      .map(([txnId, from, to, kind, debit, credit, balance, when]) => ({ txnId, from, to, kind, debit, credit, balance, when }));
  }

  /**
   * Walks the paginator and returns every row shown under the current date filter.
   *
   * Quirk: the paginator counts ALL-TIME history but each page only renders rows inside the date
   * filter (today). Rows come newest first, so the first empty page means there is nothing older.
   */
  async collectAll(pageLimit = 50): Promise<LedgerEntry[]> {
    const seen = new Map<string, LedgerEntry>();
    const nextButton = this.page.getByRole('button', { name: 'Go to next page' });
    const rangeText = this.page.getByText(/^\d+–\d+ of \d+$/);

    let visited = 0;
    let entries = await this.visibleEntries();
    while (entries.length > 0 && visited < pageLimit) {
      for (const entry of entries) seen.set(entry.txnId, entry);
      visited += 1;

      const canGoOn = (await nextButton.isVisible()) && (await nextButton.isEnabled());
      if (!canGoOn) break;
      const previousRange = await rangeText.innerText();
      await nextButton.click();
      await expect(rangeText).not.toHaveText(previousRange);
      entries = await this.visibleEntries();
    }
    return Array.from(seen.values());
  }

  async entry(txnId: string): Promise<LedgerEntry | undefined> {
    return (await this.collectAll()).find((e) => e.txnId === txnId);
  }
}
