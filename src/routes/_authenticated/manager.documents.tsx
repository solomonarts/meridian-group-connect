import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerPage, fmtDate } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { deleteDocument, getDocumentDownloadUrl, listDocuments, toggleDocumentSignature } from "@/lib/manager.functions";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_GROUP_ID } from "@/lib/tbs.functions";

const qo = queryOptions({ queryKey: ["mgr", "documents"], queryFn: () => listDocuments({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/documents")({
  head: () => ({
    meta: [
      { title: "Manage documents — TBS Meridian Realities" },
      { name: "description", content: "Upload and manage TBS Meridian agreements, memos, and statements." },
      { property: "og:title", content: "Manage documents — TBS Meridian Realities" },
      { property: "og:description", content: "Upload and manage TBS Meridian agreements, memos, and statements." },
      { property: "og:url", content: "/manager/documents" },
      { name: "twitter:title", content: "Manage documents — TBS Meridian Realities" },
      { name: "twitter:description", content: "Upload and manage TBS Meridian agreements, memos, and statements." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/manager/documents" }],
  }),
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Documents" description="Upload group documents and track signatures.">
      <Content />
    </ManagerPage>
  ),
});

function Content() {
  const { data: docs } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const toggle = useServerFn(toggleDocumentSignature);
  const del = useServerFn(deleteDocument);
  const dl = useServerFn(getDocumentDownloadUrl);
  const [title, setTitle] = useState("");
  const [requires, setRequires] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title) return;
    setUploading(true);
    try {
      const path = `${DEFAULT_GROUP_ID}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("group-documents").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("documents").insert({
        group_id: DEFAULT_GROUP_ID, title, storage_path: path,
        mime_type: file.type, size_bytes: file.size, requires_signature: requires,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["mgr", "documents"] });
      toast.success("Uploaded");
      setTitle(""); setFile(null); setRequires(false);
      (document.getElementById("doc-file") as HTMLInputElement | null)?.value && ((document.getElementById("doc-file") as HTMLInputElement).value = "");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const tM = useMutation({
    mutationFn: (v: { id: string; requires: boolean }) => toggle({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "documents"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const dM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "documents"] }); toast.success("Deleted"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  async function download(id: string) {
    try {
      const { url } = await dl({ data: { id } });
      window.open(url, "_blank");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  }

  const inp = "rounded-md border border-border bg-white px-3 py-2 text-sm";

  return (
    <>
      <Panel>
        <form onSubmit={upload} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={inp} />
          <input id="doc-file" required type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={inp} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={requires} onChange={(e) => setRequires(e.target.checked)} />
            Requires member signature
          </label>
          <button disabled={uploading} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </Panel>

      <div className="mt-8 space-y-3">
        {docs.length === 0 ? <Panel><p className="text-sm text-muted-foreground">No documents.</p></Panel> :
          docs.map((d) => (
            <Panel key={d.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{d.title}</div>
                    {d.requires_signature && <StatusPill tone="navy">signature</StatusPill>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {fmtDate(d.created_at)} · {d.signature_count} signatures · {d.mime_type ?? "—"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => download(d.id)} className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted">Download</button>
                  <button onClick={() => tM.mutate({ id: d.id, requires: !d.requires_signature })} className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                    {d.requires_signature ? "Drop signature" : "Require signature"}
                  </button>
                  <button onClick={() => dM.mutate(d.id)} disabled={dM.isPending}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50">Delete</button>
                </div>
              </div>
            </Panel>
          ))}
      </div>
    </>
  );
}
