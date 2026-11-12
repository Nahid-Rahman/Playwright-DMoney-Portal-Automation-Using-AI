import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type FullConfig } from '@playwright/test';
import { settings } from '../../src/core/settings';
import { AuthScreen } from '../../src/screens/AuthScreen';

/** Saved sessions for the two fixed-credential roles. Agents/Customers are new every run, so not here. */
export const SESSION_DIR = join(process.cwd(), '.auth');
export const sessionFile = { admin: join(SESSION_DIR, 'admin.json'), system: join(SESSION_DIR, 'system.json') };

async function captureSession(baseURL: string, role: 'admin' | 'system'): Promise<void> {
  const { login, password } = settings.credentials[role];
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });
  try {
    await new AuthScreen(page).signIn(login, password);
    await page.context().storageState({ path: sessionFile[role] });
  } catch (err) {
    // outside a test there is no automatic trace, so leave a hint about where it stopped
    console.error(`[global setup] ${role} sign-in failed on ${page.url()}`);
    throw err;
  } finally {
    await browser.close();
  }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL || settings.portalUrl;
  mkdirSync(SESSION_DIR, { recursive: true });
  for (const role of ['admin', 'system'] as const) {
    await captureSession(baseURL, role);
  }
}
