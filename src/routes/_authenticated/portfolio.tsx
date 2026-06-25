import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { listPortfolio } from "@/lib/tbs.functions";

export const Route = createFileRoute("/_authenticated/portfolio")({
  component: PortfolioPage,
  errorComponent: ErrorComponent,
});

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n));

function statusTone(s: string): "ok" | "warn" | "muted" {
  if (s === "owned") return "ok";
  if (s === "under_review") return "warn";
  return "muted";
}

function PortfolioPage() {
  const fn = useServerFn(listPortfolio);
  const { data } = useQuery({ queryKey: ["member", "portfolio"], queryFn: () => fn({ data: {} }) });
  return (
    <DashboardShell>
      <PageHeader eyebrow="Portfolio" title="Owned assets" description="Asset-level value, income type, and allocation in your group's fund." />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {(data ?? []).map((a) => (
          <Panel key={a.id} title={a.name} subtitle={`${a.asset_type ?? "—"} · ${a.location ?? "—"}`}>
            <div className="flex items-center justify-between">
              <StatusPill tone={statusTone(a.status)}>{a.status.replaceAll("_", " ")}</StatusPill>
              <span className="text-xs text-muted-foreground">Allocation {Number(a.allocation_pct ?? 0)}%</span>
            </div>
            {a.description && <p className="mt-3 text-sm text-foreground/80">{a.description}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
              <div><div className="text-xs text-muted-foreground">Acquisition</div><div className="font-medium">{fmt(Number(a.acquisition_value))}</div></div>
              <div><div className="text-xs text-muted-foreground">Current</div><div className="font-medium">{fmt(Number(a.current_value))}</div></div>
              <div className="col-span-2 text-xs text-muted-foreground">Income type: {a.income_type ?? "—"}</div>
            </div>
          </Panel>
        ))}
        {data && data.length === 0 && <p className="text-sm text-muted-foreground">No assets yet.</p>}
      </div>
    </DashboardShell>
  );
}
