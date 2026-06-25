import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyProfile } from "@/lib/tbs.functions";
import { updateMyProfile } from "@/lib/member.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
  errorComponent: ErrorComponent,
});

function ProfilePage() {
  const fn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => fn() });
  const profile = data?.profile ?? null;
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setCountry(profile.country ?? "");
    }
  }, [profile]);

  const mut = useMutation({
    mutationFn: () => updateFn({ data: { full_name: fullName, country } }),
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell email={profile?.email ?? null}>
      <PageHeader eyebrow="Profile" title="Identity & KYC" description="Maintain contact information and KYC details." />
      <Panel className="mt-6" title="Personal details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled />
          </div>
          <div>
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>Save changes</Button>
        </div>
      </Panel>
    </DashboardShell>
  );
}
