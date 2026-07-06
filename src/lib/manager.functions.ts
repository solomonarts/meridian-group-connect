import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_GROUP_ID } from "@/lib/tbs.functions";

const GroupOnly = z.object({ groupId: z.string().uuid().default(DEFAULT_GROUP_ID) });

async function assertManager(supabase: any, userId: string, groupId: string) {
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return;
  const { data: ok } = await supabase.rpc("is_group_manager", { _uid: userId, _group_id: groupId });
  if (!ok) throw new Error("Forbidden: manager role required");
}

// ---------- Overview ----------

export const getManagerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [{ count: memberCount }, { count: pendingApps }, { count: openDeals }, { count: openPolls }, { count: pendingPayments }, slot, { data: group }] =
      await Promise.all([
        sb.from("user_roles").select("id", { count: "exact", head: true }).eq("group_id", data.groupId).eq("role", "member"),
        sb.from("applications").select("id", { count: "exact", head: true }).eq("group_id", data.groupId).in("status", ["submitted", "review", "kyc"]),
        sb.from("deals").select("id", { count: "exact", head: true }).eq("group_id", data.groupId).eq("status", "open"),
        sb.from("polls").select("id", { count: "exact", head: true }).eq("group_id", data.groupId).eq("status", "open"),
        sb.from("payments").select("id", { count: "exact", head: true }).eq("group_id", data.groupId).in("status", ["pending", "submitted", "overdue"]),
        sb.rpc("group_slot_availability", { _group_id: data.groupId }),
        sb.from("groups").select("name,slot_capacity").eq("id", data.groupId).maybeSingle(),
      ]);
    return {
      group,
      memberCount: memberCount ?? 0,
      pendingApps: pendingApps ?? 0,
      openDeals: openDeals ?? 0,
      openPolls: openPolls ?? 0,
      pendingPayments: pendingPayments ?? 0,
      slots: slot.data?.[0] ?? { total: 0, allocated: 0, available: 0 },
    };
  });

// ---------- Members ----------

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("id, role, user_id, created_at")
      .eq("group_id", data.groupId);
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (ids.length === 0) return [];
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, full_name, email, country")
      .in("id", ids);
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (roles ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
  });

function generateTempPassword() {
  // 12 chars, mixed-case alnum + symbol
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const nums = "23456789";
  const sym = "!@#$%^&*";
  const pool = alpha + nums + sym;
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += pool[b % pool.length];
  // ensure at least one of each
  return out.slice(0, 9) + alpha[bytes[9] % alpha.length] + nums[bytes[10] % nums.length] + sym[bytes[11] % sym.length];
}

export const createMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      email: z.string().email(),
      full_name: z.string().trim().min(2).max(120),
      role: z.enum(["member", "manager"]).default("member"),
      groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId, data.groupId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    // Reject if account already exists
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) throw new Error(listErr.message);
    const existing = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (existing) throw new Error("An account with that email already exists.");

    const tempPassword = generateTempPassword();
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create account");

    const uid = created.user.id;
    // Trigger handle_new_user inserts profile + applicant role. Force flag + name.
    await supabaseAdmin.from("profiles").upsert({ id: uid, email, full_name: data.full_name, must_change_password: true });
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: uid, role: data.role, group_id: data.groupId });
    if (roleErr && !roleErr.message.includes("duplicate")) throw new Error(roleErr.message);

    await supabaseAdmin.from("audit_events").insert({
      event_type: "membership",
      group_id: data.groupId,
      actor_id: context.userId,
      title: `Created ${data.role} account`,
      description: `${data.full_name} <${email}> onboarded as ${data.role}.`,
    });
    return { ok: true, email, tempPassword };
  });


export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ roleId: z.string().uuid(), groupId: z.string().uuid().default(DEFAULT_GROUP_ID) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId, data.groupId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("id", data.roleId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Leadership ----------

export const listLeadership = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("leadership_positions")
      .select("id, user_id, position, appointed_at")
      .eq("group_id", data.groupId);
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, full_name, email").in("id", ids)
      : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
  });

