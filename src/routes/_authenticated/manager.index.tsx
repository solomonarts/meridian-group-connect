import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ManagerPage, fmtMoney } from "@/components/manager-page";
import { Panel, StatCard, StatusPill, ChartTooltip } from "@/components/dashboard-ui";
import { getManagerOverview } from "@/lib/manager.functions";
import { listAuditEvents, listPortfolio, listReports } from "@/lib/tbs.functions";

const overviewQO = queryOptions({ queryKey: ["mgr", "overview"], queryFn: () => getManagerOverview({ data: {} }) });
const portfolioQO = queryOptions({ queryKey: ["portfolio"], queryFn: () => listPortfolio({ data: {} }) });
const reportsQO = queryOptions({ queryKey: ["reports"], queryFn: () => listReports({ data: {} }) });
const auditQO = queryOptions({ queryKey: ["audit", 6], queryFn: () => listAuditEvents({ data: { limit: 6 } }) });

export const Route = createFileRoute("/_authenticated/manager/")({
  head: () => ({
    meta: [
      { title: "Manager overview — TBS Meridian Realities" },
      { name: "description", content: "Operational overview for TBS Meridian managers." },
      { property: "og:title", content: "Manager overview — TBS Meridian Realities" },
      { property: "og:description", content: "Operational overview for TBS Meridian managers." },
      { property: "og:url", content: "/manager" },
      { name: "twitter:title", content: "Manager overview — TBS Meridian Realities" },
      { name: "twitter:description", content: "Operational overview for TBS Meridian managers." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/manager" }],
  }),
  component: () => (
    <ManagerPage eyebrow="MANAGER CONSOLE" title="TBS Meridian Fund I" description="Operational health, capital position, and recent governance.">
      <Content />
    </ManagerPage>
  ),
  errorComponent: ({ error }) => <div className="p-12 text-sm text-destructive">Failed: {error.message}</div>,
});

const NAVY = "oklch(0.19 0.03 255)";
const GOLD = "oklch(0.74 0.13 80)";
const COLORS = [GOLD, NAVY, "oklch(0.55 0.04 255)", "oklch(0.82 0.09 85)"];

function Content() {
  const { data: o } = useSuspenseQuery(overviewQO);
  const { data: portfolio } = useSuspenseQuery(portfolioQO);
  const { data: reports } = useSuspenseQuery(reportsQO);
  const { data: audit } = useSuspenseQuery(auditQO);

  const latest = reports[reports.length - 1];
  const rows = reports.map((r) => ({
    period: new Date(r.period).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
    nav: Number(r.nav), contributions: Number(r.contributions),
    distributions: Number(r.distributions), irr: Number(r.irr),
  }));
  const owned = portfolio.filter((p) => p.status === "owned" || p.status === "under_review");
  const aum = owned.reduce((s, a) => s + (Number(a.current_value) || 0), 0);
  const allocation = owned.map((p, i) => ({
    name: p.asset_type, value: Number(p.current_value) || 0, color: COLORS[i % COLORS.length],
  }));

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard accent label="Slots available" value={`${o.slots.available} / ${o.slots.total}`} hint={`${o.slots.allocated} allocated`} />
        <StatCard label="Pending applications" value={o.pendingApps} hint="Awaiting review" />
        <StatCard label="Open deals" value={o.openDeals} hint={`${o.openPolls} open polls`} />
        <StatCard label="Payments to action" value={o.pendingPayments} hint={`${o.memberCount} active members`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="AUM" value={fmtMoney(aum)} hint={`${owned.length} active assets`} />
        <StatCard label="Latest NAV" value={fmtMoney(latest?.nav ? Number(latest.nav) : null)} hint={`IRR ${latest?.irr ?? "—"}%`} />
        <StatCard label="Total distributions" value={fmtMoney(reports.reduce((s, r) => s + Number(r.distributions), 0))} hint="All periods" />
      </div>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fund performance</div>
          <div className="mt-1 text-xl font-bold">NAV & distributions</div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="mNav" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.35} /><stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.9 0.01 255)" vertical={false} />
                <XAxis dataKey="period" stroke="oklch(0.55 0.02 255)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.55 0.02 255)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="nav" stroke={GOLD} strokeWidth={2.5} fill="url(#mNav)" />
                <Area type="monotone" dataKey="distributions" stroke={NAVY} strokeWidth={2.5} fill="url(#mDist)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Allocation</div>
          <div className="mt-1 text-xl font-bold">Portfolio mix</div>
          <div className="mt-4 h-52">
            {allocation.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No active assets</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={3} stroke="none">
                    {allocation.map((a) => <Cell key={a.name} fill={a.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </section>

      <section className="mt-8">
        <Panel>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capital flow</div>
          <div className="mt-1 text-xl font-bold">Contributions per period</div>
          <div className="mt-6 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="oklch(0.9 0.01 255)" vertical={false} />
                <XAxis dataKey="period" stroke="oklch(0.55 0.02 255)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.55 0.02 255)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(0.95 0.01 85)" }} />
                <Bar dataKey="contributions" fill={GOLD} radius={[8, 8, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold tracking-tight">Recent governance</h2>
        <div className="mt-4 space-y-3">
          {audit.length === 0 ? (
            <Panel><p className="text-sm text-muted-foreground">No governance events yet.</p></Panel>
          ) : audit.map((e) => (
            <Panel key={e.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()} · {e.actor_name ?? "System"}</div>
                </div>
                <StatusPill>{e.event_type}</StatusPill>
              </div>
              {e.description && <p className="mt-3 text-sm text-muted-foreground">{e.description}</p>}
            </Panel>
          ))}
        </div>
      </section>
    </>
  );
}
