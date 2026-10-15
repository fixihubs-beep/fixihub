"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, UserRound, LogOut } from "lucide-react";
import { useHub } from "./provider";
import { Modal } from "./ui";
import type { Profile } from "@/lib/types";

export function Avatar({ profile }: { profile: Profile }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [profile.avatar_url]);
  const safe = profile.avatar_url?.startsWith("https://");
  return <span className="profile-avatar" aria-hidden="true">
    {safe && !failed ? <img src={profile.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : profile.display_name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join("")}
  </span>;
}

export function LogoutButton() {
  const h = useHub(), router = useRouter();
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false);
  return <>
    <button type="button" className="text-link" onClick={() => setConfirm(true)}><LogOut size={16} /> Log out</button>
    {confirm && <Modal title="Log out of FIXIHUB?" onClose={() => { if (!busy) setConfirm(false); }}>
      <p>Your saved profile and orders will remain. Your shopping bag will be cleared. Any active checkout timer continues; logging out does not cancel an order.</p>
      <div className="profile-actions">
        <button className="button secondary" disabled={busy} onClick={() => setConfirm(false)}>Stay signed in</button>
        <button className="button primary" disabled={busy} onClick={async () => {
          setBusy(true);
          try { await h.logout(); setConfirm(false); router.push("/"); }
          catch(e) { h.notify((e as Error).message); }
          finally { setBusy(false); }
        }}>{busy ? "Logging out…" : "Confirm logout"}</button>
      </div>
    </Modal>}
  </>;
}

export function AccountMenu() {
  const h = useHub(), path = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [path, h.profile?.id]);
  useEffect(() => {
    const outside = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && open) { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  if (!h.profile) return <Link className="account-signin" href="/account">Sign in</Link>;
  return <div className="account-menu" ref={ref}>
    <button ref={trigger} className="account-trigger" aria-label={`Account: ${h.profile.display_name}`} aria-expanded={open} aria-controls="account-options" onClick={() => setOpen(!open)}>
      <Avatar profile={h.profile} /><span>{h.profile.display_name.split(" ")[0]}</span><ChevronDown size={14} />
    </button>
    {open && <div className="account-dropdown" id="account-options">
      <strong>{h.profile.display_name}</strong><small>{h.profile.email}</small>
      <Link href="/profile"><UserRound size={16} /> My profile</Link>
      <LogoutButton />
    </div>}
  </div>;
}
