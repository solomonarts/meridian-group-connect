import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import tbsLogo from "@/assets/tbs-logo.jpeg.asset.json";
import type { ReactNode } from "react";

export function PortalShell({ children, email }: { children: ReactNode; email?: string | null }) {
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
    <div className="flex min-h-screen flex-col bg-cream text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] text-navy-foreground" style={{ background: "var(--gradient-navy)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 p-1">
              <img src={tbsLogo.url} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-[0.25em]">TBS</div>
              <div className="text-[10px] font-medium tracking-[0.25em] text-gold/90">MEMBER PORTAL</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link to="/portal" className="text-navy-foreground/75 hover:text-gold" activeProps={{ className: "text-gold" }}>
              Portal
            </Link>
            <Link to="/manager" className="text-navy-foreground/75 hover:text-gold" activeProps={{ className: "text-gold" }}>
              Manager
            </Link>
            <Link to="/" className="text-navy-foreground/75 hover:text-gold">
              Public site
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {email && <span className="hidden text-xs text-navy-muted sm:inline">{email}</span>}
            <button
              onClick={signOut}
              className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-navy-foreground/90 transition-colors hover:border-gold hover:text-gold"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
