import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { listMemberAnnouncements, markAnnouncementRead } from "@/lib/member.functions";

export const Route = createFileRoute("/_authenticated/announcements")({
  component: AnnouncementsPage,
  errorComponent: ErrorComponent,
});

function AnnouncementsPage() {
  const listFn = useServerFn(listMemberAnnouncements);
  const readFn = useServerFn(markAnnouncementRead);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["member", "announcements"], queryFn: () => listFn({ data: {} }) });
  const mut = useMutation({
    mutationFn: (id: string) => readFn({ data: { announcementId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["member", "announcements"] }),
  });

  return (
    <DashboardShell>
      <PageHeader eyebrow="Announcements" title="Broadcasts" description="Manager updates and group notices." />
      <div className="mt-6 grid gap-4">
        {(data ?? []).map((a) => (
          <Panel key={a.id} title={a.title} subtitle={new Date(a.created_at).toLocaleString()}>
            <p className="whitespace-pre-wrap text-sm text-foreground/85">{a.body}</p>
            {!a.read && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={() => mut.mutate(a.id)} disabled={mut.isPending}>Mark as read</Button>
              </div>
            )}
          </Panel>
        ))}
        {data && data.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
      </div>
    </DashboardShell>
  );
}
