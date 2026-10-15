"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHub } from "@/components/provider";
import { FixiLoading } from "@/components/fixi-feedback";

export default function CallbackPage() {
  const h = useHub(), router = useRouter();
  useEffect(() => { if (h.ready && h.profile && !h.error) router.replace("/profile"); }, [h.ready, h.profile, h.error, router]);
  if (h.error || (h.ready && !h.profile)) return <div className="page section">
    <h1>Let’s try signing in again.</h1>
    <p>{h.error || "Your sign-in could not be completed."}</p>
    <Link className="button primary" href="/account">Back to sign in</Link>
  </div>;
  return <FixiLoading />;
}
