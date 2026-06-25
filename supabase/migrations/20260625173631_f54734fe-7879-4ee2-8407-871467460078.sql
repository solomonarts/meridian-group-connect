
-- Extend groups
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS slot_capacity integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS subscription_terms text,
  ADD COLUMN IF NOT EXISTS slot_price numeric;

UPDATE public.groups SET slot_capacity = 100 WHERE slot_capacity IS NULL;

-- Enums
DO $$ BEGIN CREATE TYPE deal_status AS ENUM ('draft','open','closed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending','submitted','verified','paid','overdue','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE poll_status AS ENUM ('open','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE allocation_status AS ENUM ('requested','approved','committed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE doc_event_type AS ENUM ('uploaded','viewed','downloaded','signed','revoked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE leadership_role AS ENUM ('chair','secretary','treasurer','leader'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE deal_vote AS ENUM ('yes','no','abstain'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpers (security definer)
CREATE OR REPLACE FUNCTION public.is_group_member(_uid uuid, _group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND group_id = _group_id)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role IN ('admin','manager') AND group_id IS NULL);
$$;

CREATE OR REPLACE FUNCTION public.has_group_role(_uid uuid, _role app_role, _group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role = _role AND (group_id = _group_id OR group_id IS NULL)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_system_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_group_manager(_uid uuid, _group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid, 'admin') OR public.has_group_role(_uid, 'manager', _group_id);
$$;

GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.has_group_role(uuid, app_role, uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_system_admin(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_group_manager(uuid, uuid) TO authenticated, anon, service_role;

-- 1) leadership_positions
CREATE TABLE public.leadership_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position leadership_role NOT NULL DEFAULT 'leader',
  appointed_at timestamptz NOT NULL DEFAULT now(),
  appointed_by uuid REFERENCES auth.users(id),
  UNIQUE(group_id, user_id, position)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leadership_positions TO authenticated;
GRANT ALL ON public.leadership_positions TO service_role;
ALTER TABLE public.leadership_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leadership read" ON public.leadership_positions FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "leadership manage" ON public.leadership_positions FOR ALL TO authenticated USING (public.is_group_manager(auth.uid(), group_id)) WITH CHECK (public.is_group_manager(auth.uid(), group_id));

CREATE OR REPLACE FUNCTION public.is_group_leader(_uid uuid, _group_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.leadership_positions WHERE user_id = _uid AND group_id = _group_id);
$$;
GRANT EXECUTE ON FUNCTION public.is_group_leader(uuid, uuid) TO authenticated, anon, service_role;

-- 2) deals
CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  asset_type text,
  location text,
  target_amount numeric,
  slot_count integer NOT NULL DEFAULT 0,
  slot_price numeric,
  status deal_status NOT NULL DEFAULT 'draft',
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals read" ON public.deals FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "deals manage" ON public.deals FOR ALL TO authenticated USING (public.is_group_manager(auth.uid(), group_id)) WITH CHECK (public.is_group_manager(auth.uid(), group_id));
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) deal_votes
CREATE TABLE public.deal_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote deal_vote NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_votes TO authenticated;
GRANT ALL ON public.deal_votes TO service_role;
ALTER TABLE public.deal_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_votes read" ON public.deal_votes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND (public.is_group_manager(auth.uid(), d.group_id) OR user_id = auth.uid())));
CREATE POLICY "deal_votes insert own" ON public.deal_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.deals d WHERE d.id = deal_id AND public.is_group_member(auth.uid(), d.group_id)));
CREATE POLICY "deal_votes update own" ON public.deal_votes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4) slot_allocations + approvals
CREATE TABLE public.slot_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slots_requested integer NOT NULL CHECK (slots_requested > 0),
  status allocation_status NOT NULL DEFAULT 'requested',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slot_allocations TO authenticated;
