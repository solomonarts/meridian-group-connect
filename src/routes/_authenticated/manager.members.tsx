import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ManagerPage } from "@/components/manager-page";
import { Panel, StatusPill } from "@/components/dashboard-ui";
import { createMember, listMembers, removeMember } from "@/lib/manager.functions";

const qo = queryOptions({ queryKey: ["mgr", "members"], queryFn: () => listMembers({ data: {} }) });

export const Route = createFileRoute("/_authenticated/manager/members")({
  head: () => ({
    meta: [
      { title: "Members directory — TBS Meridian Realities" },
      { name: "description", content: "Create and manage TBS Meridian member accounts." },
      { property: "og:title", content: "Members directory — TBS Meridian Realities" },
      { property: "og:description", content: "Create and manage TBS Meridian member accounts." },
      { property: "og:url", content: "/manager/members" },
      { name: "twitter:title", content: "Members directory — TBS Meridian Realities" },
      { name: "twitter:description", content: "Create and manage TBS Meridian member accounts." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/manager/members" }],
  }),
  component: () => (
    <ManagerPage eyebrow="MANAGER" title="Members" description="Create member accounts, share a one-time password, and manage roles.">
      <Content />
    </ManagerPage>
  ),
});

function Content() {
  const { data: members } = useSuspenseQuery(qo);
  const qc = useQueryClient();
  const create = useServerFn(createMember);
  const rm = useServerFn(removeMember);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "manager">("member");
  const [issued, setIssued] = useState<{ email: string; tempPassword: string } | null>(null);

  const createM = useMutation({
    mutationFn: () => create({ data: { email, full_name: fullName, role } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["mgr", "members"] });
      setIssued({ email: res.email, tempPassword: res.tempPassword });
      setEmail(""); setFullName("");
      toast.success("Account created");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const rmM = useMutation({
    mutationFn: (roleId: string) => rm({ data: { roleId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mgr", "members"] }); toast.success("Removed"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <>
      <Panel title="Create member account" subtitle="An account is created with a one-time password. The member is required to set a new password and complete their profile on first sign-in.">
        <form
          onSubmit={(e) => { e.preventDefault(); if (email && fullName) createM.mutate(); }}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"
        >
          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name"
            className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@example.com"
            className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded-md border border-border bg-white px-3 py-2 text-sm">
            <option value="member">Member</option><option value="manager">Manager</option>
          </select>
          <button disabled={createM.isPending} className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-gold hover:opacity-90 disabled:opacity-50">
            {createM.isPending ? "Creating…" : "Create account"}
          </button>
        </form>
      </Panel>

      {issued && (
        <Panel className="mt-4 border-gold/40 bg-gold/5" title="One-time password issued" subtitle="Share this password with the member through a secure channel. It will not be shown again.">
          <div className="mt-2 grid gap-2 text-sm">
            <div><span className="text-muted-foreground">Email: </span><span className="font-mono">{issued.email}</span></div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Password:</span>
              <code className="rounded bg-navy px-2 py-1 font-mono text-gold">{issued.tempPassword}</code>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(issued.tempPassword); toast.success("Copied"); }}
                className="rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
              >Copy</button>
              <button
                type="button"
                onClick={() => setIssued(null)}
                className="ml-auto rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted"
              >Dismiss</button>
            </div>
          </div>
        </Panel>
      )}

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
