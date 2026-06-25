import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { submitApplication } from "@/lib/tbs.functions";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Valid email required").max(255),
  country: z.string().trim().max(80).optional(),
  slots_requested: z.coerce.number().int().min(1).max(5).optional(),
  motivation: z.string().trim().max(2000).optional(),
});

export function ApplyForm() {
  const [form, setForm] = useState({ full_name: "", email: "", country: "", slots_requested: "", motivation: "" });
  const submit = useServerFn(submitApplication);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse({
        ...form,
        slots_requested: form.slots_requested ? Number(form.slots_requested) : undefined,
      });
      const { data: session } = await supabase.auth.getSession();
      return submit({ data: { ...parsed, user_id: session.session?.user.id ?? null } });
    },
    onSuccess: () => {
      toast.success("Application submitted. We'll be in touch.");
      setForm({ full_name: "", email: "", country: "", slots_requested: "", motivation: "" });
    },
    onError: (e) => {
      if (e instanceof z.ZodError) toast.error(e.issues[0]?.message ?? "Invalid input");
      else toast.error(e instanceof Error ? e.message : "Submission failed");
    },
  });

  return (
    <form
      id="apply"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="mt-14 grid max-w-3xl gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm sm:grid-cols-2"
    >
      <input
        required
        type="text"
        placeholder="Full name"
        value={form.full_name}
        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
        className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-gold focus:outline-none"
      />
      <input
        required
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-gold focus:outline-none"
      />
      <input
        type="text"
        placeholder="Country"
        value={form.country}
        onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
        className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-gold focus:outline-none"
      />
      <input
        type="number"
        min={1}
        max={5}
        placeholder="Slots requested (1–5)"
        value={form.slots_requested}
        onChange={(e) => setForm((f) => ({ ...f, slots_requested: e.target.value }))}
        className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-gold focus:outline-none"
      />
      <textarea
        placeholder="Why are you a fit for the association? (optional)"
        rows={3}
        value={form.motivation}
        onChange={(e) => setForm((f) => ({ ...f, motivation: e.target.value }))}
        className="sm:col-span-2 rounded-md border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-navy-foreground placeholder:text-navy-muted focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        disabled={mutation.isPending}
        className="sm:col-span-2 rounded-md px-6 py-3 text-sm font-semibold text-navy-ink transition-transform hover:-translate-y-px disabled:opacity-50"
        style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-glow)" }}
      >
        {mutation.isPending ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
