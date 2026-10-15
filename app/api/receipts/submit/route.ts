import { createClient } from "@supabase/supabase-js";
import { RECEIPT_LIMIT, RECEIPT_TYPES, validateReceiptSignature } from "@/lib/receipt-validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const reply = (error: string, status: number) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publicKey || !secret) return reply("Receipt verification is not configured. Contact payment support before transferring money.", 503);
  const token = request.headers.get("authorization");
  if (!token?.startsWith("Bearer ")) return reply("Sign in first.", 401);
  if (Number(request.headers.get("content-length") || 0) > 4096) return reply("Invalid request.", 400);
  try {
    const body = await request.text();
    if (body.length > 4096) return reply("Invalid request.", 400);
    const { path, reference } = JSON.parse(body);
    if (typeof path !== "string" || path.length > 240 || typeof reference !== "string" || reference.trim().length < 3 || reference.length > 120) return reply("Enter a valid receipt and transfer reference.", 400);
    const client = createClient(url, publicKey, { global: { headers: { Authorization: token } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await client.auth.getUser(token.slice(7));
    if (error || !user || !user.identities?.some(i => i.provider === "google")) return reply("Sign in with Google again.", 401);
    const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
    if (!new RegExp(`^${user.id}/${uuid}/${uuid}\\.(png|jpg|pdf)$`).test(path)) return reply("Receipt access denied.", 403);
    // Download with the caller's token: Storage RLS must authorise the read first.
    const downloaded = await client.storage.from("fixihub-receipts").download(path);
    if (downloaded.error || !downloaded.data) return reply("Receipt unavailable. Please upload it again.", 400);
    const file = downloaded.data;
    const type = file.type.split(";")[0];
    if (!file.size || file.size > RECEIPT_LIMIT || !RECEIPT_TYPES.includes(type)) return reply("Use a JPG, PNG or PDF up to 10 MB.", 400);
    validateReceiptSignature(new Uint8Array(await file.slice(0, 8).arrayBuffer()), type);
    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const result = await admin.rpc("fixihub_finalize_receipt", { p_user: user.id, p_path: path, p_reference: reference.trim() });
    if (result.error) return reply(result.error.code === "23505" ? "This receipt or transfer reference has already been submitted. Refresh your orders." : result.error.message, 409);
    return Response.json(result.data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return reply("Receipt could not be verified. Use a valid JPG, PNG or PDF and try again. If you already paid, do not pay again.", 400);
  }
}
