import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { listReports } from "@/lib/tbs.functions";

export function ReportsCharts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reports"],
    queryFn: () => listReports({ data: {} }),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading reports…</div>;
  if (error) return <div className="text-sm text-destructive">Failed to load reports.</div>;
  if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">No reports yet.</div>;

  const rows = data.map((r) => ({
    period: new Date(r.period).toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
    nav: Number(r.nav),
    contributions: Number(r.contributions),
    distributions: Number(r.distributions),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Net asset value" subtitle="NAV by reporting period">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="period" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }}
              formatter={(v: number) => `$${v.toLocaleString()}`}
            />
            <Line type="monotone" dataKey="nav" stroke="var(--gold)" strokeWidth={2.5} dot={{ fill: "var(--gold)", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Contributions vs distributions" subtitle="Capital flows per period">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="period" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", fontSize: 12 }}
              formatter={(v: number) => `$${v.toLocaleString()}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="contributions" fill="var(--navy)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="distributions" fill="var(--gold)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white p-6" style={{ boxShadow: "var(--shadow-elegant)" }}>
      <div className="text-xs font-semibold tracking-[0.25em] text-gold">REPORTS</div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
