import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMyProfile, listAuditEvents, listPortfolio, listReports } from "@/lib/tbs.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { ChartTooltip, Panel, StatCard, StatusPill } from "@/components/dashboard-ui";

const profileQO = queryOptions({ queryKey: ["me"], queryFn: () => getMyProfile() });
const portfolioQO = queryOptions({ queryKey: ["portfolio"], queryFn: () => listPortfolio({ data: {} }) });
const reportsQO = queryOptions({ queryKey: ["reports"], queryFn: () => listReports({ data: {} }) });
const auditQO = queryOptions({ queryKey: ["audit", 8], queryFn: () => listAuditEvents({ data: { limit: 8 } }) });

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

const fmtMoney = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);

const NAVY = "oklch(0.19 0.03 255)";
const GOLD = "oklch(0.74 0.13 80)";
const ALLOCATION_COLORS = [
  "oklch(0.74 0.13 80)",
  "oklch(0.32 0.06 255)",
  "oklch(0.55 0.04 255)",
  "oklch(0.82 0.09 85)",
];

function PortalContent() {
  const { data: me } = useSuspenseQuery(profileQO);
  const { data: portfolio } = useSuspenseQuery(portfolioQO);
  const { data: reports } = useSuspenseQuery(reportsQO);
  const { data: audit } = useSuspenseQuery(auditQO);

  const latest = reports[reports.length - 1];
  const prev = reports[reports.length - 2];
  const owned = portfolio.filter((p) => p.status === "owned" || p.status === "under_review");
  const totalValue = owned.reduce((s, a) => s + (Number(a.current_value) || 0), 0);

  const navTrend =
    latest && prev && Number(prev.nav) > 0
      ? (((Number(latest.nav) - Number(prev.nav)) / Number(prev.nav)) * 100).toFixed(1)
      : null;

  const rows = reports.map((r) => ({
    period: new Date(r.period).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
    nav: Number(r.nav),
    contributions: Number(r.contributions),
    distributions: Number(r.distributions),
    irr: Number(r.irr),
  }));

  const allocation = owned.map((p, i) => ({
    name: p.asset_type,
    value: Number(p.current_value) || 0,
    color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
  }));
  const allocTotal = allocation.reduce((s, a) => s + a.value, 0) || 1;

  return (
    <DashboardShell email={me.profile?.email}>
      <PageHeader
        eyebrow="TBS MERIDIAN"
        title={`Welcome${me.profile?.full_name ? `, ${me.profile.full_name}` : ""}.`}
        description="Your live snapshot of fund position, governance activity, and the latest reports."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          accent
          label="Estimated NAV"
          value={fmtMoney(latest?.nav ? Number(latest.nav) : null)}
          hint="Group net asset value"
          trend={navTrend ? { value: `${navTrend}% QoQ`, up: Number(navTrend) >= 0 } : undefined}
        />
        <StatCard
          label="Portfolio value"
          value={fmtMoney(totalValue)}
          hint={`${owned.length} active assets`}
        />
        <StatCard
          label="Latest IRR"
          value={latest?.irr != null ? `${latest.irr}%` : "—"}
          hint={`Period ${latest ? new Date(latest.period).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"}`}
        />
        <StatCard
          label="Last distribution"
          value={fmtMoney(latest?.distributions ? Number(latest.distributions) : null)}
          hint="Most recent payout"
        />
      </div>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Fund performance
              </div>
              <div className="mt-1 text-xl font-bold">NAV, contributions & distributions</div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: GOLD }} />NAV
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: NAVY }} />Distributions
              </span>
            </div>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNav" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.9 0.01 255)" vertical={false} />
                <XAxis dataKey="period" stroke="oklch(0.55 0.02 255)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="oklch(0.55 0.02 255)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="nav" stroke={GOLD} strokeWidth={2.5} fill="url(#gNav)" />
                <Area
                  type="monotone"
                  dataKey="distributions"
                  stroke={NAVY}
                  strokeWidth={2.5}
                  fill="url(#gDist)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Asset allocation
          </div>
          <div className="mt-1 text-xl font-bold">Portfolio mix</div>
          <div className="mt-4 h-52">
            {allocation.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No active assets
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={3} stroke="none">
                    {allocation.map((a) => (
                      <Cell key={a.name} fill={a.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 space-y-1.5">
            {allocation.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                  <span className="font-medium">{a.name}</span>
                </span>
                <span className="font-semibold tabular-nums">
                  {Math.round((a.value / allocTotal) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Capital flow
              </div>
              <div className="mt-1 text-xl font-bold">Contributions per period</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Total contributions</div>
              <div className="text-lg font-bold">
                {fmtMoney(rows.reduce((s, r) => s + r.contributions, 0))}
              </div>
            </div>
          </div>
          <div className="mt-6 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.9 0.01 255)" vertical={false} />
                <XAxis dataKey="period" stroke="oklch(0.55 0.02 255)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="oklch(0.55 0.02 255)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(0.95 0.01 85)" }} />
                <Bar dataKey="contributions" fill={GOLD} radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            IRR trend
          </div>
          <div className="mt-1 text-xl font-bold">Internal rate of return</div>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.9 0.01 255)" vertical={false} />
                <XAxis dataKey="period" stroke="oklch(0.55 0.02 255)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="oklch(0.55 0.02 255)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<ChartTooltip prefix="" />} />
                <Area type="monotone" dataKey="irr" stroke={GOLD} strokeWidth={2.5} fill="url(#gIrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Portfolio snapshot</h2>
          <div className="mt-5 space-y-4">
            {portfolio.map((p) => (
              <Panel key={p.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.location}</div>
                  </div>
                  <StatusPill
                    tone={
                      p.status === "owned"
                        ? "success"
                        : p.status === "target"
                          ? "navy"
                          : "gold"
                    }
                  >
                    {p.status.replace("_", " ")}
                  </StatusPill>
                </div>
                {p.description && (
                  <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Asset type</div>
                    <div className="font-semibold">{p.asset_type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Asset value</div>
                    <div className="font-semibold">{fmtMoney(Number(p.current_value))}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Income type</div>
                    <div className="font-semibold">{p.income_type ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Allocation</div>
                    <div className="font-semibold">
                      {p.allocation_pct != null ? `${p.allocation_pct}%` : "—"}
                    </div>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recent governance</h2>
          <div className="mt-5 space-y-4">
            {audit.length === 0 ? (
              <Panel>
                <p className="text-sm text-muted-foreground">No governance events yet.</p>
              </Panel>
            ) : (
              audit.map((e) => (
                <Panel key={e.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold">{e.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()} ·{" "}
                        {e.actor_name ?? "System"}
                      </div>
                    </div>
                    <StatusPill>{e.event_type}</StatusPill>
                  </div>
                  {e.description && (
                    <p className="mt-3 text-sm text-muted-foreground">{e.description}</p>
                  )}
                </Panel>
              ))
            )}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
