import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerPage, fmtDate } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { closePoll, createPoll, listPolls } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["mgr", "polls"], queryFn: () => listPolls({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/polls")({
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Polls" description="Run governance polls. Members vote from their portal.">
      <Content />
    </ManagerPage>
  ),
});

function Content() {
  const { data: polls } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const create = useServerFn(createPoll);
  const close = useServerFn(closePoll);
  const [question, setQuestion] = useState("");
  const [optionsText, setOptionsText] = useState("Approve\nReject\nAbstain");

  const cM = useMutation({
    mutationFn: () => create({ data: {
      question,
      options: optionsText.split("\n").map((l) => l.trim()).filter(Boolean),
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "polls"] }); toast.success("Poll created"); setQuestion(""); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const xM = useMutation({
    mutationFn: (id: string) => close({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "polls"] }); toast.success("Closed"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const inp = "rounded-md border border-border bg-white px-3 py-2 text-sm w-full";

  return (
    <>
      <Panel>
        <div className="text-sm font-semibold">New poll</div>
        <form onSubmit={(e) => { e.preventDefault(); if (question) cM.mutate(); }} className="mt-4 space-y-3">
          <input required placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} className={inp} />
          <textarea required placeholder="One option per line" value={optionsText} onChange={(e) => setOptionsText(e.target.value)} className={inp} rows={4} />
          <button disabled={cM.isPending} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">Create poll</button>
        </form>
      </Panel>

      <div className="mt-8 space-y-3">
        {polls.length === 0 ? <Panel><p className="text-sm text-muted-foreground">No polls yet.</p></Panel> :
          polls.map((p) => {
            const total = p.tally.reduce((s: number, t: any) => s + t.votes, 0) || 1;
            return (
              <Panel key={p.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-base font-semibold">{p.question}</div>
                      <StatusPill tone={p.status === "open" ? "success" : "navy"}>{p.status}</StatusPill>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Created {fmtDate(p.created_at)}</div>
                    {p.description && <p className="mt-2 text-sm">{p.description}</p>}
                    <div className="mt-4 space-y-2">
                      {p.tally.map((t: any) => (
                        <div key={t.option_id}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold">{t.label}</span>
                            <span className="text-muted-foreground">{t.votes} ({Math.round((t.votes / total) * 100)}%)</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-gold" style={{ width: `${(t.votes / total) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {p.status === "open" && (
                    <button disabled={xM.isPending} onClick={() => xM.mutate(p.id)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">Close</button>
                  )}
                </div>
              </Panel>
            );
          })}
      </div>
    </>
  );
}
