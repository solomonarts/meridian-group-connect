import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerPage } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { addMemberByEmail, listMembers, removeMember } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["mgr", "members"], queryFn: () => listMembers({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/members")({
  head: () => ({
    meta: [
      { title: "Members directory — TBS Meridian Realities" },
      { name: "description", content: "Manage TBS Meridian members and roles." },
      { property: "og:title", content: "Members directory — TBS Meridian Realities" },
      { property: "og:description", content: "Manage TBS Meridian members and roles." },
      { property: "og:url", content: "/manager/members" },
      { name: "twitter:title", content: "Members directory — TBS Meridian Realities" },
      { name: "twitter:description", content: "Manage TBS Meridian members and roles." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/manager/members" }],
  }),
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Members" description="Add or remove members and managers of TBS Meridian Fund I.">
      <Content />
    </ManagerPage>
  ),
});

function Content() {
  const { data: members } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const add = useServerFn(addMemberByEmail);
  const rm = useServerFn(removeMember);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "manager">("member");

  const addM = useMutation({
    mutationFn: () => add({ data: { email, role } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "members"] }); toast.success("Member added"); setEmail(""); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const rmM = useMutation({
    mutationFn: (roleId: string) => rm({ data: { roleId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "members"] }); toast.success("Removed"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <>
      <Panel>
        <form onSubmit={(e) => { e.preventDefault(); if (email) addM.mutate(); }} className="flex flex-col gap-3 sm:flex-row">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com"
            className="flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm" />
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded-md border border-border bg-white px-3 py-2 text-sm">
            <option value="member">Member</option><option value="manager">Manager</option>
          </select>
          <button disabled={addM.isPending} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">
            Add by email
          </button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">The email must belong to an existing TBS account.</p>
      </Panel>

      <div className="mt-8 space-y-2">
        {members.length === 0 ? <Panel><p className="text-sm text-muted-foreground">No members yet.</p></Panel> :
          members.map((m) => (
            <Panel key={m.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{m.profile?.full_name ?? "—"}</div>
                    <StatusPill tone={m.role === "manager" || m.role === "admin" ? "navy" : "gold"}>{m.role}</StatusPill>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.profile?.email ?? m.user_id}</div>
                </div>
                <button onClick={() => rmM.mutate(m.id)} disabled={rmM.isPending}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50">
                  Remove
                </button>
              </div>
            </Panel>
          ))}
      </div>
    </>
  );
}
