import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { castDealVote, listMemberDeals } from "@/lib/member.functions";

export const Route = createFileRoute("/_authenticated/deals")({
  head: () => ({
    meta: [
      { title: "Deal room — TBS Meridian Realities" },
      { name: "description", content: "Live partner-backed opportunities open to TBS Meridian members for review and voting." },
      { property: "og:title", content: "Deal room — TBS Meridian Realities" },
      { property: "og:description", content: "Live partner-backed opportunities open to TBS Meridian members for review and voting." },
      { property: "og:url", content: "/deals" },
      { name: "twitter:title", content: "Deal room — TBS Meridian Realities" },
      { name: "twitter:description", content: "Live partner-backed opportunities open to TBS Meridian members for review and voting." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/deals" }],
  }),
  component: DealsPage,
  errorComponent: ErrorComponent,
});

function DealsPage() {
  const list = useServerFn(listMemberDeals);
  const vote = useServerFn(castDealVote);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["member", "deals"], queryFn: () => list({ data: {} }) });
  const mut = useMutation({
    mutationFn: (input: { dealId: string; vote: "yes" | "no" | "abstain" }) => vote({ data: input }),
    onSuccess: () => { toast.success("Vote recorded"); qc.invalidateQueries({ queryKey: ["member", "deals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <PageHeader eyebrow="Deal Room" title="Partner-backed opportunities" description="Review live deals, cast your vote, and track slot availability." />
      {isLoading && <p className="text-sm text-muted-foreground">Loading deals…</p>}
      <div className="mt-6 grid gap-5">
        {(data ?? []).map((d) => (
          <Panel key={d.id} title={d.title} subtitle={`${d.asset_type ?? "—"} · ${d.location ?? "—"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusPill tone={d.status === "open" ? "ok" : "muted"}>{d.status}</StatusPill>
              <div className="text-xs text-muted-foreground">
                Slots {d.availability.allocated}/{d.availability.total} · Yes {d.tally.yes} · No {d.tally.no} · Abstain {d.tally.abstain}
              </div>
            </div>
            {d.summary && <p className="mt-3 text-sm text-foreground/80">{d.summary}</p>}
            {d.status === "open" && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Your vote:</span>
                {(["yes", "no", "abstain"] as const).map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    variant={d.myVote === v ? "default" : "outline"}
                    disabled={mut.isPending}
                    onClick={() => mut.mutate({ dealId: d.id, vote: v })}
                  >
                    {v}
                  </Button>
                ))}
              </div>
            )}
          </Panel>
        ))}
        {data && data.length === 0 && <p className="text-sm text-muted-foreground">No deals available yet.</p>}
      </div>
    </DashboardShell>
  );
}
