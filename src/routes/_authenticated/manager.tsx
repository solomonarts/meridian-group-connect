import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense } from "react";
import { toast } from "sonner";
import {
  getMyProfile,
  listApplications,
  updateApplicationStatus,
} from "@/lib/tbs.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";

const profileQO = queryOptions({ queryKey: ["me"], queryFn: () => getMyProfile() });
const appsQO = queryOptions({ queryKey: ["applications"], queryFn: () => listApplications() });

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

const STATUSES = ["submitted", "review", "kyc", "approved", "rejected"] as const;

function ManagerContent() {
  const { data: me } = useSuspenseQuery(profileQO);
  const isManager = me.roles.some((r) => r.role === "admin" || r.role === "manager");
  const { data: apps } = useSuspenseQuery(appsQO);
  const qc = useQueryClient();
  const update = useServerFn(updateApplicationStatus);
  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: (typeof STATUSES)[number] }) => update({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Status updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  return (
    <DashboardShell email={me.profile?.email}>
      <PageHeader
        eyebrow="MANAGER"
        title="Application queue"
        description="Review incoming membership applications and progress them through KYC and approval."
      />

      {!isManager && (
        <div className="mb-6 rounded-md border border-status-warning bg-status-warning/30 px-4 py-3 text-sm text-status-warning-foreground">
          Read-only view. Ask an admin to grant you the manager role to update statuses.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-white" style={{ boxShadow: "var(--shadow-elegant)" }}>
        <table className="w-full text-left text-sm">
          <thead className="bg-navy text-navy-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Applicant</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Country</th>
              <th className="px-4 py-3 font-semibold">Slots</th>
              <th className="px-4 py-3 font-semibold">Submitted</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No applications yet.
                </td>
              </tr>
            )}
            {apps.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{a.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.country ?? "—"}</td>
                <td className="px-4 py-3">{a.slots_requested ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <select
                    disabled={!isManager || mutation.isPending}
                    value={a.status}
                    onChange={(e) =>
                      mutation.mutate({ id: a.id, status: e.target.value as (typeof STATUSES)[number] })
                    }
                    className="rounded-md border border-border bg-white px-2 py-1 text-xs font-semibold"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalShell>
  );
}

