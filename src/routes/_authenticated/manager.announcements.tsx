import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerPage, fmtDate } from "@/components/manager-page";
import { Panel } from "@/components/dashboard-ui";
import { createAnnouncement, deleteAnnouncement, listAnnouncements } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["mgr", "announcements"], queryFn: () => listAnnouncements({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/announcements")({
  head: () => ({
    meta: [
      { title: "Manage announcements — TBS Meridian Realities" },
      { name: "description", content: "Broadcast updates and track read receipts for TBS Meridian members." },
      { property: "og:title", content: "Manage announcements — TBS Meridian Realities" },
      { property: "og:description", content: "Broadcast updates and track read receipts for TBS Meridian members." },
      { property: "og:url", content: "/manager/announcements" },
      { name: "twitter:title", content: "Manage announcements — TBS Meridian Realities" },
      { name: "twitter:description", content: "Broadcast updates and track read receipts for TBS Meridian members." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/manager/announcements" }],
  }),
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Announcements" description="Broadcast updates and track read receipts.">
      <Content />
    </ManagerPage>
  ),
});

function Content() {
  const { data: rows } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const create = useServerFn(createAnnouncement);
  const del = useServerFn(deleteAnnouncement);
  const [form, setForm] = useState({ title: "", body: "" });

  const cM = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "announcements"] }); toast.success("Posted"); setForm({ title: "", body: "" }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const dM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "announcements"] }); toast.success("Deleted"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const inp = "rounded-md border border-border bg-white px-3 py-2 text-sm w-full";

  return (
    <>
      <Panel>
        <form onSubmit={(e) => { e.preventDefault(); if (form.title && form.body) cM.mutate(); }} className="space-y-3">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} />
          <textarea required placeholder="Message" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inp} rows={4} />
          <button disabled={cM.isPending} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">Broadcast</button>
        </form>
      </Panel>

      <div className="mt-8 space-y-3">
        {rows.length === 0 ? <Panel><p className="text-sm text-muted-foreground">No announcements yet.</p></Panel> :
          rows.map((a) => (
            <Panel key={a.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold">{a.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{fmtDate(a.created_at)} · {a.reads} reads</div>
                  <p className="mt-3 text-sm whitespace-pre-line">{a.body}</p>
                </div>
                <button disabled={dM.isPending} onClick={() => dM.mutate(a.id)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50">Delete</button>
              </div>
            </Panel>
          ))}
      </div>
    </>
  );
}
