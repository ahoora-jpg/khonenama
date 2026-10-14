# Receipt printer and subscription ticket

Sources reviewed: https://www.dqnamo.com/experiments/receipt-printer and https://www.dqnamo.com/experiments/ticket.
Implementation: independent React/CSS; no provider source copied, no dependencies installed. Commercial source license was not conclusively established.
Routes: /billing/result and /dashboard/billing (owner session required).
Data: existing private billing history; payment_status=verified, nonempty provider reference, and verified_at are required for a receipt. Query parameters cannot establish success. Amount, date, invoice, plan and expiry come from server records. Verified payment and subscription activation are distinguished.
Ticket: purchased subscription details/expiry only. No invented discounts, advertisement credit or verified-business status.
Controls: open/close receipt, browser print/save PDF, server reconciliation for pending invoices. No change to gateway, price, activation, deletion or upload processes.
Motion: 1.5-second CSS paper feed; static reduced-motion mode; subtle hover ticket tilt. Scoped print CSS prints the selected receipt only. No continuous animation or large assets.
Validation: TypeScript; existing billing regression suite; verified/pending/failed/missing-reference receipt eligibility; 320/390/1280 layouts; print and reduced-motion checks. Synthetic fixtures used only in local tests, never persisted or shipped as payment records.
Remaining: actual gateway payment and phone owner-session test require a genuine transaction/session; not simulated as a real successful payment.
Rollback: revert this UI commit. Pre-change files and unpublished diff saved in C:/Users/Apadana/Documents/Codex/khonenama-ui-backup-20261014.
