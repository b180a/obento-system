# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js App Router project for bento ordering, with Cloudflare Pages deployment. UI entry points live in `app/`: `app/page.js` serves the customer form, `app/admin/page.js` serves the admin screen, and `app/api/**/route.js` contains server endpoints for orders, menus, holidays, exports, and image uploads. Shared React UI lives in `components/`, and shared business logic and D1 access live in `lib/`. Database schema and seed data are in `schema.sql` and `seed.sql`. Static uploads are stored under `public/uploads/`.

## Build, Test, and Development Commands
Use `npm run dev` to start local Next.js development. Use `npm run build` to create a production build and `npm run start` to serve it locally. Use `npm run pages:build` to generate the Cloudflare Pages bundle with `@cloudflare/next-on-pages`. Use `npm run preview` to build and run the Pages output with Wrangler, and `npm run deploy` to publish that output.

## Coding Style & Naming Conventions
Follow the existing style: JavaScript modules, 2-space indentation, semicolons, and double quotes. Components use lowercase file names with hyphens such as `components/order-form.js`; exported React components use PascalCase such as `OrderForm` and `AdminDashboard`. Keep utility helpers in `lib/`, and keep route handlers scoped to the feature path under `app/api/`. Prefer small, focused functions over large inline handlers.

## Testing Guidelines
There is currently no automated test suite or lint script in `package.json`. Before opening a PR, run `npm run build` and exercise the main flows manually: customer order submission, admin menu updates, holiday management, and Cloudflare preview via `npm run preview`. When adding tests later, keep them close to the feature and use `*.test.js` naming.

## Commit & Pull Request Guidelines
Local Git history is not available in this workspace, so no repository-specific commit convention could be verified. Use short, imperative commit subjects such as `Add holiday validation to order route`. PRs should include a concise summary, affected routes or screens, any schema or environment changes, and screenshots for UI changes. If a change touches D1, R2, or Resend configuration, call that out explicitly.

## Security & Configuration Tips
Keep secrets in `.env.local` for local work and in Wrangler/Cloudflare config for deployment. Review `wrangler.toml` before changing bindings like `DB` or `obento_images`, and avoid committing real credentials or exported user data.
