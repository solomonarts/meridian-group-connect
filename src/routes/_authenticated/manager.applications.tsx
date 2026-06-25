import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { toast } from "sonner";
import { listApplications, updateApplicationStatus } from "@/lib/tbs.functions";
import { ManagerPage } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";

const qo = queryOptions({ queryKey: ["applications"], queryFn: () => listApplications() });

export const Route = createFileRoute("/_authenticated/manager/applications")({
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Applications" description="Approve, review, and KYC prospective members.">
      <Content />
    </ManagerPage>
  ),
});

type S = "submitted" | "review" | "kyc" | "approved" | "rejected";
const tone = (s: S) => (s === "approved" ? "success" : s === "rejected" ? "danger" : "gold");

function Content() {
  const { data: apps } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const fn = useServerFn(updateApplicationStatus);
  const m = useMutation({
    mutationFn: (v: { id: string; status: S }) => fn({ data: v }),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["applications"] }); toast.success(`Marked ${v.status}`); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const pending = useMemo(() => apps.filter((a) => a.status !== "approved" && a.status !== "rejected"), [apps]);
  const decided = useMemo(() => apps.filter((a) => a.status === "approved" || a.status === "rejected"), [apps]);

  return (
    <>
      <section>
        <h2 className="text-xl font-bold tracking-tight">Pending ({pending.length})</h2>
        <div className="mt-4 space-y-3">
          {pending.length === 0 ? <Panel><p className="text-sm text-muted-foreground">Nothing pending.</p></Panel> :
            pending.map((a) => (
              <Panel key={a.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold">{a.full_name}</div>
                      <StatusPill tone={tone(a.status as S)}>{a.status}</StatusPill>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {a.email}{a.country ? ` · ${a.country}` : ""}{a.slots_requested != null ? ` · ${a.slots_requested} slots` : ""}
                    </div>
                    {a.motivation && <p className="mt-3 text-sm"><span className="font-semibold">Motivation: </span>{a.motivation}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {(["review", "kyc"] as S[]).map((s) => (
                      <button key={s} disabled={m.isPending || a.status === s} onClick={() => m.mutate({ id: a.id, status: s })}
                        className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                        {s === "review" ? "Mark in review" : "Send to KYC"}
                      </button>
                    ))}
                    <button disabled={m.isPending} onClick={() => m.mutate({ id: a.id, status: "approved" })}
                      className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">Approve</button>
                    <button disabled={m.isPending} onClick={() => m.mutate({ id: a.id, status: "rejected" })}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50">Reject</button>
                  </div>
                </div>
              </Panel>
            ))}
        </div>
      </section>

      {decided.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">Decided ({decided.length})</h2>
          <div className="mt-4 space-y-2">
            {decided.map((a) => (
              <Panel key={a.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold">{a.full_name}</span><StatusPill tone={tone(a.status as S)}>{a.status}</StatusPill></div>
                    <div className="mt-1 text-xs text-muted-foreground">{a.email} · {new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => m.mutate({ id: a.id, status: "review" })} disabled={m.isPending}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">Reopen</button>
                </div>
              </Panel>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
