import { expect, type Page } from '@playwright/test';
import { TopBar } from './TopBar';

type OtpSource = () => Promise<string>;

const LOGIN_ERROR = 'Login failed. Please input correct email/phone number or password.';

/** Login (with and without OTP) plus the forgot / reset password pages. */
export class AuthScreen {
  readonly topBar: TopBar;

  constructor(private readonly page: Page) {
    this.topBar = new TopBar(page);
  }

  get loginField() { return this.page.getByLabel(/email or phone/i); }
  get passwordField() { return this.page.locator('input[type="password"]'); }
  get otpField() { return this.page.getByPlaceholder('• • • •'); }
  get errorBanner() { return this.page.getByText(LOGIN_ERROR); }

  async visit(): Promise<void> {
    await this.page.goto('/login');
    // global setup runs outside a test, where expect.timeout from the config is not applied
    await expect(this.loginField).toBeVisible({ timeout: 15_000 });
  }

  async enter(login: string, password: string): Promise<void> {
    await this.loginField.fill(login);
    await this.passwordField.fill(password);
    await this.page.getByRole('button', { name: /^login/i }).click();
  }

  private async landOnDashboard(): Promise<void> {
    await expect(this.page).toHaveURL(/\/profile/);
    await expect(this.topBar.title()).toBeVisible();
  }

  /**
   * Signs in. Admin and System skip the OTP step; every other role gets a 4-digit code by e-mail,
   * which `otp` must supply.
   */
  async signIn(login: string, password: string, otp?: OtpSource): Promise<void> {
    await this.visit();
    await this.enter(login, password);
    if (otp) {
      await expect(this.otpField).toBeVisible();
      await this.otpField.fill(await otp());
      await this.page.getByRole('button', { name: /verify otp/i }).click();
    }
    await this.landOnDashboard();
  }

  async requestReset(login: string): Promise<void> {
    await this.page.goto('/login');
    await this.page.getByText('Forgot password?').click();
    await expect(this.page).toHaveURL(/\/forgot-password$/);
    await this.loginField.fill(login);
    await this.page.getByRole('button', { name: /send reset link/i }).click();
    await expect(this.page.getByText(/reset link has been sent/i)).toBeVisible();
  }

  async completeReset(token: string, newPassword: string): Promise<void> {
    await this.page.goto(`/reset-password?token=${encodeURIComponent(token)}`);
    const [first, confirm] = [this.passwordField.nth(0), this.passwordField.nth(1)];
    await first.fill(newPassword);
    await confirm.fill(newPassword);
    await this.page.getByRole('button', { name: /reset password/i }).click();
    await expect(this.page.getByText('Your password has been reset successfully.')).toBeVisible();
  }
}
