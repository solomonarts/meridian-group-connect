import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ManagerPage, fmtDate } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { decideAllocation, listAllocations } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["mgr", "allocations"], queryFn: () => listAllocations({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/allocations")({
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Slot allocations" description="Auto-approves when three leaders approve. Finalize commit or cancel.">
      <Content />
    </ManagerPage>
  ),
});

type S = "requested" | "approved" | "committed" | "cancelled";
const tone = (s: S) => (s === "committed" ? "success" : s === "approved" ? "navy" : s === "cancelled" ? "danger" : "gold");

function Content() {
  const { data: rows } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const fn = useServerFn(decideAllocation);
  const m = useMutation({
    mutationFn: (v: { id: string; status: S }) => fn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "allocations"] }); toast.success("Updated"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-3">
      {rows.length === 0 ? <Panel><p className="text-sm text-muted-foreground">No allocation requests yet.</p></Panel> :
        rows.map((r) => (
          <Panel key={r.id}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{r.profile?.full_name ?? r.profile?.email ?? r.user_id}</div>
                  <StatusPill tone={tone(r.status as S)}>{r.status}</StatusPill>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{r.slots_requested} slots · requested {fmtDate(r.created_at)}</div>
                {r.notes && <p className="mt-2 text-sm">{r.notes}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button disabled={m.isPending} onClick={() => m.mutate({ id: r.id, status: "approved" })}
                  className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">Approve</button>
                <button disabled={m.isPending} onClick={() => m.mutate({ id: r.id, status: "committed" })}
                  className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">Commit</button>
                <button disabled={m.isPending} onClick={() => m.mutate({ id: r.id, status: "cancelled" })}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50">Cancel</button>
              </div>
            </div>
          </Panel>
        ))}
    </div>
  );
}
