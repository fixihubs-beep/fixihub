export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ ready: !!process.env.SUPABASE_SERVICE_ROLE_KEY }, { headers: { "Cache-Control": "no-store" } });
}
