import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type NavItem = {
  label: string;
  to?: "/portal" | "/manager" | "/";
  disabled?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/portal" },
  { label: "Portfolio", disabled: true },
  { label: "Deal Room", disabled: true },
  { label: "Voting", disabled: true },
  { label: "Documents", disabled: true },
  { label: "Reports", disabled: true },
  { label: "Announcements", disabled: true },
  { label: "Application Queue", to: "/manager" },
  { label: "Profile", disabled: true },
  { label: "Settings", disabled: true },
];

function SidebarBody({
  email,
  onNavigate,
  onSignOut,
}: {
  email?: string | null;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  return (
    <div
      className="flex h-full w-full flex-col text-navy-foreground"
      style={{ background: "var(--gradient-navy)" }}
    >
      <div className="px-6 pt-8 pb-10">
        <div className="text-2xl font-bold tracking-[0.2em]">TBS</div>
        <div className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-gold/90">
          MEMBER PORTAL
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {NAV.map((item) =>
            item.to && !item.disabled ? (
              <li key={item.label}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  className="block rounded-md px-4 py-2.5 text-sm text-navy-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-navy-foreground"
                  activeProps={{
                    className:
                      "block rounded-md px-4 py-2.5 text-sm font-semibold text-navy bg-gold",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ) : (
              <li key={item.label}>
                <span className="block cursor-not-allowed rounded-md px-4 py-2.5 text-sm text-navy-foreground/40">
                  {item.label}
                </span>
              </li>
            ),
          )}
        </ul>
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
          onClick={() => {
            onNavigate?.();
            onSignOut();
          }}
          className="mt-1 block w-full rounded-md px-4 py-2.5 text-left text-sm text-navy-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-gold"
        >
          Sign out
        </button>
        {email && (
          <div className="mt-3 truncate px-4 text-[10px] text-navy-foreground/40">
            {email}
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  email,
}: {
  children: ReactNode;
  email?: string | null;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
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
        <SidebarBody email={email} onSignOut={signOut} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-r-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody
            email={email}
            onNavigate={() => setMobileOpen(false)}
            onSignOut={signOut}
          />
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
              MEMBER PORTAL
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-12 md:py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
