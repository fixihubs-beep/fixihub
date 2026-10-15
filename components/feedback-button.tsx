"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { useHub } from './provider';
import { Modal } from './ui';
import { wakeNotifications } from "@/lib/notification-client";
import { supabase } from '@/lib/supabase';
export function FeedbackButton() {
 const h=useHub(),path=usePathname();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState(false),[id,setId]=useState('');
 return <>
  <button className="feedback-float" onClick={()=>{setId(crypto.randomUUID());setOpen(true);setSent(false);setError('');}} aria-label="Send feedback or report an issue"><MessageSquare size={18}/><span>Feedback</span></button>
  {open && <Modal title="Feedback & support" onClose={()=>{if(!busy)setOpen(false);}}>
   {sent ? <div role="status"><h3>Thanks. Your message has been saved.</h3><p>Our team will review it and can reply using your account email.</p><small>Reference: {id}</small></div> : !h.profile ? <><p>Sign in so we can connect your message to your account and reply to you.</p><Link className="button primary" href="/account" onClick={()=>setOpen(false)}>Sign in with Google</Link></> : <form onSubmit={async e=>{
    e.preventDefault();setBusy(true);setError('');const form=new FormData(e.currentTarget);
    try {if(!supabase)throw Error('Connection unavailable.');const r=await supabase.rpc('fixihub_feedback',{p_id:id,p_category:form.get('category'),p_message:form.get('message'),p_page:path.slice(0,200)});if(r.error)throw Error(r.error.code==='PGRST202'?'Feedback is being configured. Please try again later.':r.error.message);void wakeNotifications();setSent(true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
   }}>
    <p>Tell us what happened. Include your order ID if relevant. Do not include passwords, card details or bank login information.</p>
    <label>Topic<select name="category" required>{['Feedback','Order issue','Payment issue','Website issue'].map(c=><option key={c}>{c}</option>)}</select></label>
    <label>Your message<textarea name="message" required minLength={10} maxLength={2000} rows={5}/></label>
    <p className="fineprint">Sent as {h.profile.display_name} ({h.profile.email}). Your message and account contact details are shared with our support team through Telegram.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="button primary wide" disabled={busy}>{busy?'Sending…':'Send feedback'}</button>
   </form>}
  </Modal>}
 </>;
}
