import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  errorComponent: ErrorComponent,
});

function SettingsPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function updatePassword() {
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setPassword(""); }
  }

  async function signOutEverywhere() {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) toast.error(error.message);
    else toast.success("Signed out across devices");
  }

  return (
    <DashboardShell>
      <PageHeader eyebrow="Settings" title="Account & security" description="Manage your password and active sessions." />
      <Panel className="mt-6" title="Change password">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <Label>New password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
          </div>
          <div className="flex items-end">
            <Button onClick={updatePassword} disabled={busy}>Update</Button>
          </div>
        </div>
      </Panel>
      <Panel className="mt-6" title="Sessions">
        <p className="text-sm text-muted-foreground">Sign out of all devices where you are currently logged in.</p>
        <div className="mt-3">
          <Button variant="outline" onClick={signOutEverywhere}>Sign out everywhere</Button>
        </div>
      </Panel>
    </DashboardShell>
  );
}
