# Rivo — Fees in Flow 🌊

> **A real, mobile-first fee reconciliation and bookkeeping platform for dance academies, music schools, tuition centres, and small educational academies.**

[![Build & Test Status](https://img.shields.io/badge/tests-18%20passed-15966A.svg)](file:///c:/Keerthu/Rivo/server/src/tests/reconciliation.test.ts)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-18392D.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19-15966A.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/database-MongoDB%20Atlas-15966A.svg)](https://www.mongodb.com/atlas)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Product Vision & Core Promise

Our first use case is an Indian classical dance teacher (e.g. *Ananya Natarajan* at *Nrityanjali Dance Academy*) who:
- Teaches 60+ students across multiple batches (Beginners, Intermediate, Weekend Folk, Kids Movement).
- Communicates with parents via existing WhatsApp batch groups.
- Receives monthly tuition fees via direct UPI (GPay, PhonePe, Paytm, Netbanking).
- Gets flooded every month with payment screenshots, WhatsApp confirmation texts, and fragmented student names.
- Struggles with **combined sibling payments** (e.g., a parent sends ₹3,000 covering two siblings with ₹1,500 fees each in one UPI transaction).
- Does **not** want to force parents onto new apps or change how she collects money.

### Core Product Guarantee
> **Rivo is a bookkeeping and reconciliation tool.**
>
> **Rivo NEVER initiates, redirects, holds, or transfers money.**
>
> **Rivo NEVER claims that a payment succeeded merely because a screenshot, WhatsApp message, or AI model says so.**
>
> The system strictly distinguishes between a **Claimed Payment**, a **Matched Payment**, and a **Verified Payment**.

---

## 2. Visual Identity & Brand Palette

- **Brand Name**: Rivo
- **Tagline**: *"Fees in flow."*
- **Design Philosophy**: Clean white + mint green. High-contrast typography, generous spacing, restrained elevation, and mobile-first responsive layout (360px+ viewport on Android phones).
- **Curated Palette**:
  - Primary White: `#FFFFFF`
  - Soft Mint: `#DDF7E9`
  - Pale Background: `#F7FCF9`
  - Primary Green: `#15966A`
  - Deep Forest: `#18392D`
  - Main Text: `#26352E`
  - Muted Text: `#718078`
  - Borders: `#E2EBE5`
  - Warning Amber: `#B7791F`
  - Error Red: `#C24141`

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, Recharts.
- **Backend**: Node.js, Express, TypeScript, MongoDB Atlas, Mongoose, Zod validation, bcryptjs, JWT authentication, Multer.
- **AI Inference**: Gemma-compatible inference endpoint adapter with a deterministic regex/rule-based fallback.
- **Deployment**: Render Web Service + MongoDB Atlas.
- **Testing**: Vitest test runner executing 18 business rule test suites against live MongoDB Atlas.

---

## 4. Architectural Highlights

### A. Sibling & Multi-Month Allocation Engine
When a parent pays ₹3,000 for two siblings with ₹1,500 fees each:
1. Rivo records **ONE** verified `PaymentTransaction` record.
2. The teacher allocates ₹1,500 to Student A's `FeeObligation` and ₹1,500 to Student B's `FeeObligation`.
3. Separate `PaymentAllocation` records link the transaction to both obligations.
4. Total allocated amount cannot exceed eligible transaction value.
5. Reversing a transaction safely unwinds all allocations, recalculates obligation balances, and logs an immutable audit event.

### B. Gemma AI Extraction with Deterministic Fallback
- Accepts raw WhatsApp text or screenshot receipts.
- Structured candidate schema: `student_names`, `claimed_amount`, `claimed_date`, `claimed_transaction_reference`, `confidence`, `missing_fields`, `explanation`.
- Treated as **untrusted candidate input**; screenshots alone never mark fees as paid.
- When `GEMMA_API_URL` is configured, invokes the Gemma inference model; otherwise, seamlessly uses local rule-based extraction.

### C. WhatsApp & Android Integration: Honest Realities
- **No Unofficial Scraping**: Personal WhatsApp accounts do not offer an official cloud group-scraping API. Rivo provides a fast mobile "Share to Rivo" evidence-entry flow without violating WhatsApp Terms of Service.
- **Android Companion App**: Includes an optional native Kotlin module (`android-companion/`) utilizing Android's `NotificationListenerService`. Requires explicit user permission in Android settings, filters strictly for WhatsApp payment notifications, and never accesses full chat history.

---

## 5. 10-Step Guided Demo Walkthrough for Judges

A complete demo academy (**Nrityanjali Dance Academy**) is pre-configured with realistic fictional data.

1. **Open the App**: Navigate to `http://localhost:5000/` (or the deployed Render URL).
2. **One-Click Demo Access**: On the login screen, click the prominent **"Explore Demo Academy Now"** button. You are instantly signed in as *Ananya Natarajan*.
3. **Inspect the Dashboard**:
   - Month selector displays live calculations for October 2026.
   - See ₹23,000 expected, ₹5,500 verified collected, ₹17,500 outstanding, and 2 payments awaiting review.
   - View Recharts bar charts for monthly trends and batch collections.
4. **Inspect Students & Batches**:
   - Go to **Students & Batches** tab.
   - Observe 14 students across 4 batches.
   - Click **Sibling Families** tab to see the *Patel Family* (Diya & Neil) and *Iyer Family* (Aditi & Meenakshi).
5. **Open the Monthly Ledger**:
   - Click **Monthly Ledger**.
   - Review each student's amount due, verified collected, and status (`Paid`, `Partially Paid`, `Unpaid`).
   - Click **"Generate Obligations"** — observe that running it twice is **idempotent** and never creates duplicate fees!
6. **Record Payment Evidence ("Share to Rivo")**:
   - Click **Share to Rivo** in the sidebar or center mobile nav.
   - Click the "Sibling Sample" quick button to populate a WhatsApp message:
     `Transferred ₹3,000 for Diya and Neil Patel monthly dance classes. UTR 428719283742`
   - Click **Extract Fields with Gemma / Rules** and view candidate fields side-by-side with confidence scores.
   - Save the claim. Notice that it remains unverified until matched with a bank statement!
7. **Import Bank Statement CSV**:
   - Go to **Bank Transactions** > click **Import CSV**.
   - Click **"Load Demo CSV"** to preview transactions with row-level validation.
   - Confirm import and observe duplicate detection skipping already-imported references.
8. **Allocate Sibling Payments**:
   - In **Bank Transactions**, locate the ₹3,000 transaction from Rajesh Patel.
   - Click **Allocate Sibling** to split ₹1,500 to Diya Patel and ₹1,500 to Neil Patel.
9. **Inspect the Exception Queue**:
   - Click **Exception Queue** to review active reconciliation anomalies:
     - *Unknown Student* (parent paid for "Kavya" who is not in academy roster).
     - *Amount Mismatch* (parent claimed ₹2,000 but bank received ₹1,500).
     - *Evidence Without Transaction* (receipt submitted without matching bank statement credit).
   - Click **Take Action / Resolve** on any case to link to a student, verify manually with an audited reason, or dismiss duplicates.
10. **View Immutable Audit Trail & Reports**:
    - Click **Reports & Export** to download CSV summaries.
    - Click **Audit Trail** to see a tamper-evident timeline of all teacher decisions.
    - Click **"Reset Demo Data"** in the top navigation anytime to restore the default evaluation state.

---

## 6. Sample Assets & Demo Files

- **Sample CSV Statement**: [`sample_bank_statement.csv`](file:///c:/Keerthu/Rivo/sample_bank_statement.csv)
- **Synthetic Watermarked Payment Receipt**: [`demo_payment_receipt.svg`](file:///c:/Keerthu/Rivo/demo_payment_receipt.svg) (Watermarked `DEMO — NOT A REAL PAYMENT`)
- **Android Companion Module**: [`android-companion/NotificationCompanionService.kt`](file:///c:/Keerthu/Rivo/android-companion/NotificationCompanionService.kt)

---

## 7. Automated Test Suite (18/18 Passing)

Rivo includes automated business rule tests covering all core edge cases:

```bash
cd server
npm test
```

### Verified Test Cases:
1. `✓` One student pays the full monthly fee.
2. `✓` One student makes a partial payment.
3. `✓` Parent pays ₹3,000 for two siblings with ₹1,500 fees each.
4. `✓` Payment covers multiple billing months (advance payment).
5. `✓` Unknown payer is sent to the exception queue.
6. `✓` Screenshot alone does not mark an obligation as paid.
7. `✓` Duplicate transaction references do not double-count a payment.
8. `✓` Re-importing the same CSV does not create duplicate transactions.
9. `✓` A payment cannot be allocated beyond its transaction amount.
10. `✓` An amount mismatch is flagged in the exception queue.
11. `✓` A failed payment does not count as collected.
12. `✓` A reversed payment unwinds allocations, updates ledger, and creates an audit event.
13. `✓` Monthly obligation generation is idempotent.
14. `✓` An allocation failure does not partially update related records.
15. `✓` Tenant isolation: Teacher B cannot allocate or reverse Teacher A transactions.
16. `✓` AI failure gracefully falls back to deterministic rule-based extractor without breaking submission.
17. `✓` A manual verification records the actor and reason in transaction and audit history.
18. `✓` A CSV containing invalid rows produces clear row-level errors without halting valid rows.

---

## 8. Local Installation & Development

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- MongoDB Atlas cluster URI

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/SK-Sathyavada-008/rivo.git
cd rivo
npm --prefix server install
npm --prefix client install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `server/.env` and configure your MongoDB URI:
```bash
cp .env.example server/.env
```

### Step 3: Seed Demo Academy Data
```bash
npm run seed
```

### Step 4: Run Locally
```bash
# Option A: Start production unified server (Client + Backend on Port 5000)
npm run build
npm start

# Option B: Run development servers concurrently
npm run dev:server   # Express API on http://localhost:5000
npm run dev:client   # Vite dev server on http://localhost:5173
```

---

## 9. Deployment to Render & MongoDB Atlas

### Render Single Web Service Deployment:
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New + > Web Service** (or use the Blueprint from `render.yaml`).
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `npm run start`
5. Configure Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `<Your MongoDB Atlas Replica Set Connection String>`
   - `JWT_SECRET`: `<Long random secret key>`
   - `CLIENT_URL`: `https://your-service.onrender.com`
   - `GEMMA_API_URL`: Optional (for external Gemma inference endpoint)
   - `GEMMA_API_KEY`: Optional
   - `SENTRY_DSN`: Optional

---

## 10. License

MIT License. Designed and built with pride for the DEV Challenge.