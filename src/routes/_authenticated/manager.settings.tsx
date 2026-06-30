import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ManagerPage } from "@/components/manager-page";
import { Panel } from "@/components/dashboard-ui";
import { getGroupSettings, updateGroupSettings } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["mgr", "settings"], queryFn: () => getGroupSettings({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/settings")({
  head: () => ({
    meta: [
      { title: "Manager settings — TBS Meridian Realities" },
      { name: "description", content: "Configure TBS Meridian group settings and subscription terms." },
      { property: "og:title", content: "Manager settings — TBS Meridian Realities" },
      { property: "og:description", content: "Configure TBS Meridian group settings and subscription terms." },
      { property: "og:url", content: "/manager/settings" },
      { name: "twitter:title", content: "Manager settings — TBS Meridian Realities" },
      { name: "twitter:description", content: "Configure TBS Meridian group settings and subscription terms." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/manager/settings" }],
  }),
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Group settings" description="Edit fund metadata, slot capacity, and subscription terms.">
      <Content />
    </ManagerPage>
  ),
});

function Content() {
  const { data: g } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const update = useServerFn(updateGroupSettings);
  const [form, setForm] = useState({
    name: g?.name ?? "", description: g?.description ?? "",
    slot_capacity: g?.slot_capacity?.toString() ?? "",
    slot_price: g?.slot_price?.toString() ?? "",
    subscription_terms: g?.subscription_terms ?? "",
  });
  useEffect(() => { if (g) setForm({
    name: g.name, description: g.description ?? "",
    slot_capacity: g.slot_capacity?.toString() ?? "",
    slot_price: g.slot_price?.toString() ?? "",
    subscription_terms: g.subscription_terms ?? "",
  }); }, [g]);

  const m = useMutation({
    mutationFn: () => update({ data: {
      name: form.name, description: form.description || undefined,
      slot_capacity: form.slot_capacity ? Number(form.slot_capacity) : undefined,
      slot_price: form.slot_price ? Number(form.slot_price) : undefined,
      subscription_terms: form.subscription_terms || undefined,
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "settings"] }); toast.success("Saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const inp = "rounded-md border border-border bg-white px-3 py-2 text-sm w-full";
  return (
    <Panel>
      <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</label>
          <input className={`${inp} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slot capacity</label>
            <input type="number" className={`${inp} mt-1`} value={form.slot_capacity} onChange={(e) => setForm({ ...form, slot_capacity: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slot price (USD)</label>
            <input type="number" className={`${inp} mt-1`} value={form.slot_price} onChange={(e) => setForm({ ...form, slot_price: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
          <textarea rows={3} className={`${inp} mt-1`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscription terms</label>
          <textarea rows={4} className={`${inp} mt-1`} value={form.subscription_terms} onChange={(e) => setForm({ ...form, subscription_terms: e.target.value })} />
        </div>
        <button disabled={m.isPending} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">Save changes</button>
      </form>
    </Panel>
  );
}
