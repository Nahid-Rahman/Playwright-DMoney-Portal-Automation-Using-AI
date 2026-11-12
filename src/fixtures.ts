import { test as base } from '@playwright/test';
import { AuthScreen } from './screens/AuthScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { TopBar } from './screens/TopBar';

/** Per-test screens for the independent specs (the journey builds its own shared session). */
export const test = base.extend<{ auth: AuthScreen; signUp: SignUpScreen; topBar: TopBar }>({
  auth: async ({ page }, use) => use(new AuthScreen(page)),
  signUp: async ({ page }, use) => use(new SignUpScreen(page)),
  topBar: async ({ page }, use) => use(new TopBar(page)),
});

export { expect } from '@playwright/test';
