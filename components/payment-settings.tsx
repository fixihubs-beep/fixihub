"use client";
import { useState } from "react";
import { useHub } from "./provider";
import { supabase } from "@/lib/supabase";
import { paymentSettings } from "@/lib/live";
import { receiptValid } from "@/lib/rules";
import { validateReceiptSignature } from "@/lib/receipt-validation";
export function PaymentSettings() {
  const h = useHub();
  const [file, setFile] = useState<File | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  if (h.profile?.role !== "superadmin") return null;
  return <section className="panel"><h2>Merchant QR & bank details</h2>
    <p>Customers will see these payment instructions. Pause preorders and finish active payment reservations before changing them.</p>
    {h.demo && <p>Saving payment settings requires the live Supabase database and a superadmin account.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    <form className="merchant-settings" key={JSON.stringify(h.payment)} onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError("");
      const data = new FormData(e.currentTarget);
      try {
        let qr_path: string | undefined;
        if (file) {
          receiptValid(file);
          if (!["image/png","image/jpeg"].includes(file.type)) throw Error("Use a PNG or JPG QR image.");
          validateReceiptSignature(new Uint8Array(await file.slice(0,8).arrayBuffer()),file.type);
          if (!supabase) throw Error("Store connection unavailable.");
          qr_path = crypto.randomUUID() + (file.type === "image/png" ? ".png" : ".jpg");
          const upload = await supabase.storage.from("fixihub-payment-qr").upload(qr_path,file,{contentType:file.type,upsert:false});
          if (upload.error) throw Error("QR upload failed. Check your superadmin access and installed SQL.");
        }
        await paymentSettings({ payee:data.get("payee"),bank_name:data.get("bank_name"),account_number:data.get("account_number"),support:data.get("support"),instructions:data.get("instructions"),qr_path });
        setFile(null); await h.refresh(); h.notify("Payment instructions saved.");
      } catch(e) { setError((e as Error).message); } finally { setBusy(false); }
    }}>
      <label>Account holder / payee<input name="payee" required maxLength={150} defaultValue={h.payment?.payee || ""} /></label>
      <label>Bank name<input name="bank_name" required maxLength={100} defaultValue={h.payment?.bank_name || ""} /></label>
      <label>Bank account number<input name="account_number" required inputMode="numeric" pattern="[0-9 -]{5,40}" maxLength={40} defaultValue={h.payment?.account_number || ""} /></label>
      <label>Payment-support email or phone<input name="support" required maxLength={200} defaultValue={h.payment?.support || ""} /></label>
      <label>Additional payment instructions<textarea name="instructions" maxLength={1000} defaultValue={h.payment?.instructions || ""} /></label>
      {h.payment?.qr_url && <img className="merchant-qr" src={h.payment.qr_url} width={180} height={180} alt="Current merchant payment QR" />}
      <label>Upload merchant QR (JPG or PNG, maximum 10 MB)<input type="file" accept="image/png,image/jpeg" onChange={e => setFile(e.target.files?.[0] || null)} /></label>
      <label className="checkbox"><input type="checkbox" required />I checked that the account number and QR payee match the intended merchant.</label>
      <button className="button primary" disabled={busy || h.demo || !h.backendReady || !!h.payment?.enabled}>{busy ? "Saving…" : "Save payment settings"}</button>
    </form>
  </section>;
}