export const appointLeader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      email: z.string().email(),
      position: z.enum(["chair", "secretary", "treasurer", "leader"]).default("leader"),
      groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId, data.groupId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const user = list.users.find((u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase());
    if (!user) throw new Error("No account with that email.");
    const { error } = await supabaseAdmin.from("leadership_positions").insert({
      group_id: data.groupId,
      user_id: user.id,
      position: data.position,
      appointed_by: context.userId,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const removeLeader = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), groupId: z.string().uuid().default(DEFAULT_GROUP_ID) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId, data.groupId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leadership_positions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Deals ----------

export const listDeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("deals")
      .select("*")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      title: z.string().min(2),
      summary: z.string().optional(),
      asset_type: z.string().optional(),
      location: z.string().optional(),
      target_amount: z.number().nonnegative().optional(),
      slot_count: z.number().int().min(0).default(0),
      slot_price: z.number().nonnegative().optional(),
      groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { groupId, ...rest } = data;
    const { error } = await context.supabase.from("deals").insert({
      group_id: groupId,
      created_by: context.userId,
      ...rest,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateDealStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["draft", "open", "closed", "cancelled"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("deals").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Slot allocations ----------

export const listAllocations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("slot_allocations")
      .select("id, user_id, deal_id, slots_requested, status, notes, created_at")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, full_name, email").in("id", ids)
      : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
  });

export const decideAllocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["requested", "approved", "committed", "cancelled"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("slot_allocations").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Payments ----------

export const listPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("payments")
      .select("id, user_id, amount, currency, description, due_at, status, proof_path, verified_at, created_at")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, full_name, email").in("id", ids)
      : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
  });

export const createPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      user_email: z.string().email(),
      amount: z.number().positive(),
      currency: z.string().default("USD"),
      description: z.string().optional(),
      due_at: z.string().datetime().optional(),
      groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId, data.groupId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    const user = list.users.find((u) => (u.email ?? "").toLowerCase() === data.user_email.toLowerCase());
    if (!user) throw new Error("No account with that email.");
    const { error } = await supabaseAdmin.from("payments").insert({
      group_id: data.groupId,
      user_id: user.id,
      amount: data.amount,
      currency: data.currency,
      description: data.description ?? null,
      due_at: data.due_at ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updatePaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "submitted", "verified", "paid", "overdue", "cancelled"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: any = { status: data.status };
    if (data.status === "verified" || data.status === "paid") {
      patch.verified_by = context.userId;
      patch.verified_at = new Date().toISOString();
    }
    const { error } = await context.supabase.from("payments").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPaymentAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ paymentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("payment_audit")
      .select("id, from_status, to_status, actor_id, note, created_at")
      .eq("payment_id", data.paymentId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// ---------- Polls ----------

export const listPolls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: polls, error } = await context.supabase
      .from("polls")
      .select("id, question, description, status, closes_at, created_at")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const result = [];
    for (const p of polls ?? []) {
      const { data: tally } = await context.supabase.rpc("poll_vote_tally", { _poll_id: p.id });
      result.push({ ...p, tally: tally ?? [] });
    }
    return result;
  });

export const createPoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      question: z.string().min(3),
      description: z.string().optional(),
      options: z.array(z.string().min(1)).min(2).max(8),
      closes_at: z.string().datetime().optional(),
      groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: poll, error } = await context.supabase.from("polls").insert({
      group_id: data.groupId,
      question: data.question,
      description: data.description ?? null,
      closes_at: data.closes_at ?? null,
      created_by: context.userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    const optRows = data.options.map((label, i) => ({ poll_id: poll.id, label, position: i }));
    const { error: optErr } = await context.supabase.from("poll_options").insert(optRows);
    if (optErr) throw new Error(optErr.message);
    return { id: poll.id };
  });

export const closePoll = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("polls").update({ status: "closed" }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Announcements ----------

export const listAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const result = [];
    for (const a of rows ?? []) {
      const { count } = await context.supabase
        .from("announcement_reads")
        .select("id", { count: "exact", head: true })
        .eq("announcement_id", a.id);
      result.push({ ...a, reads: count ?? 0 });
    }
    return result;
  });

export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      title: z.string().min(2),
      body: z.string().min(2),
      groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").insert({
      group_id: data.groupId,
      title: data.title,
      body: data.body,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Documents ----------

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: docs, error } = await context.supabase
      .from("documents")
      .select("id, title, description, storage_path, mime_type, size_bytes, requires_signature, created_at")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const result = [];
    for (const d of docs ?? []) {
      const { count: sigs } = await context.supabase
        .from("document_signatures").select("id", { count: "exact", head: true }).eq("document_id", d.id);
      result.push({ ...d, signature_count: sigs ?? 0 });
    }
    return result;
  });

export const toggleDocumentSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), requires: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("documents").update({ requires_signature: data.requires }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), groupId: z.string().uuid().default(DEFAULT_GROUP_ID) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId, data.groupId);
    const { data: doc } = await context.supabase.from("documents").select("storage_path").eq("id", data.id).maybeSingle();
    if (doc?.storage_path) {
      await context.supabase.storage.from("group-documents").remove([doc.storage_path]);
    }
    const { error } = await context.supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("documents").select("storage_path").eq("id", data.id).maybeSingle();
    if (error || !doc) throw new Error("Document not found");
    const { data: signed, error: sErr } = await context.supabase.storage
      .from("group-documents")
      .createSignedUrl(doc.storage_path, 300);
    if (sErr || !signed) throw new Error(sErr?.message ?? "Failed to sign URL");
    await context.supabase.from("document_events").insert({
      document_id: data.id, user_id: context.userId, event_type: "downloaded",
    });
    return { url: signed.signedUrl };
  });

// ---------- Portfolio CRUD ----------

const PortfolioInput = z.object({
  name: z.string().min(2),
  asset_type: z.string().min(2),
  location: z.string().optional(),
  description: z.string().optional(),
  acquisition_value: z.number().nonnegative().optional(),
  current_value: z.number().nonnegative().optional(),
  income_type: z.string().optional(),
  allocation_pct: z.number().min(0).max(100).optional(),
  status: z.enum(["owned", "under_review", "target", "partner"]).default("target"),
  groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
});

export const createAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PortfolioInput.parse(input))
  .handler(async ({ data, context }) => {
    const { groupId, ...rest } = data;
    const { error } = await context.supabase.from("portfolio_assets").insert({ group_id: groupId, ...rest });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    PortfolioInput.partial().extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, groupId: _g, ...patch } = data as any;
    const { error } = await context.supabase.from("portfolio_assets").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("portfolio_assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Group settings ----------

export const getGroupSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: g, error } = await context.supabase
      .from("groups")
      .select("id, name, slug, description, slot_capacity, slot_price, subscription_terms")
      .eq("id", data.groupId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return g;
  });

export const updateGroupSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      slot_capacity: z.number().int().min(1).optional(),
      slot_price: z.number().nonnegative().optional(),
      subscription_terms: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId, data.groupId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { groupId, ...patch } = data;
    const { error } = await supabaseAdmin.from("groups").update(patch).eq("id", groupId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
