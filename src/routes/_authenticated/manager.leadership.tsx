import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerPage } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { appointLeader, listLeadership, removeLeader } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["mgr", "leadership"], queryFn: () => listLeadership({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/leadership")({
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Leadership" description="Appoint leaders. Three leader approvals auto-approve slot allocations.">
      <Content />
    </ManagerPage>
  ),
});

function Content() {
  const { data: leaders } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const add = useServerFn(appointLeader);
  const rm = useServerFn(removeLeader);
  const [email, setEmail] = useState("");
  const [pos, setPos] = useState<"chair" | "secretary" | "treasurer" | "leader">("leader");

  const addM = useMutation({
    mutationFn: () => add({ data: { email, position: pos } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "leadership"] }); toast.success("Appointed"); setEmail(""); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const rmM = useMutation({
    mutationFn: (id: string) => rm({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "leadership"] }); toast.success("Removed"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <>
      <Panel>
        <form onSubmit={(e) => { e.preventDefault(); if (email) addM.mutate(); }} className="flex flex-col gap-3 sm:flex-row">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="leader@example.com"
            className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm" />
          <select value={pos} onChange={(e) => setPos(e.target.value as any)} className="rounded-md border border-border bg-white px-3 py-2 text-sm">
            <option value="leader">Leader</option><option value="chair">Chair</option>
            <option value="secretary">Secretary</option><option value="treasurer">Treasurer</option>
          </select>
          <button disabled={addM.isPending} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">
            Appoint
          </button>
        </form>
      </Panel>

      <div className="mt-8 space-y-2">
        {leaders.length === 0 ? <Panel><p className="text-sm text-muted-foreground">No leaders appointed.</p></Panel> :
          leaders.map((l) => (
            <Panel key={l.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{l.profile?.full_name ?? l.profile?.email ?? l.user_id}</div>
                    <StatusPill tone="navy">{l.position}</StatusPill>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Appointed {new Date(l.appointed_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => rmM.mutate(l.id)} disabled={rmM.isPending}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50">Remove</button>
              </div>
            </Panel>
          ))}
      </div>
    </>
  );
}
