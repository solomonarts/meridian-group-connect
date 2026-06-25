import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TBS Meridian Realities" },
      { name: "description", content: "Sign in to the TBS Meridian member portal." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/portal" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/portal" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/portal`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
        navigate({ to: "/portal" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/portal" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16" style={{ background: "var(--gradient-navy)" }}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-sm text-navy-foreground"
        style={{ boxShadow: "var(--shadow-elegant)" }}
      >
        <Link to="/" className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
          ← TBS Meridian
        </Link>
        <h1 className="mt-4 text-2xl font-bold">{mode === "signin" ? "Member sign in" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-navy-muted">
          {mode === "signin" ? "Access the portal and applications." : "Apply for membership and review status."}
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mt-6 w-full rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-navy-muted">
          <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          {mode === "signup" && (
            <input
              type="text"
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm placeholder:text-navy-muted focus:border-gold focus:outline-none"
            />
          )}
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm placeholder:text-navy-muted focus:border-gold focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm placeholder:text-navy-muted focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md px-6 py-3 text-sm font-semibold text-navy-ink transition-transform hover:-translate-y-px disabled:opacity-50"
            style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-5 w-full text-center text-xs text-navy-muted hover:text-gold"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already a member? Sign in"}
        </button>
      </div>
    </div>
  );
}
