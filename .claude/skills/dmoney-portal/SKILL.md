---
name: dmoney-portal
description: Portal facts this suite depends on - roles and logins, OTP and reset token, registration rules, admin activation, cash-in and commission, Self Statement pagination, DOM quirks. Read before editing a screen object or an expected value.
---

# DMoney portal reference

Observed on the live portal. When the portal changes, change this file in the same commit as the code.

## Accounts
- **Admin** (`ADMIN_EMAIL`) – no OTP; lands on `/profile` with "Admin Dashboard".
- **System** (`SYSTEM_EMAIL`) – the liquidity pool. Technically an *Agent* account: "Agent Dashboard", name `SYSTEM`. No OTP.
- **New Agent** – every login sends a **4-digit OTP** by e-mail, valid about 2 minutes.
- Bad credentials: "Login failed. Please input correct email/phone number or password."
- A pending Agent can still log in; being inactive shows as a status, not a refused login.

## Values sent by e-mail
Registration only accepts `@gmail.com`, and the suite cannot open that inbox. The admin endpoint
`GET /user/search/id/:id` exposes the user's current `otp` and `reset_token`; `backoffice.otpFor()` and
`resetTokenFor()` read them **only for the account the run created**. Reset page: `/reset-password?token=…`.

## Sign Up – `/register` (link "Sign Up" on `/`)
- Inputs by `name`: `name`, `email`, `password`, `phone_number` (01 + 9 digits), `nid` (7–13 digits); role combobox Customer / Agent / Merchant.
- Non-Gmail is stopped in the browser: "Only Gmail addresses (@gmail.com) are allowed for registration." – no request is sent.
- `POST /user/register` -> 201, "Registration successful. Your account is pending approval by an admin.", `status: "pending"`.

## Admin
- `/admin/users`: first combobox -> "Search by Email", placeholder `e.g., user@example.com`, button `SEARCH`. Row chip `PENDING` / `ACTIVE`.
- `VIEW` -> `/admin/users/:id`; status chip = element right after the "Account Status" label (CSS upper-cases it, compare case-insensitively).
- Activate: `Edit User` -> second combobox -> `Active` -> `Save Changes` (`PATCH /user/update/:id`, header `x-auth-secret-key` = `API_SECRET_KEY`).

## Money
- Cash In page `/agent/cash-in`: `input[name=customer]`, `input[name=amount]`.
- System -> Agent receipt: "SYSTEM deposit to Agent successful", `TRANSACTION ID`, `TOTAL AMOUNT ৳ 2000.00`.
- Agent -> Customer receipt: "Deposit successful". Agent earns **2.5 %** commission: 2000 − 500 + 12.50 = **1512.50**.
- Customers have a ~10,000 Tk cap ("Limit exceeded. You can deposit a maximum of X tk"), so `beforeAll` creates a new active Customer (or uses `EXISTING_CUSTOMER_PHONE`).
- Inactive recipient: "To account is not active. Please contact admin."
- Header "Balance" button shows `৳ <amount>`; reload first for a fresh number.

## Self Statement – `/agent/self-statement`
- Columns: Transaction ID, Sender Account, Receiver Account, Type, Debit, Credit, Balance, Date. Empty money cell is `-`.
- Agent: `Top-up from SYSTEM` (credit 2000), `Deposit Commission` (debit 500, credit 12.50). System: `System Deposit to Agent` (debit 2000).
- Date filter: `From Date` / `To Date` textboxes (`type=date`). The default is the **UTC** date, but rows are
  filtered by **local** date, so from 00:00 to 06:00 Dhaka time the default shows nothing.
  `StatementScreen.open()` sets both dates to `localDate()`.
- The paginator counts all-time rows, but each page only renders rows within the date filter. Rows are newest first, so stop at the first empty page (`StatementScreen.collectAll`).

## DOM quirks
- Sidebar rendered twice (drawer + permanent).
- User menu = last block of the header: Profile, Change Password, Logout -> `/login`.
