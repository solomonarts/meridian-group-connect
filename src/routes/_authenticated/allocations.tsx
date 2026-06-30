import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel, StatCard, StatusPill } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cancelAllocation, createAllocation, getCapacity, listMyAllocations } from "@/lib/member.functions";

export const Route = createFileRoute("/_authenticated/allocations")({
  head: () => ({
    meta: [
      { title: "Slot allocations — TBS Meridian Realities" },
      { name: "description", content: "Track your TBS Meridian slot ownership and allocation requests." },
      { property: "og:title", content: "Slot allocations — TBS Meridian Realities" },
      { property: "og:description", content: "Track your TBS Meridian slot ownership and allocation requests." },
      { property: "og:url", content: "/allocations" },
      { name: "twitter:title", content: "Slot allocations — TBS Meridian Realities" },
      { name: "twitter:description", content: "Track your TBS Meridian slot ownership and allocation requests." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/allocations" }],
  }),
  component: AllocationsPage,
  errorComponent: ErrorComponent,
});

function AllocationsPage() {
  const capFn = useServerFn(getCapacity);
  const listFn = useServerFn(listMyAllocations);
  const createFn = useServerFn(createAllocation);
  const cancelFn = useServerFn(cancelAllocation);
  const qc = useQueryClient();
  const { data: cap } = useQuery({ queryKey: ["member", "capacity"], queryFn: () => capFn({ data: {} }) });
  const { data: rows } = useQuery({ queryKey: ["member", "allocations"], queryFn: () => listFn({ data: {} }) });
  const [slots, setSlots] = useState(1);
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: () => createFn({ data: { slots, notes } }),
    onSuccess: () => {
      toast.success("Slot request submitted");
      setNotes(""); setSlots(1);
      qc.invalidateQueries({ queryKey: ["member"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => { toast.success("Cancelled"); qc.invalidateQueries({ queryKey: ["member", "allocations"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <PageHeader eyebrow="Allocations" title="Slot ownership" description="Request additional slots and monitor approvals." />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total slots" value={cap?.total ?? 0} />
        <StatCard label="Allocated" value={cap?.allocated ?? 0} />
        <StatCard label="Available" value={cap?.available ?? 0} />
      </div>
      <Panel className="mt-6" title="Request new slots" subtitle="Three leader approvals are required to approve a request.">
        <div className="grid gap-3 sm:grid-cols-[120px_1fr_auto]">
          <Input type="number" min={1} value={slots} onChange={(e) => setSlots(Math.max(1, Number(e.target.value)))} />
          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button onClick={() => create.mutate()} disabled={create.isPending}>Submit request</Button>
        </div>
      </Panel>
      <Panel className="mt-6" title="My requests">
        <div className="divide-y divide-border">
          {(rows ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium">{r.slots_requested} slot(s){r.dealTitle ? ` · ${r.dealTitle}` : ""}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}{r.notes ? ` · ${r.notes}` : ""}</div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill tone={r.status === "approved" || r.status === "committed" ? "ok" : r.status === "cancelled" ? "muted" : "warn"}>{r.status}</StatusPill>
                {r.status === "requested" && (
                  <Button size="sm" variant="ghost" onClick={() => cancel.mutate(r.id)} disabled={cancel.isPending}>Cancel</Button>
                )}
              </div>
            </div>
          ))}
          {rows && rows.length === 0 && <p className="py-4 text-sm text-muted-foreground">No requests yet.</p>}
        </div>
      </Panel>
    </DashboardShell>
  );
}
