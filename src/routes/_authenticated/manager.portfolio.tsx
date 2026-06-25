import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerPage, fmtMoney } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { listPortfolio } from "@/lib/tbs.functions";
import { createAsset, deleteAsset, updateAsset } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["portfolio"], queryFn: () => listPortfolio({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/portfolio")({
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Portfolio" description="Maintain the fund's asset register and valuations.">
      <Content />
    </ManagerPage>
  ),
});

const empty = { name: "", asset_type: "", location: "", description: "", acquisition_value: "", current_value: "", income_type: "", allocation_pct: "", status: "target" as const };

function Content() {
  const { data: assets } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const create = useServerFn(createAsset);
  const update = useServerFn(updateAsset);
  const del = useServerFn(deleteAsset);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["portfolio"] });
  const payload = (f: typeof form) => ({
    name: f.name, asset_type: f.asset_type, location: f.location || undefined,
    description: f.description || undefined,
    acquisition_value: f.acquisition_value ? Number(f.acquisition_value) : undefined,
    current_value: f.current_value ? Number(f.current_value) : undefined,
    income_type: f.income_type || undefined,
    allocation_pct: f.allocation_pct ? Number(f.allocation_pct) : undefined,
    status: f.status,
  });

  const cM = useMutation({
    mutationFn: () => create({ data: payload(form) }),
    onSuccess: () => { refresh(); toast.success("Created"); setForm(empty); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const uM = useMutation({
    mutationFn: () => update({ data: { id: editing!, ...payload(form) } }),
    onSuccess: () => { refresh(); toast.success("Saved"); setEditing(null); setForm(empty); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const dM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { refresh(); toast.success("Deleted"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const inp = "rounded-md border border-border bg-white px-3 py-2 text-sm";

  return (
    <>
      <Panel>
        <div className="text-sm font-semibold">{editing ? "Edit asset" : "New asset"}</div>
        <form onSubmit={(e) => { e.preventDefault(); editing ? uM.mutate() : cM.mutate(); }} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
          <input required placeholder="Asset type" value={form.asset_type} onChange={(e) => setForm({ ...form, asset_type: e.target.value })} className={inp} />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inp} />
          <input placeholder="Income type" value={form.income_type} onChange={(e) => setForm({ ...form, income_type: e.target.value })} className={inp} />
          <input type="number" placeholder="Acquisition value" value={form.acquisition_value} onChange={(e) => setForm({ ...form, acquisition_value: e.target.value })} className={inp} />
          <input type="number" placeholder="Current value" value={form.current_value} onChange={(e) => setForm({ ...form, current_value: e.target.value })} className={inp} />
          <input type="number" step="0.1" placeholder="Allocation %" value={form.allocation_pct} onChange={(e) => setForm({ ...form, allocation_pct: e.target.value })} className={inp} />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className={inp}>
            <option value="target">target</option><option value="under_review">under_review</option>
            <option value="owned">owned</option><option value="partner">partner</option>
          </select>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inp} sm:col-span-2`} rows={2} />
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={cM.isPending || uM.isPending} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">
              {editing ? "Save" : "Create"}
            </button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="rounded-md border border-border px-4 py-2 text-xs font-semibold">Cancel</button>}
          </div>
        </form>
      </Panel>

      <div className="mt-8 space-y-3">
        {assets.map((a) => (
          <Panel key={a.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold">{a.name}</div>
                  <StatusPill tone={a.status === "owned" ? "success" : a.status === "target" ? "navy" : "gold"}>{a.status.replace("_", " ")}</StatusPill>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{a.asset_type}{a.location ? ` · ${a.location}` : ""} · {fmtMoney(a.current_value as any)}</div>
                {a.description && <p className="mt-2 text-sm">{a.description}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => { setEditing(a.id); setForm({
                  name: a.name, asset_type: a.asset_type, location: a.location ?? "", description: a.description ?? "",
                  acquisition_value: a.acquisition_value?.toString() ?? "", current_value: a.current_value?.toString() ?? "",
                  income_type: a.income_type ?? "", allocation_pct: a.allocation_pct?.toString() ?? "",
                  status: a.status as any,
                }); }} className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-muted">Edit</button>
                <button onClick={() => dM.mutate(a.id)} disabled={dM.isPending}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50">Delete</button>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
