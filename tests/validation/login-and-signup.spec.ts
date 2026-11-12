import { expect, test } from '../../src/fixtures';
import { settings } from '../../src/core/settings';
import { freshAccount } from '../../src/support/factory';

/** Negative checks; regression only (never @smoke). */
test.describe('Input validation', { tag: '@negative' }, () => {
  test('NEG01 a wrong password does not sign in', async ({ page, auth }) => {
    await auth.visit();
    await auth.enter(settings.credentials.admin.login, 'not-the-password');
    await expect(auth.errorBanner).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('NEG02 a non-Gmail address cannot register', async ({ page, signUp }) => {
    const draft = freshAccount('Agent', settings.agent.initialPassword);
    draft.gmail = draft.gmail.replace(/@gmail\.com$/, '@yahoo.com');

    const registerCalls: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().endsWith('/user/register')) registerCalls.push(req.url());
    });

    await signUp.reachFromHome();
    await signUp.complete(draft);
    await signUp.createButton.click();

    await expect(signUp.gmailOnlyError).toBeVisible();
    await expect(signUp.pendingNotice).toHaveCount(0);
    expect(registerCalls, 'blocked on the client, no API call').toHaveLength(0);
  });
});
