"use client";
import Link from "next/link";
import { useState } from "react";
import { useHub } from "./provider";
import { Avatar, LogoutButton } from "./account-menu";
import { DeliveryFields, deliveryFromForm } from "./delivery-fields";
import type { SavedDelivery } from "@/lib/types";

export function ProfileScreen() {
  const h = useHub();
  const [error, setError] = useState("");
  const [addressVersion, setAddressVersion] = useState(0);
  if (!h.profile) return <div className="page section"><h1>My profile</h1><p>Sign in to manage your contact details and saved address.</p><Link className="button primary" href="/account">Sign in</Link></div>;
  const profile = h.profile;
  return <div className="page section profile-page">
    <header className="profile-heading"><Avatar profile={profile} /><div><span className="eyebrow">YOUR FIXIHUB ACCOUNT</span><h1>My profile</h1><p>{profile.display_name}</p></div></header>
    <p className="account-legal">{h.demo ? "Preview account — changes are saved on this browser. Google sign-in is not enabled yet." : "Signed in securely with Google. Your account email comes from Google."}</p>
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="profile-grid">
      <section className="panel">
        <h2>Personal details</h2>
        <form key={profile.id} onSubmit={async e => {
          e.preventDefault(); setError("");
          try { await h.updateName(String(new FormData(e.currentTarget).get("displayName") || "")); }
          catch(e) { setError((e as Error).message); }
        }}>
          <label>Display name<input name="displayName" defaultValue={profile.display_name} maxLength={100} required autoComplete="name" /></label>
          <label>Account email<input type="email" value={profile.email || ""} readOnly /></label>
          <p className="muted">Your name, photo and account email come from your sign-in provider. Changing your FIXIHUB display name will not change your Google account.</p>
          <button className="button primary">Save details</button>
        </form>
        <nav className="profile-shortcuts" aria-label="Profile shortcuts"><Link href="/orders">My orders →</Link><Link href="/privacy">Privacy Policy →</Link></nav>
        <LogoutButton />
      </section>
      <section className="panel">
        <h2>Contact & saved address</h2>
        <p>{h.backendReady ? "Save your delivery details to fill checkout automatically. Changes here do not alter existing orders." : "Saved delivery addresses will be available when the order database is connected. You do not need to enter an address to sign in."}</p>
        {h.backendReady && <form key={`${profile.id}-${addressVersion}`} onSubmit={async e => {
          e.preventDefault(); setError("");
          try {
            deliveryFromForm(e.currentTarget);
            const data = new FormData(e.currentTarget);
            const fields = ["dialCode", "phone", "recipient", "address1", "address2", "postcode", "city", "country", "region"] as const;
            const address = Object.fromEntries(fields.map(key => [key, String(data.get(key) || "").trim()])) as SavedDelivery;
            await h.saveDelivery(address);
          } catch(e) { setError((e as Error).message); }
        }}>
          <DeliveryFields initial={profile.delivery || { recipient: profile.display_name }} />
          <div className="profile-actions"><button className="button primary" disabled={!h.backendReady}>Save address</button>
          {profile.delivery && <button type="button" className="button secondary" onClick={async () => {
            try { await h.saveDelivery(undefined); setAddressVersion(v => v + 1); setError(""); }
            catch(e) { setError((e as Error).message); }
          }}>Remove saved address</button>}</div>
        </form>}
      </section>
    </div>
  </div>;
}
