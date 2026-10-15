import type { User } from "@supabase/supabase-js";
import type { Profile } from "./types";
import { supabase } from "./supabase";

// Presentation only. Database permissions must be enforced by RLS/RPCs.
// Never grant staff access from user-editable metadata or a mock identity.
export function googleProfile(user: User): Profile | null {
  if (!user.identities?.some(identity => identity.provider === "google")) return null;
  const metadata = user.user_metadata || {};
  const name = [metadata.fixihub_display_name, metadata.full_name, metadata.name].find(value => typeof value === "string" && value.trim());
  const avatar = [metadata.avatar_url, metadata.picture].find(value => typeof value === "string" && value.startsWith("https://"));
  return { id: user.id, email: user.email, display_name: name?.slice(0, 100) || "Reader", avatar_url: avatar, role: "customer", active: true };
}

let exchange: Promise<void> | undefined;
export async function finishGoogleCallback() {
  if (exchange) return exchange;
  exchange = (async () => {
    if (!supabase) throw Error("Sign-in is not configured. Please try again later.");
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const denied = params.has("error") || new URLSearchParams(window.location.hash.slice(1)).has("error");
    // Remove one-time credentials and provider errors from browser history.
    window.history.replaceState({}, "", "/auth/callback");
    if (denied) throw Error("Google sign-in was cancelled or declined. Please try again.");
    if (!code) throw Error("This sign-in link is missing or expired. Please start again.");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw Error("This sign-in link could not be verified. Start again in the same browser.");
  })();
  return exchange;
}

export async function verifiedGoogleProfile() {
  if (!supabase) throw Error("Sign-in is not configured. Please try again later.");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  // getSession alone reads local storage; verify the user with Supabase.
  const { data, error } = await supabase.auth.getUser();
  if (error) throw Error("We could not verify your session. Check your connection and sign in again.");
  const profile = googleProfile(data.user);
  if (!profile) {
    await supabase.auth.signOut({ scope: "local" });
    throw Error("Please sign in using Google.");
  }
  return profile;
}