GRANT ALL ON public.slot_allocations TO service_role;
ALTER TABLE public.slot_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alloc read" ON public.slot_allocations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_group_manager(auth.uid(), group_id) OR public.is_group_leader(auth.uid(), group_id));
CREATE POLICY "alloc insert own" ON public.slot_allocations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_group_member(auth.uid(), group_id));
CREATE POLICY "alloc manage" ON public.slot_allocations FOR UPDATE TO authenticated USING (public.is_group_manager(auth.uid(), group_id)) WITH CHECK (public.is_group_manager(auth.uid(), group_id));
CREATE POLICY "alloc delete mgr" ON public.slot_allocations FOR DELETE TO authenticated USING (public.is_group_manager(auth.uid(), group_id));
CREATE TRIGGER alloc_updated_at BEFORE UPDATE ON public.slot_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.allocation_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id uuid NOT NULL REFERENCES public.slot_allocations(id) ON DELETE CASCADE,
  leader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(allocation_id, leader_id)
);
GRANT SELECT, INSERT, DELETE ON public.allocation_approvals TO authenticated;
GRANT ALL ON public.allocation_approvals TO service_role;
ALTER TABLE public.allocation_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approval read" ON public.allocation_approvals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.slot_allocations a WHERE a.id = allocation_id AND (public.is_group_manager(auth.uid(), a.group_id) OR public.is_group_leader(auth.uid(), a.group_id) OR a.user_id = auth.uid())));
CREATE POLICY "approval insert leader" ON public.allocation_approvals FOR INSERT TO authenticated
  WITH CHECK (leader_id = auth.uid() AND EXISTS (SELECT 1 FROM public.slot_allocations a WHERE a.id = allocation_id AND public.is_group_leader(auth.uid(), a.group_id)));

-- Auto-approve at 3 leader approvals
CREATE OR REPLACE FUNCTION public.recompute_allocation_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c integer;
BEGIN
  SELECT COUNT(*) INTO c FROM public.allocation_approvals WHERE allocation_id = NEW.allocation_id;
  IF c >= 3 THEN
    UPDATE public.slot_allocations SET status = 'approved', updated_at = now()
      WHERE id = NEW.allocation_id AND status = 'requested';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER allocation_approvals_recompute AFTER INSERT ON public.allocation_approvals
  FOR EACH ROW EXECUTE FUNCTION public.recompute_allocation_status();

-- 5) payments + audit
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  description text,
  due_at timestamptz,
  status payment_status NOT NULL DEFAULT 'pending',
  proof_path text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments read" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_group_manager(auth.uid(), group_id));
CREATE POLICY "payments manage" ON public.payments FOR ALL TO authenticated
  USING (public.is_group_manager(auth.uid(), group_id))
  WITH CHECK (public.is_group_manager(auth.uid(), group_id));
CREATE POLICY "payments submit proof" ON public.payments FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  from_status payment_status,
  to_status payment_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payment_audit TO authenticated;
GRANT ALL ON public.payment_audit TO service_role;
ALTER TABLE public.payment_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay_audit read" ON public.payment_audit FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.payments p WHERE p.id = payment_id AND (p.user_id = auth.uid() OR public.is_group_manager(auth.uid(), p.group_id))));

CREATE OR REPLACE FUNCTION public.payments_audit_trigger()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.payment_audit(payment_id, actor_id, from_status, to_status)
      VALUES (NEW.id, auth.uid(), NULL, NEW.status);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.payment_audit(payment_id, actor_id, from_status, to_status)
      VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payments_audit_ins AFTER INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.payments_audit_trigger();
CREATE TRIGGER payments_audit_upd AFTER UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.payments_audit_trigger();

-- 6) polls
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  question text NOT NULL,
  description text,
  status poll_status NOT NULL DEFAULT 'open',
  closes_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0
);
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_votes TO authenticated;
GRANT ALL ON public.polls, public.poll_options, public.poll_votes TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls read" ON public.polls FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "polls manage" ON public.polls FOR ALL TO authenticated USING (public.is_group_manager(auth.uid(), group_id)) WITH CHECK (public.is_group_manager(auth.uid(), group_id));
CREATE POLICY "options read" ON public.poll_options FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_group_member(auth.uid(), p.group_id)));
CREATE POLICY "options manage" ON public.poll_options FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_group_manager(auth.uid(), p.group_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_group_manager(auth.uid(), p.group_id)));
CREATE POLICY "votes read" ON public.poll_votes FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_group_manager(auth.uid(), p.group_id)));
CREATE POLICY "votes insert own" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.status = 'open' AND public.is_group_member(auth.uid(), p.group_id)));

