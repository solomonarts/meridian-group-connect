import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerPage, fmtMoney } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { createDeal, listDeals, updateDealStatus } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["mgr", "deals"], queryFn: () => listDeals({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/deals")({
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Deals" description="Create investment deals and publish them for member voting.">
      <Content />
    </ManagerPage>
  ),
});

type Status = "draft" | "open" | "closed" | "cancelled";
const tone = (s: Status) => (s === "open" ? "success" : s === "closed" ? "navy" : s === "cancelled" ? "danger" : "gold");

function Content() {
  const { data: deals } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const create = useServerFn(createDeal);
  const setStatus = useServerFn(updateDealStatus);
  const [form, setForm] = useState({ title: "", summary: "", asset_type: "", location: "", target_amount: "", slot_count: "", slot_price: "" });

  const cM = useMutation({
    mutationFn: () => create({ data: {
      title: form.title, summary: form.summary || undefined, asset_type: form.asset_type || undefined,
      location: form.location || undefined,
      target_amount: form.target_amount ? Number(form.target_amount) : undefined,
      slot_count: form.slot_count ? Number(form.slot_count) : 0,
      slot_price: form.slot_price ? Number(form.slot_price) : undefined,
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "deals"] }); toast.success("Deal created"); setForm({ title: "", summary: "", asset_type: "", location: "", target_amount: "", slot_count: "", slot_price: "" }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const sM = useMutation({
    mutationFn: (v: { id: string; status: Status }) => setStatus({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "deals"] }); toast.success("Updated"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const inp = "rounded-md border border-border bg-white px-3 py-2 text-sm";

  return (
    <>
      <Panel>
        <div className="text-sm font-semibold">New deal</div>
        <form onSubmit={(e) => { e.preventDefault(); if (form.title) cM.mutate(); }} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inp} />
          <input placeholder="Asset type" value={form.asset_type} onChange={(e) => setForm({ ...form, asset_type: e.target.value })} className={inp} />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inp} />
          <input placeholder="Target amount (USD)" type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} className={inp} />
          <input placeholder="Slot count" type="number" value={form.slot_count} onChange={(e) => setForm({ ...form, slot_count: e.target.value })} className={inp} />
          <input placeholder="Slot price (USD)" type="number" value={form.slot_price} onChange={(e) => setForm({ ...form, slot_price: e.target.value })} className={inp} />
          <textarea placeholder="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className={`${inp} sm:col-span-2`} rows={3} />
          <button disabled={cM.isPending} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50 sm:col-span-2">Create draft</button>
        </form>
      </Panel>

      <div className="mt-8 space-y-3">
        {deals.length === 0 ? <Panel><p className="text-sm text-muted-foreground">No deals yet.</p></Panel> :
          deals.map((d) => (
            <Panel key={d.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold">{d.title}</div>
                    <StatusPill tone={tone(d.status as Status)}>{d.status}</StatusPill>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {d.asset_type ?? "—"}{d.location ? ` · ${d.location}` : ""} · target {fmtMoney(d.target_amount as any)} · {d.slot_count} slots @ {fmtMoney(d.slot_price as any)}
                  </div>
                  {d.summary && <p className="mt-3 text-sm">{d.summary}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {(["draft", "open", "closed", "cancelled"] as Status[]).map((s) => (
                    <button key={s} disabled={sM.isPending || d.status === s} onClick={() => sM.mutate({ id: d.id, status: s })}
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
