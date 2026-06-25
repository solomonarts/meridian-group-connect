import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerPage, fmtMoney, fmtDate } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { createPayment, listPayments, updatePaymentStatus } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["mgr", "payments"], queryFn: () => listPayments({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/payments")({
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Payments" description="Create payment requests and verify member-submitted proofs.">
      <Content />
    </ManagerPage>
  ),
});

type S = "pending" | "submitted" | "verified" | "paid" | "overdue" | "cancelled";
const tone = (s: S) => (s === "paid" || s === "verified" ? "success" : s === "overdue" || s === "cancelled" ? "danger" : "gold");

function Content() {
  const { data: rows } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const create = useServerFn(createPayment);
  const setStatus = useServerFn(updatePaymentStatus);
  const [form, setForm] = useState({ user_email: "", amount: "", description: "", due_at: "" });

  const cM = useMutation({
    mutationFn: () => create({ data: {
      user_email: form.user_email,
      amount: Number(form.amount),
      description: form.description || undefined,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : undefined,
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "payments"] }); toast.success("Request created"); setForm({ user_email: "", amount: "", description: "", due_at: "" }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const sM = useMutation({
    mutationFn: (v: { id: string; status: S }) => setStatus({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "payments"] }); toast.success("Updated"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const inp = "rounded-md border border-border bg-white px-3 py-2 text-sm";

  return (
    <>
      <Panel>
        <div className="text-sm font-semibold">New payment request</div>
        <form onSubmit={(e) => { e.preventDefault(); if (form.user_email && form.amount) cM.mutate(); }}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required type="email" placeholder="member@example.com" value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} className={inp} />
          <input required type="number" placeholder="Amount (USD)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inp} />
          <input type="date" placeholder="Due date" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} className={inp} />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inp} />
          <button disabled={cM.isPending} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50 sm:col-span-2">Create</button>
        </form>
      </Panel>

      <div className="mt-8 space-y-3">
        {rows.length === 0 ? <Panel><p className="text-sm text-muted-foreground">No payments.</p></Panel> :
          rows.map((p) => (
            <Panel key={p.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{fmtMoney(p.amount as any, p.currency)}</div>
                    <StatusPill tone={tone(p.status as S)}>{p.status}</StatusPill>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.profile?.full_name ?? p.profile?.email ?? p.user_id}{p.due_at ? ` · due ${fmtDate(p.due_at)}` : ""}
                  </div>
                  {p.description && <p className="mt-2 text-sm">{p.description}</p>}
                  {p.proof_path && <p className="mt-1 text-xs text-status-success-foreground">Proof uploaded</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {(["verified", "paid", "overdue", "cancelled"] as S[]).map((s) => (
                    <button key={s} disabled={sM.isPending || p.status === s} onClick={() => sM.mutate({ id: p.id, status: s })}
                      className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50">{s}</button>
                  ))}
                </div>
              </div>
            </Panel>
          ))}
      </div>
    </>
  );
}
