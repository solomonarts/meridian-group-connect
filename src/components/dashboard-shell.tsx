import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import tbsLogo from "@/assets/tbs-logo.jpeg.asset.json";

type NavItem = { label: string; to: string };

const MEMBER_NAV: NavItem[] = [
  { label: "Dashboard", to: "/portal" },
  { label: "Deal Room", to: "/deals" },
  { label: "Voting", to: "/voting" },
  { label: "Allocations", to: "/allocations" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Documents", to: "/documents" },
  { label: "Announcements", to: "/announcements" },
  { label: "Payments", to: "/payments" },
  { label: "Reports", to: "/reports" },
  { label: "Profile", to: "/profile" },
  { label: "Settings", to: "/settings" },
];

const MANAGER_NAV: NavItem[] = [
  { label: "Overview", to: "/manager" },
  { label: "Applications", to: "/manager/applications" },
  { label: "Members", to: "/manager/members" },
  { label: "Leadership", to: "/manager/leadership" },
  { label: "Deals", to: "/manager/deals" },
  { label: "Allocations", to: "/manager/allocations" },
  { label: "Payments", to: "/manager/payments" },
  { label: "Polls", to: "/manager/polls" },
  { label: "Announcements", to: "/manager/announcements" },
  { label: "Documents", to: "/manager/documents" },
  { label: "Portfolio", to: "/manager/portfolio" },
  { label: "Settings", to: "/manager/settings" },
];

function SidebarBody({
  email,
  pathname,
  onNavigate,
  onSignOut,
}: {
  email?: string | null;
  pathname: string;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  const inManager = pathname.startsWith("/manager");
  const nav = inManager ? MANAGER_NAV : MEMBER_NAV;
  const label = inManager ? "MANAGER CONSOLE" : "MEMBER PORTAL";
  return (
    <div className="flex h-full w-full flex-col text-navy-foreground" style={{ background: "var(--gradient-navy)" }}>
      <div className="flex items-center gap-3 px-6 pt-8 pb-8">
        <img src={tbsLogo.url} alt="TBS Meridian Realities" className="h-12 w-12 rounded-md object-cover ring-1 ring-white/10" />
        <div>
          <div className="text-base font-bold tracking-[0.18em]">TBS MERIDIAN</div>
          <div className="mt-0.5 text-[10px] font-semibold tracking-[0.3em] text-gold/90">{label}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/manager" && pathname.startsWith(item.to));
            return (
              <li key={item.to}>
                <Link
                  to={item.to as any}
                  onClick={onNavigate}
                  className={
                    active
                      ? "block rounded-md px-4 py-2.5 text-sm font-semibold text-navy bg-gold"
                      : "block rounded-md px-4 py-2.5 text-sm text-navy-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-navy-foreground"
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 border-t border-white/[0.06] pt-4">
          <Link
            to={inManager ? "/portal" : "/manager"}
            onClick={onNavigate}
            className="block rounded-md px-4 py-2.5 text-xs uppercase tracking-wider text-gold/80 hover:text-gold"
          >
            Switch to {inManager ? "Member portal" : "Manager console"}
          </Link>
        </div>
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="block rounded-md px-4 py-2.5 text-sm text-navy-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-navy-foreground"
        >
          Back to Website
        </Link>
        <button
          onClick={() => { onNavigate?.(); onSignOut(); }}
          className="mt-1 block w-full rounded-md px-4 py-2.5 text-left text-sm text-navy-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-gold"
        >
          Sign out
        </button>
        {email && <div className="mt-3 truncate px-4 text-[10px] text-navy-foreground/40">{email}</div>}
      </div>
    </div>
  );
}

export function DashboardShell({ children, email }: { children: ReactNode; email?: string | null }) {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen w-full bg-cream text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 md:block">
        <SidebarBody email={email} pathname={pathname} onSignOut={signOut} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-r-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody email={email} pathname={pathname} onNavigate={() => setMobileOpen(false)} onSignOut={signOut} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-navy-foreground md:hidden"
          style={{ background: "var(--gradient-navy)" }}
        >
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-md p-2 text-navy-foreground/80 hover:bg-white/[0.06] hover:text-gold"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-[0.25em]">TBS</div>
            <div className="text-[10px] font-medium tracking-[0.25em] text-gold/90">
              {pathname.startsWith("/manager") ? "MANAGER CONSOLE" : "MEMBER PORTAL"}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-12 md:py-12">{children}</div>
        </main>
      </div>
    </div>
  );
}
