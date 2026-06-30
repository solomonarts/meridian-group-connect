import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { listMyPayments, recordPaymentProof } from "@/lib/member.functions";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — TBS Meridian Realities" },
      { name: "description", content: "Track contributions, distributions, and upload proof of transfer." },
      { property: "og:title", content: "Payments — TBS Meridian Realities" },
      { property: "og:description", content: "Track contributions, distributions, and upload proof of transfer." },
      { property: "og:url", content: "/payments" },
      { name: "twitter:title", content: "Payments — TBS Meridian Realities" },
      { name: "twitter:description", content: "Track contributions, distributions, and upload proof of transfer." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/payments" }],
  }),
  component: PaymentsPage,
  errorComponent: ErrorComponent,
});

const fmt = (n: number, c: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);

function statusTone(s: string): "ok" | "warn" | "muted" {
  if (s === "verified" || s === "paid") return "ok";
  if (s === "overdue") return "warn";
  return "muted";
}

function PaymentsPage() {
  const listFn = useServerFn(listMyPayments);
  const recordFn = useServerFn(recordPaymentProof);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["member", "payments"], queryFn: () => listFn({ data: {} }) });
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const upload = useMutation({
    mutationFn: async ({ paymentId, file }: { paymentId: string; file: File }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${uid}/${paymentId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: true });
      if (error) throw new Error(error.message);
      await recordFn({ data: { paymentId, proofPath: path } });
    },
    onSuccess: () => { toast.success("Proof uploaded"); qc.invalidateQueries({ queryKey: ["member", "payments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <PageHeader eyebrow="Payments" title="Capital calls & contributions" description="Track due payments and upload proof of transfer." />
      <Panel className="mt-6" title="My payments">
        <div className="divide-y divide-border">
          {(data ?? []).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <div className="text-sm font-medium">{fmt(Number(p.amount), p.currency)}</div>
                <div className="text-xs text-muted-foreground">
                  {p.description ?? "—"}{p.due_at ? ` · due ${new Date(p.due_at).toLocaleDateString()}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill tone={statusTone(p.status)}>{p.status}</StatusPill>
                {(p.status === "pending" || p.status === "overdue") && (
                  <>
                    <input
                      ref={(el) => { fileRefs.current[p.id] = el; }}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload.mutate({ paymentId: p.id, file: f });
                      }}
                    />
                    <Button size="sm" variant="outline" disabled={upload.isPending} onClick={() => fileRefs.current[p.id]?.click()}>
                      Upload proof
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {data && data.length === 0 && <p className="py-4 text-sm text-muted-foreground">No payments scheduled.</p>}
        </div>
      </Panel>
    </DashboardShell>
  );
}