-- 7) announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT, INSERT ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcements, public.announcement_reads TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann read" ON public.announcements FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "ann manage" ON public.announcements FOR ALL TO authenticated USING (public.is_group_manager(auth.uid(), group_id)) WITH CHECK (public.is_group_manager(auth.uid(), group_id));
CREATE POLICY "ann_reads read" ON public.announcement_reads FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = announcement_id AND public.is_group_manager(auth.uid(), a.group_id)));
CREATE POLICY "ann_reads insert" ON public.announcement_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 8) documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  requires_signature boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);
CREATE TABLE public.document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  event_type doc_event_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT ON public.document_signatures TO authenticated;
GRANT SELECT, INSERT ON public.document_events TO authenticated;
GRANT ALL ON public.documents, public.document_signatures, public.document_events TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc read" ON public.documents FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "doc manage" ON public.documents FOR ALL TO authenticated USING (public.is_group_manager(auth.uid(), group_id)) WITH CHECK (public.is_group_manager(auth.uid(), group_id));
CREATE POLICY "sig read" ON public.document_signatures FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.is_group_manager(auth.uid(), d.group_id)));
CREATE POLICY "sig insert own" ON public.document_signatures FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ev read" ON public.document_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.is_group_manager(auth.uid(), d.group_id)));
CREATE POLICY "ev insert" ON public.document_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- RPCs
CREATE OR REPLACE FUNCTION public.group_slot_availability(_group_id uuid)
RETURNS TABLE(total integer, allocated integer, available integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    g.slot_capacity,
    COALESCE((SELECT SUM(slots_requested) FROM public.slot_allocations WHERE group_id = _group_id AND status IN ('approved','committed')), 0)::int,
    (g.slot_capacity - COALESCE((SELECT SUM(slots_requested) FROM public.slot_allocations WHERE group_id = _group_id AND status IN ('approved','committed')), 0))::int
  FROM public.groups g WHERE g.id = _group_id;
$$;

CREATE OR REPLACE FUNCTION public.deal_vote_tally(_deal_id uuid)
RETURNS TABLE(yes integer, no integer, abstain integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE(SUM((vote='yes')::int),0)::int,
    COALESCE(SUM((vote='no')::int),0)::int,
    COALESCE(SUM((vote='abstain')::int),0)::int
  FROM public.deal_votes WHERE deal_id = _deal_id;
$$;

CREATE OR REPLACE FUNCTION public.deal_slot_availability(_deal_id uuid)
RETURNS TABLE(total integer, allocated integer, available integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    d.slot_count,
    COALESCE((SELECT SUM(slots_requested) FROM public.slot_allocations WHERE deal_id = _deal_id AND status IN ('approved','committed')),0)::int,
    (d.slot_count - COALESCE((SELECT SUM(slots_requested) FROM public.slot_allocations WHERE deal_id = _deal_id AND status IN ('approved','committed')),0))::int
  FROM public.deals d WHERE d.id = _deal_id;
$$;

CREATE OR REPLACE FUNCTION public.poll_vote_tally(_poll_id uuid)
RETURNS TABLE(option_id uuid, label text, votes integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.label, COALESCE(COUNT(v.id),0)::int
  FROM public.poll_options o
  LEFT JOIN public.poll_votes v ON v.option_id = o.id
  WHERE o.poll_id = _poll_id
  GROUP BY o.id, o.label, o.position
  ORDER BY o.position;
$$;

GRANT EXECUTE ON FUNCTION public.group_slot_availability(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deal_vote_tally(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deal_slot_availability(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.poll_vote_tally(uuid) TO authenticated, service_role;
