import { existsSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { expect, test, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import {
  asMoney, asTaka, balanceAfterCashIn, commissionFor, CUSTOMER_CASH_IN, SYSTEM_TOP_UP,
} from '../../src/core/business';
import { LEDGER_COLUMNS, ledgerToCells, type Account, type LedgerEntry } from '../../src/core/models';
import { settings } from '../../src/core/settings';
import { AuthScreen } from '../../src/screens/AuthScreen';
import { DepositScreen } from '../../src/screens/DepositScreen';
import { SignUpScreen } from '../../src/screens/SignUpScreen';
import { StatementScreen } from '../../src/screens/StatementScreen';
import { UserAdminScreen } from '../../src/screens/UserAdminScreen';
import { backoffice, type Backoffice } from '../../src/support/backoffice';
import { loadCsv, saveCsv } from '../../src/support/csvFile';
import { freshAccount, localDate } from '../../src/support/factory';

/**
 * Agent lifecycle on the live portal, as one ordered story in a single browser session:
 *   sign-up -> admin approval -> System top-up -> Agent cash-in to a Customer ->
 *   password reset -> Self Statement exported to CSV.
 * Positive checks are tagged @smoke; the negative "old password" check is regression-only.
 */
test.describe.configure({ mode: 'serial' });

const FINAL_BALANCE = balanceAfterCashIn(SYSTEM_TOP_UP, CUSTOMER_CASH_IN); // 1512.50

/** Everything the steps hand to each other. */
const run = {
  agent: undefined as unknown as Account,
  customerPhone: '',
  statusAtSignUp: '',
  topUpTxn: '',
  cashInTxn: '',
  agentPassword: settings.agent.initialPassword,
  ledger: [] as LedgerEntry[],
};

let browserContext: BrowserContext;
let page: Page;
let request: APIRequestContext;
let office: Backoffice;
let auth: AuthScreen;
let users: UserAdminScreen;
let deposit: DepositScreen;
let statement: StatementScreen;

const agentOtp = () => office.otpFor(run.agent.userId);

test.beforeAll(async ({ browser, playwright }) => {
  browserContext = await browser.newContext({
    baseURL: settings.portalUrl,
    viewport: { width: 1366, height: 900 },
    recordVideo: { dir: 'recordings/tmp', size: { width: 1366, height: 900 } },
  });
  page = await browserContext.newPage();
  request = await playwright.request.newContext();
  office = backoffice(request);

  auth = new AuthScreen(page);
  users = new UserAdminScreen(page);
  deposit = new DepositScreen(page);
  statement = new StatementScreen(page);

  // Pre-condition for step 12: an active Customer. A new one avoids the ~10,000 Tk balance cap
  // that the seeded customers usually sit at.
  run.customerPhone =
    settings.existingCustomerPhone ??
    (await office.activeCustomer(freshAccount('Customer', settings.agent.initialPassword))).phone;
});

test.afterEach(async ({}, info) => {
  if (info.status !== info.expectedStatus) {
    await info.attach('page-at-failure', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  }
});

test.afterAll(async () => {
  const recording = page.video();
  await browserContext.close();
  await request.dispose();
  if (recording) {
    mkdirSync('recordings', { recursive: true });
    await recording.saveAs(join('recordings', 'agent-flow.webm'));
  }
});

test.describe('1 · Agent sign-up', () => {
  test('TC01 a new Agent can register', { tag: '@smoke' }, async () => {
    const draft = freshAccount('Agent', settings.agent.initialPassword);
    const signUp = new SignUpScreen(page);

    await test.step('open Sign Up from the home page', () => signUp.reachFromHome());
    await test.step('fill the form with Agent role', () => signUp.complete(draft));
    const response = await test.step('submit', () => signUp.create());

    expect(response.status()).toBe(201);
    const { message, user } = await response.json();
    expect(message).toContain('Registration successful');
    expect(user).toMatchObject({ email: draft.gmail, phone_number: draft.phone, role: 'Agent' });
    await expect(signUp.pendingNotice).toBeVisible();

    run.agent = { ...draft, userId: user.id, status: user.status };
    run.statusAtSignUp = user.status;
  });

  test('TC02 the new Agent starts inactive (pending)', { tag: '@smoke' }, async () => {
    expect(run.statusAtSignUp, 'status returned by the registration call').toBe('pending');
  });
});

test.describe('2 · Admin approval', () => {
  test('TC03 Admin can sign in', { tag: '@smoke' }, async () => {
    const { login, password } = settings.credentials.admin;
    await auth.signIn(login, password);
    await expect(auth.topBar.label('Admin Dashboard')).toBeVisible();
    await expect(auth.topBar.label('Admin')).toBeVisible();
  });

  test('TC04 the Agent is listed for Admin as PENDING', { tag: '@smoke' }, async () => {
    await users.openList();
    const row = await users.findByEmail(run.agent.gmail);
    await expect(row).toHaveCount(1);
    for (const expected of [run.agent.fullName, run.agent.phone, 'Agent', 'PENDING']) {
      await expect(row).toContainText(expected);
    }
    await users.openDetails(row);
  });

  test('TC05 Admin activates the Agent', { tag: '@smoke' }, async () => {
    await expect(users.statusChip()).toHaveText(/^pending$/i);
    expect(await users.changeStatus('Active')).toBe(200);
    await expect(users.statusChip()).toHaveText(/^active$/i);
  });

  test('TC06 the Agent is still active after a reload', { tag: '@smoke' }, async () => {
    await page.reload();
    await expect(users.statusChip()).toHaveText(/^active$/i);
  });
});

test.describe('3 · System top-up', () => {
  test('TC07 System can sign in after Admin signs out', { tag: '@smoke' }, async () => {
    await users.topBar.signOut();
    const { login, password } = settings.credentials.system;
    await auth.signIn(login, password);
    await expect(auth.topBar.label('SYSTEM')).toBeVisible();
  });

  test('TC08 System deposits 2000 Tk to the Agent', { tag: '@smoke' }, async () => {
    await deposit.open();
    const receipt = await deposit.send(run.agent.phone, SYSTEM_TOP_UP);
    expect(receipt).toMatchObject({ title: 'SYSTEM deposit to Agent successful', total: asTaka(SYSTEM_TOP_UP) });
    expect(receipt.txnId).toMatch(/^TXN/);
    run.topUpTxn = receipt.txnId;
  });

  test('TC09 the top-up is recorded correctly in the System statement', { tag: '@smoke' }, async () => {
    await statement.open();
    const entry = await statement.entry(run.topUpTxn);
    expect(entry, `${run.topUpTxn} in System statement`).toBeDefined();
    expect(entry).toMatchObject({
      from: 'SYSTEM', to: run.agent.phone, kind: 'System Deposit to Agent', debit: asMoney(SYSTEM_TOP_UP), credit: '-',
    });
  });
});

test.describe('4 · Agent cash-in', () => {
  test('TC10 the activated Agent can sign in (OTP)', { tag: '@smoke' }, async () => {
    await statement.topBar.signOut();
    await auth.signIn(run.agent.gmail, run.agentPassword, agentOtp);
    await expect(auth.topBar.label('Agent Dashboard')).toBeVisible();
  });

  test('TC11 the Agent balance is exactly 2000 Tk', { tag: '@smoke' }, async () => {
    await expect.poll(() => auth.topBar.balance()).toBe(SYSTEM_TOP_UP);
  });

  test('TC12 the Agent deposits 500 Tk to a Customer', { tag: '@smoke' }, async () => {
    await deposit.open();
    const receipt = await deposit.send(run.customerPhone, CUSTOMER_CASH_IN);
    expect(receipt).toMatchObject({ title: 'Deposit successful', total: asTaka(CUSTOMER_CASH_IN) });
    expect(receipt.txnId).toMatch(/^TXN/);
    run.cashInTxn = receipt.txnId;
  });

  test('TC13 the Agent balance reflects the deposit and 2.5% commission', { tag: '@smoke' }, async () => {
    expect(await deposit.topBar.balance()).toBe(FINAL_BALANCE);
  });

  test('TC14 the Customer deposit is in the Agent Self Statement', { tag: '@smoke' }, async () => {
    await statement.open();
    const entry = await statement.entry(run.cashInTxn);
    expect(entry, `${run.cashInTxn} in Agent statement`).toBeDefined();
    expect(entry).toMatchObject({
      from: run.agent.phone, to: run.customerPhone,
      debit: asMoney(CUSTOMER_CASH_IN), credit: asMoney(commissionFor(CUSTOMER_CASH_IN)), balance: asMoney(FINAL_BALANCE),
    });
  });
});

test.describe('5 · Sign-out and password reset', () => {
  test('TC15 the Agent can sign out', { tag: '@smoke' }, async () => {
    await statement.topBar.signOut();
    await expect(auth.loginField).toBeVisible();
    await test.step('a protected page now redirects to login', async () => {
      await page.goto('/agent/self-statement');
      await expect(page).toHaveURL(/\/login$/);
    });
  });

  test('TC16 the Agent can reset the password', { tag: '@smoke' }, async () => {
    await auth.requestReset(run.agent.gmail);
    await auth.completeReset(await office.resetTokenFor(run.agent.userId), settings.agent.resetPassword);
    run.agentPassword = settings.agent.resetPassword;
  });

  test('TC17 the old password is rejected after the reset', { tag: '@negative' }, async () => {
    await auth.visit();
    await auth.enter(run.agent.gmail, settings.agent.initialPassword);
    await expect(auth.errorBanner).toBeVisible();
    await expect(auth.otpField).toHaveCount(0);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC18 the new password signs the Agent in', { tag: '@smoke' }, async () => {
    await auth.signIn(run.agent.gmail, run.agentPassword, agentOtp);
    await expect(auth.topBar.label('Agent Dashboard')).toBeVisible();
  });
});

test.describe('6 · Self Statement export', () => {
  test('TC19 the Self Statement holds exactly this run\'s transactions', { tag: '@smoke' }, async () => {
    await statement.open();
    expect(await statement.columnNames()).toEqual([...LEDGER_COLUMNS]);

    run.ledger = await statement.collectAll();
    expect(run.ledger.length).toBe(await statement.totalInTitle());
    expect(run.ledger).toHaveLength(2); // brand-new Agent: top-up + cash-in only

    const byId = new Map(run.ledger.map((e) => [e.txnId, e]));
    expect(byId.get(run.topUpTxn)).toMatchObject({
      from: 'SYSTEM', to: run.agent.phone, kind: 'Top-up from SYSTEM',
      debit: '-', credit: asMoney(SYSTEM_TOP_UP), balance: asMoney(SYSTEM_TOP_UP),
    });
    expect(byId.get(run.cashInTxn)).toMatchObject({
      from: run.agent.phone, to: run.customerPhone, kind: 'Deposit Commission',
      debit: asMoney(CUSTOMER_CASH_IN), credit: asMoney(commissionFor(CUSTOMER_CASH_IN)), balance: asMoney(FINAL_BALANCE),
    });
  });

  test('TC20 the statement is saved as self_statement_<date>.csv', { tag: '@smoke' }, async ({}, info) => {
    const csvPath = join('output', `self_statement_${localDate()}.csv`);
    const body = run.ledger.map(ledgerToCells);
    saveCsv(csvPath, LEDGER_COLUMNS, body);

    expect(basename(csvPath)).toMatch(/^self_statement_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(existsSync(csvPath)).toBeTruthy();

    const [header, ...rows] = loadCsv(csvPath);
    expect(header).toEqual([...LEDGER_COLUMNS]);
    expect(rows).toEqual(body);
    const ids = rows.map((r) => r[0]);
    expect(ids).toEqual(expect.arrayContaining([run.topUpTxn, run.cashInTxn]));

    await info.attach(basename(csvPath), { path: csvPath, contentType: 'text/csv' });
  });
});
