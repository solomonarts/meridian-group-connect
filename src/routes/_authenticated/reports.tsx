import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { ChartTooltip, Panel } from "@/components/dashboard-ui";
import { listReports } from "@/lib/tbs.functions";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — TBS Meridian Realities" },
      { name: "description", content: "NAV trends and financial statements for TBS Meridian Fund I." },
      { property: "og:title", content: "Reports — TBS Meridian Realities" },
      { property: "og:description", content: "NAV trends and financial statements for TBS Meridian Fund I." },
      { property: "og:url", content: "/reports" },
      { name: "twitter:title", content: "Reports — TBS Meridian Realities" },
      { name: "twitter:description", content: "NAV trends and financial statements for TBS Meridian Fund I." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/reports" }],
  }),
  component: ReportsPage,
  errorComponent: ErrorComponent,
});

const GOLD = "oklch(0.74 0.13 80)";
const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function ReportsPage() {
  const fn = useServerFn(listReports);
  const { data } = useQuery({ queryKey: ["member", "reports"], queryFn: () => fn({ data: {} }) });
  const rows = (data ?? []).map((r) => ({
    period: new Date(r.period).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
    nav: Number(r.nav),
    contributions: Number(r.contributions),
    distributions: Number(r.distributions),
    irr: Number(r.irr ?? 0),
  }));

  return (
    <DashboardShell>
      <PageHeader eyebrow="Reports" title="Statements & performance" description="Historical NAV, contributions, distributions, and IRR." />
      <Panel className="mt-6" title="NAV trend">
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={rows}>
              <defs>
                <linearGradient id="nav-rep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="nav" stroke={GOLD} fill="url(#nav-rep)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel className="mt-6" title="Statement history">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2">Period</th><th>NAV</th><th>Contributions</th><th>Distributions</th><th>IRR</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 font-medium">{r.period}</td>
                  <td>{fmt(r.nav)}</td>
                  <td>{fmt(r.contributions)}</td>
                  <td>{fmt(r.distributions)}</td>
                  <td>{r.irr.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </DashboardShell>
  );
}
