# TBS Meridian — Backend Implementation Plan

Enable Lovable Cloud and wire four feature areas to the database. Frontend layout/copy stays as-is; we replace mock data with live queries and add auth gating.

## 1. Enable Lovable Cloud
Provisions Postgres, Auth, server functions, and the Supabase integration (browser client, server middleware, `_authenticated` gate).

## 2. Database schema (single migration)

```text
app_role         enum ('admin','manager','member','applicant')
application_status enum ('submitted','review','kyc','approved','rejected')
audit_event_type enum ('governance','treasury','membership','portfolio','kyc')

profiles         (id uuid PK → auth.users, full_name, email, created_at)
user_roles       (id, user_id, role, group_id, unique(user_id, role))
groups           (id, name, slug, description)            -- investment groups
applications     (id, user_id?, group_id, full_name, email, phone,
                  motivation, status, reviewer_id?, created_at, updated_at)
audit_events     (id, event_type, actor_id?, group_id?, title, description,
                  payload jsonb, hash text, prev_hash text, created_at)
portfolio_assets (id, group_id, name, asset_type, location, acquisition_date,
                  acquisition_value numeric, current_value numeric,
                  target_irr numeric, realized_irr numeric, status)
reports          (id, group_id, period date, nav numeric, distributions numeric,
                  contributions numeric, irr numeric)
```

GRANTs + RLS on every public table. `has_role(uuid, app_role)` security-definer fn. Policies:
- profiles: self read/update; admins read all.
- applications: applicant inserts own (or anon submits with null user_id); admin/manager read+update.
- audit_events / portfolio_assets / reports: any authenticated member of the group reads; admin writes.
- groups: authenticated read.

Trigger on `auth.users` insert → create profile + assign `applicant` role.

Seed (in migration): one default group "TBS Meridian Fund I", a few portfolio assets, sample report periods, and a couple of audit events — so the UI renders immediately.

## 3. Authentication
- `/auth` route: email+password sign in/up tabs. Google OAuth button via `lovable.auth.signInWithOAuth`.
- Configure Google provider via `supabase--configure_social_auth`.
- Sign-out hygiene per guidance (cancel queries, clear cache, signOut, navigate replace).
- Header on `/`: shows "Sign in" or user menu (name + sign out + "Portal" link).

## 4. Protected routes
Under `src/routes/_authenticated/`:
- `portal.tsx` — member dashboard: their group, holdings summary, recent audit events, latest report.
- `manager.tsx` — gated by `has_role(admin|manager)`: applications queue with status workflow (submitted → review → kyc → approved/rejected), portfolio editor table.

## 5. Application form
- Rebuild membership "Apply" section as a real form (zod-validated: name, email, phone, motivation, group select).
- `submitApplication` server function inserts into `applications` (status='submitted'). Works for anon and signed-in users; links to `user_id` when present. Also writes an `audit_events` row (type=membership).

## 6. Audit-trail drawer
- Replace mock list with a shadcn `Sheet` drawer triggered from existing governance section.
- Server fn `listAuditEvents({ groupId, limit })` returns latest events with actor name joined from profiles. Public events readable by anyone authenticated; manager view sees all.
- Render with `event_type` badge using existing status color tokens.

## 7. Portfolio + Reports with charts
- Server fns `listPortfolio(groupId)` and `listReports(groupId)`.
- Replace static portfolio table with live data; keep existing styling.
- Add Reports section with two recharts charts using CSS color tokens (`hsl(var(--primary))`, `--accent`, `--muted-foreground`):
  - NAV over time (line chart)
  - Contributions vs distributions per period (bar chart)
- `recharts` is already in the template; no new dep.

## Technical notes
- All Supabase reads go through `createServerFn` (public reads use server publishable client; user-scoped reads use `requireSupabaseAuth`).
- `supabaseAdmin` only inside handler bodies, imported via `await import(...)`, for the membership insert (so anon submissions bypass RLS safely) — guarded by zod validation + rate-limit-friendly shape.
- TanStack Query: `ensureQueryData` in loaders, `useSuspenseQuery` in components.
- No new design tokens; charts and badges reuse existing palette.

## Out of scope
- Email notifications, KYC document upload, payments, real-time subscriptions, role self-service. Roles assigned manually via SQL/admin UI for now.
