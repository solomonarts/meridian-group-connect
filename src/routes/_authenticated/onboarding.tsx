import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { completeOnboarding, getMyOnboardingStatus } from "@/lib/member.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your account — TBS Meridian Realities" },
      { name: "description", content: "Set your new password and complete your TBS Meridian profile." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/onboarding" }],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const statusFn = useServerFn(getMyOnboardingStatus);
  const completeFn = useServerFn(completeOnboarding);
  const { data: me } = useQuery({ queryKey: ["onboarding-me"], queryFn: () => statusFn() });

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (me) {
      setFullName(me.full_name ?? "");
      setCountry(me.country ?? "");
      setPhone(me.phone ?? "");
      setBio(me.bio ?? "");
      setAvatarUrl(me.avatar_url ?? "");
    }
  }, [me]);

  const submit = useMutation({
    mutationFn: async () => {
      if (password.length < 8) throw new Error("Password must be at least 8 characters");
      if (password !== confirm) throw new Error("Passwords do not match");
      if (!fullName.trim()) throw new Error("Full name is required");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await completeFn({ data: { full_name: fullName, country, phone, bio, avatar_url: avatarUrl } });
    },
    onSuccess: () => {
      toast.success("Welcome to TBS Meridian");
      navigate({ to: "/portal" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      setAvatarUrl(path);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream px-6 py-14">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="text-[10px] font-semibold tracking-[0.3em] text-gold">TBS MERIDIAN</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Complete your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set a new password and personalize your profile. This one-time setup replaces the temporary password shared by your manager.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); submit.mutate(); }}
          className="mt-8 grid gap-4"
        >
          <section className="grid gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New password</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters" className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
              <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password" className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
            </div>
          </section>

          <section className="mt-2 grid gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name" className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                placeholder="Country" className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone" className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
            </div>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Short bio (optional)"
              className="rounded-md border border-border bg-white px-3 py-2 text-sm" />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile picture</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                  {avatarUrl ? <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Saved</span>
                    : <span className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">—</span>}
                </div>
                <input type="file" accept="image/*" onChange={onAvatarChange} disabled={uploading}
                  className="text-xs text-muted-foreground" />
              </div>
            </div>
          </section>

          <button type="submit" disabled={submit.isPending}
            className="mt-4 rounded-md bg-navy px-6 py-3 text-sm font-semibold text-gold hover:opacity-90 disabled:opacity-50">
            {submit.isPending ? "Saving…" : "Finish setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
