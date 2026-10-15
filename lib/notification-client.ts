import { supabase } from './supabase';
// A failed wake-up must never undo a successful order, registration or feedback submission.
export async function wakeNotifications() {
 try {
  if(!supabase) return;
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return;
  await fetch('/api/notifications/immediate',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`},keepalive:true,signal:AbortSignal.timeout(5000)});
 } catch { /* The durable queue is retried by the scheduled worker. */ }
}
