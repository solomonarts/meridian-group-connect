import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";

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

export function PortalShell({
  children,
  email,
  eyebrow,
  title,
  description,
}: {
  children: ReactNode;
  email?: string | null;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    await router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-cream text-foreground">
      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col text-navy-foreground md:flex"
        style={{ background: "var(--gradient-navy)" }}
      >
        <div className="px-6 pt-8 pb-10">
          <div className="text-2xl font-bold tracking-[0.2em]">TBS</div>
          <div className="mt-1 text-[10px] font-semibold tracking-[0.3em] text-gold/90">
            MEMBER PORTAL
          </div>
        </div>
        <nav className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV.map((item) =>
              item.to && !item.disabled ? (
                <li key={item.label}>
                  <Link
                    to={item.to}
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
            className="block rounded-md px-4 py-2.5 text-sm text-navy-foreground/75 transition-colors hover:bg-white/[0.04] hover:text-navy-foreground"
          >
            Back to Website
          </Link>
          <button
            onClick={signOut}
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
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4 text-navy-foreground md:hidden"
          style={{ background: "var(--gradient-navy)" }}
        >
          <div>
            <div className="text-sm font-bold tracking-[0.25em]">TBS</div>
            <div className="text-[10px] font-medium tracking-[0.25em] text-gold/90">
              MEMBER PORTAL
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link to="/portal" className="hover:text-gold">Dashboard</Link>
            <Link to="/manager" className="hover:text-gold">Queue</Link>
            <button onClick={signOut} className="hover:text-gold">Sign out</button>
          </div>
        </header>

        <main className="flex-1">
          {(eyebrow || title || description) && (
            <div className="px-6 pt-10 md:px-12 md:pt-12">
              {eyebrow && (
                <div className="text-xs font-semibold tracking-[0.25em] text-gold">
                  {eyebrow}
                </div>
              )}
              {title && <h1 className="mt-2 text-4xl font-bold">{title}</h1>}
              {description && (
                <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          )}
          <div className="px-6 pb-16 pt-8 md:px-12">{children}</div>
        </main>
      </div>
    </div>
  );
}
