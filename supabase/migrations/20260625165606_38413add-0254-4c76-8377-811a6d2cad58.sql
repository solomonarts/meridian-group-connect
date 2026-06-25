
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin','manager','member','applicant');
CREATE TYPE public.application_status AS ENUM ('submitted','review','kyc','approved','rejected');
CREATE TYPE public.audit_event_type AS ENUM ('governance','treasury','membership','portfolio','kyc');
CREATE TYPE public.asset_status AS ENUM ('owned','under_review','target','partner');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.groups TO anon, authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups readable by all" ON public.groups FOR SELECT USING (true);

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profile self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, group_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
          NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'applicant')
    ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT,
  slots_requested INTEGER,
  motivation TEXT,
  status public.application_status NOT NULL DEFAULT 'submitted',
  reviewer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicants read own" ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "Applicants insert own" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Managers update" ON public.applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- audit_events
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type public.audit_event_type NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_events TO anon, authenticated;
GRANT INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit readable" ON public.audit_events FOR SELECT USING (true);
CREATE POLICY "Audit managers write" ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- portfolio_assets
CREATE TABLE public.portfolio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  location TEXT,
  description TEXT,
  acquisition_value NUMERIC,
  current_value NUMERIC,
  income_type TEXT,
  allocation_pct NUMERIC,
  status public.asset_status NOT NULL DEFAULT 'target',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.portfolio_assets TO authenticated;
GRANT ALL ON public.portfolio_assets TO service_role;
ALTER TABLE public.portfolio_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portfolio readable" ON public.portfolio_assets FOR SELECT USING (true);
CREATE POLICY "Portfolio managers write" ON public.portfolio_assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  period DATE NOT NULL,
  nav NUMERIC NOT NULL DEFAULT 0,
  contributions NUMERIC NOT NULL DEFAULT 0,
  distributions NUMERIC NOT NULL DEFAULT 0,
  irr NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, period)
);
GRANT SELECT ON public.reports TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reports readable" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Reports managers write" ON public.reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));

-- Seed default group + sample data
INSERT INTO public.groups (id, name, slug, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'TBS Meridian Fund I', 'meridian-fund-i',
        'Founding-phase investment group for the Meridian portfolio.');

INSERT INTO public.portfolio_assets (group_id, name, asset_type, location, description, acquisition_value, current_value, income_type, allocation_pct, status) VALUES
('00000000-0000-0000-0000-000000000001','Pieme Hotel Residence Units','Hotel units','Busukuma, Uganda','Two hotel residence units offered for member review through a strategic partner opportunity.',200000,210000,'Daily hospitality income',12,'under_review'),
('00000000-0000-0000-0000-000000000001','Kulambiro Condominiums','Condominiums','Kampala, Uganda','Condominium assets connected to the Pieme offer as a bonus value enhancement.',80000,85000,'Monthly rental income',12,'owned'),
('00000000-0000-0000-0000-000000000001','Future Uganda Property 1','Commercial income asset','Uganda','Future domestic property target selected for cash-flow potential and member review.',NULL,NULL,'Monthly tenant income',NULL,'target'),
('00000000-0000-0000-0000-000000000001','Future Uganda Property 2','Mixed-use property','Uganda','Prospective asset for the next phase of the portfolio.',NULL,NULL,'Daily or monthly cash flow',NULL,'target');

INSERT INTO public.reports (group_id, period, nav, contributions, distributions, irr) VALUES
('00000000-0000-0000-0000-000000000001','2025-01-01',250000,250000,0,0),
('00000000-0000-0000-0000-000000000001','2025-04-01',268000,10000,2000,8.4),
('00000000-0000-0000-0000-000000000001','2025-07-01',285000,5000,4500,9.1),
('00000000-0000-0000-0000-000000000001','2025-10-01',302000,8000,6000,10.2),
('00000000-0000-0000-0000-000000000001','2026-01-01',318000,4000,7500,11.0),
('00000000-0000-0000-0000-000000000001','2026-04-01',335000,6000,8200,11.6);

INSERT INTO public.audit_events (event_type, actor_name, group_id, title, description) VALUES
('governance',  'Chairperson',           '00000000-0000-0000-0000-000000000001','Founding charter ratified','Members approved the founding charter with 92% supermajority.'),
('portfolio',   'Investment Committee',  '00000000-0000-0000-0000-000000000001','Pieme Hotel Units entered review','Two hotel residence units accepted into member review with a 30-day window.'),
('treasury',    'Treasury Lead',         '00000000-0000-0000-0000-000000000001','Q1 distribution issued','Quarterly distribution paid to slot holders per allocation.'),
('membership',  'Admissions',            '00000000-0000-0000-0000-000000000001','Founding member admitted','New founding member admitted following KYC verification.'),
('kyc',         'Compliance',            '00000000-0000-0000-0000-000000000001','KYC cycle completed','Annual KYC refresh completed for all founding members.');
