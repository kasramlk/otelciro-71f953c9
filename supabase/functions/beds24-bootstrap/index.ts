import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // NOTE: NO x-cron-secret check here (that is only for beds24-sync)
    // Authenticate caller using the incoming Authorization header
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: userInfo } = await authClient.auth.getUser();
    const user = userInfo?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    // Admin check via RPC has_role(uid, 'admin'); fallback to users.role
    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let isAdmin = false;

    const { data: rpcOK } = await svc.rpc("has_role", { uid: user.id, role_name: "admin" });
    if (rpcOK === true) {
      isAdmin = true;
    } else {
      // fallback check: users table role column = 'admin'
      const { data: urow } = await svc
        .from("users")
        .select("role")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      isAdmin = (urow?.role ?? "").toString().toLowerCase() === "admin";
    }
    if (!isAdmin) return json({ error: "Forbidden: admin only", uid: user.id }, 403);

    let body: any = {};
    try { body = await req.json(); } catch {}
    const hotelId = body?.hotelId;
    const propertyId = body?.propertyId?.toString()?.trim();

    if (!hotelId || !propertyId) {
      return json({ error: "hotelId and propertyId are required" }, 400);
    }

    // Environment diagnostics (clear messages if something is missing)
    const baseUrl = Deno.env.get("BEDS24_BASE_URL");
    const readToken = Deno.env.get("BEDS24_READ_TOKEN");
    if (!baseUrl) return json({ error: "Missing env: BEDS24_BASE_URL" }, 500);
    if (!readToken) return json({ error: "Missing env: BEDS24_READ_TOKEN" }, 500);

    // Call your shared bootstrap impl (replace with actual import if present)
    if (!(globalThis as any).bootstrap) {
      // If not wired yet, return a helpful message
      return json({
        error: "Bootstrap implementation not found",
        hint: "Wire global bootstrap(hotelId, propertyId) or import the shared function.",
      }, 500);
    }

    const result = await (globalThis as any).bootstrap(hotelId, propertyId);
    return json({ ok: true, result }, 200);
  } catch (err: any) {
    console.error("beds24-bootstrap error:", err);
    return json({ error: err?.message ?? String(err) }, 500);
  }
});