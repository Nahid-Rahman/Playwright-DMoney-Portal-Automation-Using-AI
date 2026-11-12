import { expect, type Locator, type Page } from '@playwright/test';
import { readAmount } from '../core/business';

/**
 * The bar across the top of every signed-in screen: dashboard title, balance toggle and the user
 * menu. Screens hold one of these instead of inheriting from a base page.
 */
export class TopBar {
  readonly root: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('header');
  }

  title(): Locator {
    return this.root.getByText(/Dashboard$/);
  }

  label(text: string): Locator {
    return this.root.getByText(text, { exact: true }).first();
  }

  async balance(): Promise<number> {
    // Reload first so the figure comes fresh from the server, not from a cached render.
    await this.page.reload();
    await this.root.getByRole('button', { name: 'Balance' }).click();
    const figure = this.root.getByText(/৳\s*-?[\d,]+\.\d{2}/);
    await expect(figure).toBeVisible();
    return readAmount(await figure.innerText());
  }

  async signOut(): Promise<void> {
    const userChip = this.root.locator(':scope > div > div:last-child');
    await userChip.click();
    await this.page.getByRole('menuitem', { name: /logout/i }).click();
    await expect(this.page).toHaveURL(/\/login$/);
  }
}
