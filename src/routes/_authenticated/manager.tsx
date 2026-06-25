import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, useMemo } from "react";
import { toast } from "sonner";
import {
  getMyProfile,
  listApplications,
  listAuditEvents,
  listPortfolio,
  listReports,
  updateApplicationStatus,
} from "@/lib/tbs.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel, StatCard, StatusPill } from "@/components/dashboard-ui";

const profileQO = queryOptions({ queryKey: ["me"], queryFn: () => getMyProfile() });
const appsQO = queryOptions({ queryKey: ["applications"], queryFn: () => listApplications() });
const portfolioQO = queryOptions({ queryKey: ["portfolio"], queryFn: () => listPortfolio({ data: {} }) });
const reportsQO = queryOptions({ queryKey: ["reports"], queryFn: () => listReports({ data: {} }) });
const auditQO = queryOptions({ queryKey: ["audit", 6], queryFn: () => listAuditEvents({ data: { limit: 6 } }) });

export const Route = createFileRoute("/_authenticated/manager")({
  component: ManagerPage,
  errorComponent: ({ error }) => (
    <div className="p-12 text-sm text-destructive">Manager view failed to load: {error.message}</div>
  ),
});

function ManagerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-sm text-muted-foreground">Loading…</div>}>
      <ManagerContent />
    </Suspense>
  );
}

type AppStatus = "submitted" | "review" | "kyc" | "approved" | "rejected";

function toneFor(status: AppStatus): "success" | "gold" | "danger" {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "gold";
}

const fmtMoney = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);

function ManagerContent() {
  const { data: me } = useSuspenseQuery(profileQO);
  const { data: apps } = useSuspenseQuery(appsQO);
  const { data: portfolio } = useSuspenseQuery(portfolioQO);
  const { data: reports } = useSuspenseQuery(reportsQO);
  const { data: audit } = useSuspenseQuery(auditQO);

  const isManager = me.roles.some((r) => r.role === "admin" || r.role === "manager");
  const qc = useQueryClient();
  const update = useServerFn(updateApplicationStatus);
  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: AppStatus }) => update({ data: vars }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success(`Application ${vars.status}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const pending = useMemo(
    () => apps.filter((a) => a.status !== "approved" && a.status !== "rejected"),
    [apps],
  );
  const decided = useMemo(
    () => apps.filter((a) => a.status === "approved" || a.status === "rejected"),
    [apps],
  );

  const latest = reports[reports.length - 1];
  const owned = portfolio.filter((p) => p.status === "owned" || p.status === "under_review");
  const aum = owned.reduce((s, a) => s + (Number(a.current_value) || 0), 0);
  const totalSlots = apps.reduce((s, a) => s + (a.slots_requested ?? 0), 0);

  return (
    <DashboardShell email={me.profile?.email}>
      <PageHeader
        eyebrow="MANAGER CONSOLE"
        title="TBS Meridian Fund I"
        description="Approve members, monitor capital, and review governance activity."
      />

      {!isManager && (
        <div className="mb-6 rounded-md border border-status-warning bg-status-warning/30 px-4 py-3 text-sm text-status-warning-foreground">
          Read-only view. Ask an admin to grant you the manager role to update statuses.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          accent
          label="Pending applications"
          value={pending.length}
          hint="Awaiting review"
        />
        <StatCard label="Total members" value={decided.filter((a) => a.status === "approved").length} hint="Approved to date" />
        <StatCard label="Assets under management" value={fmtMoney(aum)} hint={`${owned.length} active assets`} />
        <StatCard
          label="Latest NAV"
          value={fmtMoney(latest?.nav ? Number(latest.nav) : null)}
          hint={`IRR ${latest?.irr ?? "—"}%`}
        />
      </div>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Pending applications</h2>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {pending.length} awaiting decision
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {pending.length === 0 ? (
            <Panel>
              <p className="text-sm text-muted-foreground">No pending applications.</p>
            </Panel>
          ) : (
            pending.map((a) => (
              <Panel key={a.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold">{a.full_name}</div>
                      <StatusPill tone={toneFor(a.status as AppStatus)}>{a.status}</StatusPill>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {a.email}
                      {a.country ? ` · ${a.country}` : ""}
                      {a.slots_requested != null ? ` · ${a.slots_requested} slots` : ""}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Submitted {new Date(a.created_at).toLocaleString()}
                    </div>
                    {a.motivation && (
                      <p className="mt-3 text-sm">
                        <span className="font-semibold">Motivation: </span>
                        {a.motivation}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      onClick={() => mutation.mutate({ id: a.id, status: "review" })}
                      disabled={!isManager || mutation.isPending || a.status === "review"}
                      className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                    >
                      Mark in review
                    </button>
                    <button
                      onClick={() => mutation.mutate({ id: a.id, status: "kyc" })}
                      disabled={!isManager || mutation.isPending || a.status === "kyc"}
                      className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                    >
                      Send to KYC
                    </button>
                    <button
                      onClick={() => mutation.mutate({ id: a.id, status: "approved" })}
                      disabled={!isManager || mutation.isPending}
                      className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => mutation.mutate({ id: a.id, status: "rejected" })}
                      disabled={!isManager || mutation.isPending}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </Panel>
            ))
          )}
        </div>
      </section>

      {decided.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">Decided ({decided.length})</h2>
          <div className="mt-5 space-y-3">
            {decided.map((a) => (
              <Panel key={a.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">{a.full_name}</div>
                      <StatusPill tone={toneFor(a.status as AppStatus)}>{a.status}</StatusPill>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {a.email} · {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => mutation.mutate({ id: a.id, status: "review" })}
                    disabled={!isManager || mutation.isPending}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                  >
                    Reopen
                  </button>
                </div>
              </Panel>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Capital overview</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Panel>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Slots requested</div>
              <div className="mt-2 text-2xl font-bold">{totalSlots}</div>
              <div className="mt-1 text-xs text-muted-foreground">Across all applications</div>
            </Panel>
            <Panel>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total distributions</div>
              <div className="mt-2 text-2xl font-bold">
                {fmtMoney(reports.reduce((s, r) => s + Number(r.distributions), 0))}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">All reporting periods</div>
            </Panel>
            <Panel className="col-span-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Portfolio</div>
              <ul className="mt-3 divide-y divide-border">
                {portfolio.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{fmtMoney(Number(p.current_value))}</div>
                      <StatusPill tone={p.status === "owned" ? "success" : "gold"}>
                        {p.status.replace("_", " ")}
                      </StatusPill>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recent governance</h2>
          <div className="mt-5 space-y-3">
            {audit.length === 0 ? (
              <Panel>
                <p className="text-sm text-muted-foreground">No governance events yet.</p>
              </Panel>
            ) : (
              audit.map((e) => (
                <Panel key={e.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">{e.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()} · {e.actor_name ?? "System"}
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
