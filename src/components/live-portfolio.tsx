import { useQuery } from "@tanstack/react-query";
import { listPortfolio } from "@/lib/tbs.functions";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  owned: { label: "OWNED", cls: "bg-status-success text-status-success-foreground" },
  under_review: { label: "UNDER REVIEW", cls: "bg-status-warning text-status-warning-foreground" },
  target: { label: "TARGET PIPELINE", cls: "bg-muted text-muted-foreground" },
  partner: { label: "PARTNER-BACKED", cls: "bg-gold/20 text-foreground" },
};

const currency = (n: number | string | null | undefined) => {
  if (n == null || n === "") return "TBD";
  const num = typeof n === "string" ? Number(n) : n;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
};

export function LivePortfolio() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => listPortfolio({ data: {} }),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading portfolio…</div>;
  if (error) return <div className="text-sm text-destructive">Failed to load portfolio.</div>;
  if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">No assets yet.</div>;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {data.map((a) => {
        const b = STATUS_BADGE[a.status] ?? STATUS_BADGE.target;
        return (
          <div key={a.id} className="rounded-xl border border-border bg-white p-6" style={{ boxShadow: "var(--shadow-elegant)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{a.name}</h3>
                <div className="mt-1 text-sm text-muted-foreground">{a.location}</div>
              </div>
              <span className={`rounded-md px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${b.cls}`}>
                {b.label}
              </span>
            </div>
            {a.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a.description}</p>}
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Asset type</div>
                <div className="font-semibold text-foreground">{a.asset_type}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Asset value</div>
                <div className="font-semibold text-foreground">{currency(a.current_value)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Income type</div>
                <div className="font-semibold text-foreground">{a.income_type ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Member allocation</div>
                <div className="font-semibold text-foreground">{a.allocation_pct != null ? `${a.allocation_pct}%` : "Pending approval"}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
