# Manager Dashboard — End-to-End Build Plan

Scope: 13 modules, single-group (TBS Meridian Fund I), storage included.
Approach: ship in 5 migration+code phases so each phase is reviewable and the app stays green between them.

## Phase 1 — Schema foundations (1 migration)

New enums and tables in `public`, all with RLS + GRANTs.

- Enums: `deal_status` (draft|open|closed), `payment_status` (pending|submitted|verified|paid|overdue|cancelled), `poll_status` (open|closed), `allocation_status` (requested|approved|committed|cancelled), `doc_event_type`.
- Tables: `leadership_positions`, `deals`, `slot_allocations`, `payments`, `payment_audit`, `polls`, `poll_options`, `poll_votes`, `announcements`, `announcement_reads`, `documents`, `document_signatures`, `document_events`, `deal_votes`.
- Extend existing: add `slot_capacity`, `subscription_terms` to `groups`; add `manager` capability fields to `portfolio_assets` if missing.
- New role enum value `manager` already exists; ensure `applicant`, `member`, `manager`, `admin` covered.

## Phase 2 — RPCs, triggers, storage (1 migration + 2 buckets)

- RPCs (SECURITY DEFINER, search_path=public):
  - `has_group_role(uid, role, group_id)`
  - `is_system_admin(uid)`
  - `is_group_leader(uid, group_id)`
  - `group_slot_availability(group_id)` → { total, allocated, available }
  - `deal_vote_tally(deal_id)`
  - `deal_slot_availability(deal_id)`
  - `poll_vote_tally(poll_id)`
- Trigger: `recompute_allocation_status` (3 leader approvals → status='approved').
- Audit trigger on `payments` → `payment_audit`.
- Storage buckets (private): `payment-proofs`, `group-documents`. RLS on `storage.objects` scoped by group membership/manager role.

## Phase 3 — Server functions layer

Create `src/lib/manager.functions.ts` and `src/lib/manager.server.ts`:

- Overview: `getOverview`, `listManagedGroups`
- Members: `listMembers`, `addMemberByEmail`*, `removeMember`*
- Applications: already exists — extend with audit
- Leadership: `listLeadership`, `setLeadership`*
- Deals: `listDeals`, `createDeal`, `updateDealStatus`, `getDealDetail`
- Allocations: `listAllocations`, `decideAllocation`*, `commitAllocation`*, `cancelAllocation`*
- Payments: `listPayments`, `createPayment`, `updatePaymentStatus`, `getPaymentProofUrl`, `listPaymentAudit`
- Polls: `listPolls`, `createPoll`, `closePoll`
- Announcements: `listAnnouncements`, `createAnnouncement`, `deleteAnnouncement`
- Documents: `listDocuments`, `createDocument` (upload), `toggleDocumentSignature`, `getDocumentDownloadUrl`
- Portfolio: `createAsset`, `updateAsset`, `deleteAsset` (read already exists)
- Settings: `getGroupSettings`, `updateGroupSettings`

`*` = privileged ops requiring service-role (lazy-import `client.server` inside handler, after `has_role('manager')` check). No separate edge function — TanStack server fns are the boundary.

## Phase 4 — Manager UI routes

Replace single `/manager` with nested routes under `_authenticated/manager/`:

```
manager/index.tsx          → Overview dashboard (KPIs + charts, real data)
manager/members.tsx        → Member list + add/remove
manager/applications.tsx   → Existing queue (moved)
manager/leadership.tsx     → Appoint leaders
manager/deals.tsx          → Deals CRUD + vote tallies
manager/allocations.tsx    → Slot requests review
manager/payments.tsx       → Payments + proof verification
manager/polls.tsx          → Polls CRUD + tallies
manager/announcements.tsx  → Broadcast + read receipts
manager/documents.tsx      → Upload + signature tracking
manager/portfolio.tsx      → Asset CRUD
manager/settings.tsx       → Group metadata
```

Update `DashboardShell` nav to expose all manager links (replacing today's disabled placeholders) — gated by manager role.

## Phase 5 — Polish

- Toast feedback on every mutation.
- Audit events recorded for: application decisions, allocation decisions, payment status, document signatures, leadership changes.
- Empty-state UI for every list.
- Seed data: 2 deals, 1 open poll, 1 announcement, 2 payments, 3 portfolio assets (extend existing seed).

## Out of scope (explicit)

- Member-facing /portal counterparts to vote/sign/upload-proof — manager side first; member side flagged for follow-up.
- Email notifications.
- Pagination (lists assumed < 200 rows per group).

## Technical notes

- All privileged writes use `requireSupabaseAuth` + `has_role` check before lazy-importing `supabaseAdmin`.
- Storage RLS: manager can read/write within their group prefix `{group_id}/...`; members can upload to `payment-proofs/{group_id}/{user_id}/...`.
- Charts reuse existing recharts patterns from current portal.
- Group switcher deliberately omitted (single-group answer).
- This plan touches no member-facing public routes.

Ready to start with Phase 1 migration on approval.
