import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_GROUP_ID } from "@/lib/tbs.functions";

const GroupOnly = z.object({ groupId: z.string().uuid().default(DEFAULT_GROUP_ID) });

// ---------- Deals ----------

export const listMemberDeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: deals, error } = await context.supabase
      .from("deals")
      .select("id, title, summary, asset_type, location, target_amount, slot_count, slot_price, status, opens_at, closes_at, created_at")
      .eq("group_id", data.groupId)
      .in("status", ["open", "closed"])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const result = [];
    for (const d of deals ?? []) {
      const [{ data: tally }, { data: avail }, { data: myVote }] = await Promise.all([
        context.supabase.rpc("deal_vote_tally", { _deal_id: d.id }),
        context.supabase.rpc("deal_slot_availability", { _deal_id: d.id }),
        context.supabase.from("deal_votes").select("vote").eq("deal_id", d.id).eq("user_id", context.userId).maybeSingle(),
      ]);
      result.push({
        ...d,
        tally: tally?.[0] ?? { yes: 0, no: 0, abstain: 0 },
        availability: avail?.[0] ?? { total: 0, allocated: 0, available: 0 },
        myVote: myVote?.vote ?? null,
      });
    }
    return result;
  });

export const castDealVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ dealId: z.string().uuid(), vote: z.enum(["yes", "no", "abstain"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("deal_votes")
      .upsert({ deal_id: data.dealId, user_id: context.userId, vote: data.vote }, { onConflict: "deal_id,user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Polls ----------

export const listMemberPolls = createServerFn({ method: "GET" })
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
      const [{ data: opts }, { data: tally }, { data: myVote }] = await Promise.all([
        context.supabase.from("poll_options").select("id, label, position").eq("poll_id", p.id).order("position"),
        context.supabase.rpc("poll_vote_tally", { _poll_id: p.id }),
        context.supabase.from("poll_votes").select("option_id").eq("poll_id", p.id).eq("user_id", context.userId).maybeSingle(),
      ]);
      result.push({ ...p, options: opts ?? [], tally: tally ?? [], myVote: myVote?.option_id ?? null });
    }
    return result;
  });

export const castPollVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ pollId: z.string().uuid(), optionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("poll_votes")
      .upsert({ poll_id: data.pollId, user_id: context.userId, option_id: data.optionId }, { onConflict: "poll_id,user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Allocations ----------

export const getCapacity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase.rpc("group_slot_availability", { _group_id: data.groupId });
    return rows?.[0] ?? { total: 0, allocated: 0, available: 0 };
  });

export const listMyAllocations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("slot_allocations")
      .select("id, deal_id, slots_requested, status, notes, created_at")
      .eq("group_id", data.groupId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const dealIds = Array.from(new Set((rows ?? []).map((r) => r.deal_id).filter(Boolean)));
    const { data: deals } = dealIds.length
      ? await context.supabase.from("deals").select("id, title").in("id", dealIds)
      : { data: [] as any[] };
    const dmap = new Map((deals ?? []).map((d) => [d.id, d.title]));
    return (rows ?? []).map((r) => ({ ...r, dealTitle: r.deal_id ? dmap.get(r.deal_id) ?? null : null }));
  });

export const createAllocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      slots: z.number().int().positive(),
      dealId: z.string().uuid().optional(),
      notes: z.string().optional(),
      groupId: z.string().uuid().default(DEFAULT_GROUP_ID),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("slot_allocations").insert({
      group_id: data.groupId,
      user_id: context.userId,
      deal_id: data.dealId ?? null,
      slots_requested: data.slots,
      notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelAllocation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("slot_allocations")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Documents ----------

export const listMemberDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("documents")
      .select("id, title, description, mime_type, size_bytes, requires_signature, created_at")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getDocumentSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ documentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("id, storage_path, group_id, title")
      .eq("id", data.documentId)
      .maybeSingle();
    if (error || !doc) throw new Error("Document not found");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("group-documents")
      .createSignedUrl(doc.storage_path, 300);
    if (signErr) throw new Error(signErr.message);
    await supabaseAdmin.from("document_events").insert({
      document_id: doc.id,
      user_id: context.userId,
      event_type: "view",
    });
    return { url: signed.signedUrl };
  });

export const signDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ documentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("document_signatures").insert({
      document_id: data.documentId,
      user_id: context.userId,
    });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    await supabaseAdmin.from("document_events").insert({
      document_id: data.documentId,
      user_id: context.userId,
      event_type: "sign",
    });
    return { ok: true };
  });

// ---------- Announcements ----------

export const listMemberAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .eq("group_id", data.groupId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.id);
    if (!ids.length) return [];
    const { data: reads } = await context.supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", context.userId)
      .in("announcement_id", ids);
    const readSet = new Set((reads ?? []).map((r) => r.announcement_id));
    return (rows ?? []).map((r) => ({ ...r, read: readSet.has(r.id) }));
  });

export const markAnnouncementRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ announcementId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("announcement_reads")
      .insert({ announcement_id: data.announcementId, user_id: context.userId });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Payments ----------

export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GroupOnly.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("payments")
      .select("id, amount, currency, description, due_at, status, proof_path, verified_at, created_at")
      .eq("group_id", data.groupId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const recordPaymentProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ paymentId: z.string().uuid(), proofPath: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("payments")
      .update({ proof_path: data.proofPath, status: "submitted" })
      .eq("id", data.paymentId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Profile ----------

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      full_name: z.string().optional(),
      country: z.string().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.full_name, country: data.country })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
