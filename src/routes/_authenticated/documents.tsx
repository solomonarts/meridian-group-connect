import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { getDocumentSignedUrl, listMemberDocuments, signDocument } from "@/lib/member.functions";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Document vault — TBS Meridian Realities" },
      { name: "description", content: "Secure access to TBS Meridian agreements, memos, and statements." },
      { property: "og:title", content: "Document vault — TBS Meridian Realities" },
      { property: "og:description", content: "Secure access to TBS Meridian agreements, memos, and statements." },
      { property: "og:url", content: "/documents" },
      { name: "twitter:title", content: "Document vault — TBS Meridian Realities" },
      { name: "twitter:description", content: "Secure access to TBS Meridian agreements, memos, and statements." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/documents" }],
  }),
  component: DocumentsPage,
  errorComponent: ErrorComponent,
});

function DocumentsPage() {
  const listFn = useServerFn(listMemberDocuments);
  const urlFn = useServerFn(getDocumentSignedUrl);
  const signFn = useServerFn(signDocument);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["member", "documents"], queryFn: () => listFn({ data: {} }) });

  const open = useMutation({
    mutationFn: (id: string) => urlFn({ data: { documentId: id } }),
    onSuccess: ({ url }) => window.open(url, "_blank"),
    onError: (e: Error) => toast.error(e.message),
  });
  const sign = useMutation({
    mutationFn: (id: string) => signFn({ data: { documentId: id } }),
    onSuccess: () => { toast.success("Document signed"); qc.invalidateQueries({ queryKey: ["member", "documents"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <PageHeader eyebrow="Documents" title="Vault" description="Agreements, memos, and statements. All accesses are recorded for audit." />
      <Panel className="mt-6" title="Available documents">
        <div className="divide-y divide-border">
          {(data ?? []).map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{d.title}</div>
                <div className="text-xs text-muted-foreground">{d.mime_type ?? "file"} · {new Date(d.created_at).toLocaleDateString()}</div>
                {d.description && <div className="mt-1 text-xs text-foreground/70">{d.description}</div>}
              </div>
              <div className="flex items-center gap-2">
                {d.requires_signature && <StatusPill tone="warn">Signature required</StatusPill>}
                <Button size="sm" variant="outline" disabled={open.isPending} onClick={() => open.mutate(d.id)}>Open</Button>
                {d.requires_signature && (
                  <Button size="sm" disabled={sign.isPending} onClick={() => sign.mutate(d.id)}>Sign</Button>
                )}
              </div>
            </div>
          ))}
          {data && data.length === 0 && <p className="py-4 text-sm text-muted-foreground">No documents available.</p>}
        </div>
      </Panel>
    </DashboardShell>
  );
}
