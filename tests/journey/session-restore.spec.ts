import { expect, test } from '../../src/fixtures';
import { sessionFile } from '../setup/global.setup';

/** The storage states saved by global setup open the dashboard with no login step. */
const cases = [
  { id: 'TC-AUTH01', role: 'Admin', file: sessionFile.admin, marker: 'Admin' },
  { id: 'TC-AUTH02', role: 'System', file: sessionFile.system, marker: 'SYSTEM' },
] as const;

for (const c of cases) {
  test.describe(`${c.role} session`, () => {
    test.use({ storageState: c.file });

    test(`${c.id} opens already signed in as ${c.role}`, { tag: '@smoke' }, async ({ page, topBar }) => {
      await page.goto('/profile');
      await expect(topBar.title()).toBeVisible();
      await expect(topBar.label(c.marker)).toBeVisible();
    });
  });
}
