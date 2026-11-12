export type AccountRole = 'Agent' | 'Customer' | 'Merchant';
export type AccountStatus = 'Pending' | 'Active' | 'Suspended';

export interface AccountDraft {
  role: AccountRole;
  fullName: string;
  gmail: string;
  phone: string;
  nid: string;
  password: string;
}

export interface Account extends AccountDraft {
  userId: number;
  status: string;
}

export interface Receipt {
  title: string;
  txnId: string;
  total: string;
}

/** One row of the Self Statement table, in on-screen column order. */
export interface LedgerEntry {
  txnId: string;
  from: string;
  to: string;
  kind: string;
  debit: string;
  credit: string;
  balance: string;
  when: string;
}

export const LEDGER_COLUMNS = [
  'Transaction ID',
  'Sender Account',
  'Receiver Account',
  'Type',
  'Debit',
  'Credit',
  'Balance',
  'Date',
] as const;

export const ledgerToCells = (e: LedgerEntry): string[] =>
  [e.txnId, e.from, e.to, e.kind, e.debit, e.credit, e.balance, e.when];
