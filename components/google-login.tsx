"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useHub } from "./provider";
import { Avatar, LogoutButton } from "./account-menu";

export function GoogleLogin() {
  const h = useHub();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <div className="page section google-login-page">
    <span className="eyebrow">YOUR FIXIHUB ACCOUNT</span>
    <h1>{h.profile ? "You're signed in." : "Sign in"}</h1>
    <p>One account for your profile and your next chapter.</p>
    <section className="panel">
      {h.profile ? <>
        <div className="profile-heading"><Avatar profile={h.profile} /><div><strong>{h.profile.display_name}</strong><p>{h.profile.email}</p></div></div>
        <div className="profile-actions"><Link className="button primary" href="/profile">My profile</Link><LogoutButton /></div>
      </> : <>
        <h2>Continue with Google</h2>
        <p>Use your Google account. No separate FIXIHUB password is needed.</p>
        {error && <p className="notice error" role="alert">{error}</p>}
        <button className="button secondary google-signin" disabled={busy} onClick={async () => {
          setError(""); setBusy(true);
          try {
            if (!supabase) throw Error("Sign-in is not configured. Please try again later.");
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
              headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "" },
            });
            if (!response.ok) throw Error("Sign-in is unavailable. Please try again later.");
            const settings = await response.json();
            if (!settings.external?.google) throw Error("Google sign-in is being configured. Please try again shortly.");
            const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              scopes: "openid email profile", queryParams: { prompt: "select_account" },
            } });
            if (error) throw Error("Google sign-in is unavailable. Please try again later.");
          } catch(e) { setError((e as Error).message); setBusy(false); }
        }}>{busy ? "Opening Google…" : "Continue with Google"}</button>
        <p className="account-legal">By continuing, you agree to our <Link href="/terms">Terms of Service</Link>. Read our <Link href="/privacy">Privacy Policy</Link> to understand how we use your information.</p>
      </>}
    </section>
    <p className="account-legal">{h.commerceAvailable ? "KACAU preorders are open. Browse the edition to reserve your copy." : "Website ordering and payment collection are not open yet."}</p>
  </div>;
}
