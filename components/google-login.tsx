"use client";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useHub } from "./provider";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Avatar, LogoutButton } from "./account-menu";

export function GoogleLogin() {
  const h = useHub();
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  return <div className="page section google-login-page">
    <Link href="/" className="login-back"><ArrowLeft size={15} /> Back to the bookshelf</Link>
    <div className="login-layout">
    <header className="login-intro">
      <img src="/brand/fixihublogo.jpg" alt="FIXI" width={56} height={56} />
      <span className="eyebrow">YOUR FIXIHUB ACCOUNT</span>
      <h1>{h.profile ? "Welcome back." : <>Good stories.<br />One sign-in.</>}</h1>
      <p>Your profile, saved delivery details and orders. All in one place.</p>
      <span className="login-edition">THE INDEPENDENT BOOKSHELF / FIXIHUB</span>
    </header>
    <section className="panel login-card" aria-label="Google sign-in">
      {h.profile ? <>
        <div className="profile-heading"><Avatar profile={h.profile} /><div><strong>{h.profile.display_name}</strong><p>{h.profile.email}</p></div></div>
        <div className="profile-actions"><Link className="button primary" href="/profile">My profile</Link><LogoutButton /></div>
      </> : <>
        <span className="eyebrow">LET’S GET YOU SETTLED</span>
        <h2>Sign in to FIXIHUB</h2>
        <p>New here? Your account is created on your first sign-in.</p>
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
        }}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.05a10 10 0 0 0 0 9.02l3.35-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59C7.19 7.72 9.4 5.96 12 5.96Z"/></svg>{busy ? "Opening Google…" : "Continue with Google"}<ArrowUpRight size={17} /></button>
        <p className="login-security"><ShieldCheck size={16} /> No extra password. FIXIHUB never sees your Google password.</p>
        <p className="account-legal">By continuing, you agree to our <Link href="/terms">Terms of Service</Link>. Read our <Link href="/privacy">Privacy Policy</Link> to understand how we use your information.</p>
      </>}
    </section>
    </div>
    <p className="account-legal login-store-note">{h.commerceAvailable ? "KACAU preorders are open. Browse the edition to reserve your copy." : "Website ordering and payment collection are not open yet."}</p>
  </div>;
}
