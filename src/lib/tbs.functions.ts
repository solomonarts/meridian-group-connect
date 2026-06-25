import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DEFAULT_GROUP_ID = "00000000-0000-0000-0000-000000000001";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// ----- Public reads -----

export const listPortfolio = createServerFn({ method: "GET" })
  .inputValidator((input: { groupId?: string } | undefined) =>
    z.object({ groupId: z.string().uuid().default(DEFAULT_GROUP_ID) }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("portfolio_assets")
      .select("id,name,asset_type,location,description,acquisition_value,current_value,income_type,allocation_pct,status")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listReports = createServerFn({ method: "GET" })
  .inputValidator((input: { groupId?: string } | undefined) =>
    z.object({ groupId: z.string().uuid().default(DEFAULT_GROUP_ID) }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("reports")
      .select("id,period,nav,contributions,distributions,irr")
      .eq("group_id", data.groupId)
      .order("period", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listAuditEvents = createServerFn({ method: "GET" })
  .inputValidator((input: { groupId?: string; limit?: number } | undefined) =>
    z
      .object({
        groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
        limit: z.number().int().min(1).max(100).default(25),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("audit_events")
      .select("id,event_type,actor_name,title,description,created_at")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ----- Application submission (anon-friendly, uses service role guarded by zod) -----

const applicationSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  slots_requested: z.number().int().min(1).max(5).optional(),
  motivation: z.string().trim().max(2000).optional().or(z.literal("")),
  group_id: z.string().uuid().default(DEFAULT_GROUP_ID),
  user_id: z.string().uuid().nullable().optional(),
});

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => applicationSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("applications")
      .insert({
        full_name: data.full_name,
        email: data.email,
        country: data.country || null,
        slots_requested: data.slots_requested ?? null,
        motivation: data.motivation || null,
        group_id: data.group_id,
        user_id: data.user_id ?? null,
        status: "submitted",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_events").insert({
      event_type: "membership",
      actor_name: data.full_name,
      group_id: data.group_id,
      title: "Membership application submitted",
      description: `${data.full_name} submitted an application for review.`,
    });

    return { id: row.id };
  });

// ----- Authenticated (member/manager) -----

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id,full_name,email,country")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role,group_id")
      .eq("user_id", context.userId);
    return { profile, roles: roles ?? [] };
  });

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("applications")
      .select("id,full_name,email,country,slots_requested,motivation,status,created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["submitted", "review", "kyc", "approved", "rejected"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("applications")
      .update({ status: data.status, reviewer_id: context.userId })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
