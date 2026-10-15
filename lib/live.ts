import { supabase } from "./supabase";
import type { Data, Profile } from "./types";
export type PaymentSetup = { enabled: boolean; qr_url: string; payee: string; support: string; bank_name?: string; account_number?: string; instructions?: string };
export type LiveSnapshot = Partial<Data> & { profile?: Profile; payment: PaymentSetup };
export async function liveCall<T = unknown>(action: string, data: object = {}): Promise<T> {
  if (!supabase) throw Error("The store connection is unavailable.");
  const result = await supabase.rpc("fixihub_live", { p_action: action, p_data: data });
  if (result.error) {
    if (["PGRST202", "42883", "3F000"].includes(result.error.code)) throw Error("The order system is being configured. Please check back shortly.");
    if (result.error.code === "23505") throw Error("This order or transfer reference has already been submitted. Refresh your orders before retrying.");
    throw Error(result.error.message || "The request could not be completed.");
  }
  return result.data as T;
}

export async function submitLiveReceipt(orderId: string, file: File, reference: string) {
  if (!supabase) throw Error("Sign in first.");
  const { path } = await liveCall<{ path: string }>("upload.reserve", { order_id: orderId, mime: file.type });
  const { error } = await supabase.storage.from("fixihub-receipts").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw Error("The receipt could not upload. Check your connection and try again.");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw Error("Sign in again to submit your receipt.");
  // Only a small JSON request crosses the app host; the 10 MB file goes directly to private storage.
  const response = await fetch("/api/receipts/submit", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ path, reference }) });
  const result = await response.json();
  if (!response.ok) throw Error(result.error || "Receipt verification failed. Refresh your order before retrying.");
}

export async function paymentSettings(data?: object): Promise<PaymentSetup> {
  if (!supabase) throw Error("Store connection unavailable.");
  const result = await supabase.rpc("fixihub_payment_settings", { p_data: data || null });
  if (result.error) throw Error(result.error.message);
  const settings = result.data as PaymentSetup;
  if (settings.qr_url.startsWith("/storage/v1/")) settings.qr_url = process.env.NEXT_PUBLIC_SUPABASE_URL + settings.qr_url;
  return settings;
}
