import 'dotenv/config';

const missing: string[] = [];

function read(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) missing.push(key);
  return value ?? '';
}

const raw = {
  portalUrl: process.env.PORTAL_URL || 'https://dmoneyportal.roadtocareer.net',
  backendUrl: process.env.BACKEND_URL || 'https://dmoney.roadtocareer.net',
  adminEmail: read('ADMIN_EMAIL'),
  adminPassword: read('ADMIN_PASSWORD'),
  systemEmail: read('SYSTEM_EMAIL'),
  systemPassword: read('SYSTEM_PASSWORD'),
  agentPassword: read('AGENT_PASSWORD'),
  agentResetPassword: read('AGENT_RESET_PASSWORD'),
  secretKey: read('API_SECRET_KEY'),
  existingCustomerPhone: process.env.EXISTING_CUSTOMER_PHONE?.trim() || null,
};

if (missing.length > 0) {
  throw new Error(`.env is incomplete, missing: ${missing.join(', ')} (see .env.example)`);
}

/** Typed, validated view of the .env file. Credentials never live in code. */
export const settings = {
  portalUrl: raw.portalUrl,
  backendUrl: raw.backendUrl,
  credentials: {
    admin: { login: raw.adminEmail, password: raw.adminPassword },
    system: { login: raw.systemEmail, password: raw.systemPassword },
  },
  agent: { initialPassword: raw.agentPassword, resetPassword: raw.agentResetPassword },
  secretKey: raw.secretKey,
  existingCustomerPhone: raw.existingCustomerPhone,
} as const;
