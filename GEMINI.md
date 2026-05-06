# Gemini CLI Project Context: Obento Ordering System

This file provides comprehensive context for the Gemini CLI agent to understand and interact with the Obento Ordering System project.

## Project Overview
The Obento Ordering System is a school-focused web application for managing bento (lunch box) reservations. Users (students/parents) can reserve lunches using pre-purchased 6-digit alphanumeric ticket numbers.

### Key Technologies
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4.
- **Backend/Platform:** Cloudflare Pages (Edge Runtime via `@cloudflare/next-on-pages`).
- **Database:** Cloudflare D1 (SQLite).
- **Storage:** Cloudflare R2 (for menu images).
- **Email:** Resend API for order confirmations.
- **Timezone:** Fixed to `Asia/Bangkok` (GMT+7) for all business logic.

## Project Structure
- `app/`: Next.js App Router pages and API routes.
  - `app/api/`: Backend logic for orders, menus, and admin functions.
  - `app/admin/`: Administrative dashboard for managing orders and menus.
- `components/`: Reusable React components (e.g., `order-form.js`, `admin-dashboard.js`).
- `lib/`: Core logic and utilities.
  - `lib/db.js`: Database abstraction layer (Cloudflare D1).
  - `lib/date.js`: Critical date/time logic, including timezone handling and order deadlines.
- `public/`: Static assets and local uploads (used during development).
- `wrangler.toml`: Cloudflare configuration for D1, R2, and environment variables.
- `schema.sql` / `seed.sql`: Database schema and initial data for Cloudflare D1.

## Core Business Logic
- **Timezone:** The system operates in GMT+7 (`Asia/Bangkok`).
- **Order Deadline:** Orders for the next day must be placed before **17:00** on the previous day.
- **Selectable Dates:** Users can only select future weekdays that are not holidays.
- **Ticket Numbers:** Validated as 6-digit uppercase alphanumeric strings (`/^[A-Z0-9]{6}$/`).
- **User Profiles:** Persisted in the browser's `localStorage` to simplify repeat orders.

## Building and Running
- **Local Development:** `npm run dev`
- **Build:** `npm run build`
- **Cloudflare Build:** `npm run pages:build` (uses `@cloudflare/next-on-pages`)
- **Local Preview:** `npm run preview` (builds and runs via `wrangler pages dev`)
- **Deployment:** `npm run deploy` (builds and deploys to Cloudflare Pages)
- **Database Migrations:** Use `wrangler d1 execute` for local/remote schema updates.

## Development Conventions
- **Edge Runtime:** Most API routes use `export const runtime = "edge";` for compatibility with Cloudflare Pages.
- **Database Access:** Always use the abstractions in `lib/db.js`. Ensure `process.env.DB` is correctly bound.
- **Date Handling:** Always use `lib/date.js` for date calculations and formatting to ensure consistency with the 17:00 deadline and GMT+7 timezone.
- **Types/Validation:** Strict validation is implemented in API routes (e.g., checking allowed grades/classes, ticket format, and deadlines).
- **Styling:** Tailwind CSS 4 is used for styling. Avoid inline styles where possible.

## Admin Features
- View daily order summaries and detailed lists.
- Export order data as CSV.
- Manage weekly menus (4 items per week with images, sizes, and options).
- Manage school holidays/closed days.
