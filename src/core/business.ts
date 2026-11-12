/**
 * Amounts and business rules the journey asserts on. Kept in one place so that a rule change on
 * the portal (e.g. the commission rate) is a one-line update.
 */
export const SYSTEM_TOP_UP = 2000;
export const CUSTOMER_CASH_IN = 500;

/** The portal credits the depositing Agent 2.5 % of every customer cash-in. */
export const AGENT_COMMISSION = 0.025;

export const commissionFor = (amount: number): number => amount * AGENT_COMMISSION;

/** 2000 received − 500 sent + 12.50 commission = 1512.50 */
export const balanceAfterCashIn = (start: number, sent: number): number => start - sent + commissionFor(sent);

export const asMoney = (value: number): string => value.toFixed(2);
export const asTaka = (value: number): string => `৳ ${asMoney(value)}`;

/** "৳ 1,512.50" -> 1512.5 */
export const readAmount = (label: string): number => Number(label.replace(/[^\d.-]/g, ''));
