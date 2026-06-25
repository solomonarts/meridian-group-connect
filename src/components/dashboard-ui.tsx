import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-white p-6 ${className}`}
      style={{ boxShadow: "var(--shadow-elegant)" }}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: { value: string; up?: boolean };
  accent?: boolean;
}) {
  if (accent) {
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-navy-foreground"
        style={{ background: "var(--gradient-navy)", boxShadow: "var(--shadow-elegant)" }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30"
          style={{ background: "var(--gradient-gold)" }}
        />
        <div className="relative text-xs uppercase tracking-wider text-gold/90">{label}</div>
        <div className="relative mt-3 text-3xl font-bold">{value}</div>
        {hint ? <div className="relative mt-2 text-xs text-navy-foreground/70">{hint}</div> : null}
        {trend ? (
          <div
            className={`relative mt-3 inline-flex items-center gap-1 text-xs font-semibold ${
              trend.up ? "text-status-success" : "text-destructive"
            }`}
          >
            {trend.up ? "▲" : "▼"} {trend.value}
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border bg-white p-6 transition-all hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-elegant)" }}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="mt-2 flex items-center gap-2">
        {trend ? (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              trend.up ? "text-status-success-foreground" : "text-destructive"
            }`}
          >
            {trend.up ? "▲" : "▼"} {trend.value}
          </span>
        ) : null}
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </div>
    </div>
  );
}

export function StatusPill({
  tone = "gold",
  children,
}: {
  tone?: "gold" | "success" | "danger" | "navy";
  children: ReactNode;
}) {
  const cls =
    tone === "success"
      ? "bg-status-success text-status-success-foreground"
      : tone === "danger"
        ? "bg-destructive/10 text-destructive"
        : tone === "navy"
          ? "bg-navy text-gold"
          : "bg-gold/25 text-navy";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {children}
    </span>
  );
}

export function ChartTooltip({ active, payload, label, prefix = "$" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-lg">
      {label && (
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="font-semibold capitalize">{p.name}:</span>
          <span>
            {prefix}
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
