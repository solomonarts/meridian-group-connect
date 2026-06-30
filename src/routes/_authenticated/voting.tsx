import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { castPollVote, listMemberPolls } from "@/lib/member.functions";

export const Route = createFileRoute("/_authenticated/voting")({
  head: () => ({
    meta: [
      { title: "Governance voting — TBS Meridian Realities" },
      { name: "description", content: "Cast weighted votes on TBS Meridian governance polls." },
      { property: "og:title", content: "Governance voting — TBS Meridian Realities" },
      { property: "og:description", content: "Cast weighted votes on TBS Meridian governance polls." },
      { property: "og:url", content: "/voting" },
      { name: "twitter:title", content: "Governance voting — TBS Meridian Realities" },
      { name: "twitter:description", content: "Cast weighted votes on TBS Meridian governance polls." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/voting" }],
  }),
  component: VotingPage,
  errorComponent: ErrorComponent,
});

function VotingPage() {
  const list = useServerFn(listMemberPolls);
  const vote = useServerFn(castPollVote);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["member", "polls"], queryFn: () => list({ data: {} }) });
  const mut = useMutation({
    mutationFn: (input: { pollId: string; optionId: string }) => vote({ data: input }),
    onSuccess: () => { toast.success("Vote recorded"); qc.invalidateQueries({ queryKey: ["member", "polls"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <PageHeader eyebrow="Governance" title="Open polls" description="Cast your vote on group resolutions. One vote per poll; weighted by slots owned." />
      {isLoading && <p className="text-sm text-muted-foreground">Loading polls…</p>}
      <div className="mt-6 grid gap-5">
        {(data ?? []).map((p) => {
          const totalVotes = p.tally.reduce((s: number, t: any) => s + t.votes, 0);
          return (
            <Panel key={p.id} title={p.question} subtitle={p.description ?? undefined}>
              <div className="flex items-center justify-between">
                <StatusPill tone={p.status === "open" ? "ok" : "muted"}>{p.status}</StatusPill>
                {p.closes_at && <span className="text-xs text-muted-foreground">Closes {new Date(p.closes_at).toLocaleDateString()}</span>}
              </div>
              <div className="mt-4 grid gap-2">
                {p.options.map((opt: any) => {
                  const tally = p.tally.find((t: any) => t.option_id === opt.id);
                  const count = tally?.votes ?? 0;
                  const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                  const selected = p.myVote === opt.id;
                  return (
                    <button
                      key={opt.id}
                      disabled={p.status !== "open" || mut.isPending}
                      onClick={() => mut.mutate({ pollId: p.id, optionId: opt.id })}
                      className={`relative w-full overflow-hidden rounded-md border px-4 py-3 text-left text-sm transition-colors ${selected ? "border-gold bg-gold/10" : "border-border hover:bg-muted"}`}
                    >
                      <div className="absolute inset-y-0 left-0 bg-gold/15" style={{ width: `${pct}%` }} />
                      <div className="relative flex items-center justify-between">
                        <span>{opt.label}{selected && " ✓"}</span>
                        <span className="text-xs text-muted-foreground">{count} · {pct}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>
          );
        })}
        {data && data.length === 0 && <p className="text-sm text-muted-foreground">No polls yet.</p>}
      </div>
    </DashboardShell>
  );
}
