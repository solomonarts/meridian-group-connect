import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { getMyProfile, listAuditEvents, listPortfolio, listReports } from "@/lib/tbs.functions";
import { PortalShell } from "@/components/portal-shell";

const profileQO = queryOptions({ queryKey: ["me"], queryFn: () => getMyProfile() });
const portfolioQO = queryOptions({ queryKey: ["portfolio"], queryFn: () => listPortfolio({ data: {} }) });
const reportsQO = queryOptions({ queryKey: ["reports"], queryFn: () => listReports({ data: {} }) });
const auditQO = queryOptions({ queryKey: ["audit", 10], queryFn: () => listAuditEvents({ data: { limit: 10 } }) });

export const Route = createFileRoute("/_authenticated/portal")({
  component: PortalPage,
  errorComponent: ({ error }) => (
    <div className="p-12 text-sm text-destructive">Portal failed to load: {error.message}</div>
  ),
});

function PortalPage() {
  return (
    <Suspense fallback={<div className="p-12 text-sm text-muted-foreground">Loading portal…</div>}>
      <PortalContent />
    </Suspense>
  );
}

const currency = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function PortalContent() {
  const { data: me } = useSuspenseQuery(profileQO);
  const { data: portfolio } = useSuspenseQuery(portfolioQO);
  const { data: reports } = useSuspenseQuery(reportsQO);
  const { data: audit } = useSuspenseQuery(auditQO);

  const latest = reports[reports.length - 1];
  const owned = portfolio.filter((p) => p.status === "owned" || p.status === "under_review");
  const totalValue = owned.reduce((s, a) => s + (Number(a.current_value) || 0), 0);

  return (
    <PortalShell
      email={me.profile?.email}
      eyebrow="DASHBOARD"
      title={`Welcome back${me.profile?.full_name ? `, ${me.profile.full_name}` : ""}.`}
      description="Live view of your fund position, recent governance activity, and the latest reports."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Portfolio value" value={currency(totalValue)} />
        <Stat label="Latest NAV" value={currency(latest?.nav ?? null)} />
        <Stat label="Latest IRR" value={latest?.irr != null ? `${latest.irr}%` : "—"} />
        <Stat label="Your roles" value={me.roles.map((r) => r.role).join(", ") || "applicant"} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <h2 className="text-lg font-semibold">Portfolio</h2>
          <ul className="mt-4 divide-y divide-border">
            {portfolio.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.location} · {p.asset_type}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{currency(Number(p.current_value))}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.status.replace("_", " ")}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-white p-6" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <h2 className="text-lg font-semibold">Recent governance activity</h2>
          <ul className="mt-4 space-y-4">
            {audit.map((e) => (
              <li key={e.id} className="border-l-2 border-gold pl-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">{e.event_type}</div>
                <div className="text-sm font-semibold">{e.title}</div>
                <div className="text-xs text-muted-foreground">{e.description}</div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(e.created_at).toLocaleDateString()} · {e.actor_name ?? "System"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PortalShell>
  );
}


function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5" style={{ boxShadow: "var(--shadow-elegant)" }}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}
