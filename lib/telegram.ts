import { createClient } from '@supabase/supabase-js';
export type NotificationJob = { id:string; kind:'LOGIN'|'ORDER'|'PAYMENT'|'FEEDBACK'; lease:string; attempts:number; payload:Record<string, unknown> };
export function notificationText(job:NotificationJob) {
 const p=job.payload;
 const line=(label:string,value:unknown)=>`${label}: ${String(value ?? '—')}`;
 switch(job.kind) {
  case 'LOGIN': return ['NEW USER',line('Name',p.display_name),line('Email',p.email),line('User ID',p.id)].join('\n');
  case 'ORDER': return ['NEW ORDER · Awaiting payment',line('Order ID',p.id),line('Name',p.customer_name),line('Address',p.address),line('Quantity',p.quantity),line('Phone',p.phone),line('Email',p.email),line('Total MYR',Number(p.book_total)+Number(p.shipping_total))].join('\n');
  case 'PAYMENT': return ['PAYMENT PROOF · Requires bank verification',line('Order ID',p.order_id),line('Payment ID',p.id),line('Reference',p.reference),line('Amount MYR',p.amount)].join('\n');
  case 'FEEDBACK': return ['FEEDBACK',line('ID',p.id),line('Category',p.category),line('Name',p.name),line('Email',p.email),line('Page',p.page),String(p.message)].join('\n');
 }
}
export async function dispatchNotifications(userId?: string) {
 const token=process.env.TELEGRAM_BOT_TOKEN, chat=process.env.TELEGRAM_CHAT_ID;
 const topics=Object.fromEntries(['LOGIN','ORDER','PAYMENT','FEEDBACK'].map(k=>[k,process.env[`TELEGRAM_TOPIC_${k}`]]));
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!token || !chat || !url || !key || Object.values(topics).some(t=>!t || !/^[1-9]\d*$/.test(t))) throw Error('Telegram configuration incomplete');
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 let sent=0,failed=0;
 const started=Date.now();
 for(let i=0;i<(userId ? 4 : 15) && Date.now()-started<40000;i++) {
  const claimed=userId
   ? await admin.rpc('fixihub_notification_claim_for_user',{p_user:userId})
   : await admin.rpc('fixihub_notification_job',{p_action:'claim'});
  if(claimed.error) throw Error('Notification database unavailable');
  const job=claimed.data as NotificationJob|null;
  if(!job) break;
  let retryAfter=Math.min(3600,30*2**Math.min(job.attempts,7));
  try {
   const text=notificationText(job);
   let response:Response;
   if(job.kind==='PAYMENT') {
    const path=String(job.payload.receipt_path);
    const receipt=await admin.storage.from('fixihub-receipts').download(path);
    if(receipt.error || !receipt.data || receipt.data.size>10485760) throw Error('Receipt unavailable');
    const form=new FormData();form.set('chat_id',chat);form.set('message_thread_id',topics[job.kind]!);form.set('caption',text.slice(0,1024));form.set('protect_content','true');
    form.set('document',receipt.data,`payment-${job.payload.order_id}.${path.split('.').pop()}`);
    response=await fetch(`https://api.telegram.org/bot${token}/sendDocument`,{method:'POST',body:form,signal:AbortSignal.timeout(15000)});
   } else {
    response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chat,message_thread_id:Number(topics[job.kind]),text:text.slice(0,4096),protect_content:true,link_preview_options:{is_disabled:true}}),signal:AbortSignal.timeout(10000)});
   }
   const result=await response.json();
   if(!response.ok || !result.ok) {retryAfter=Math.max(retryAfter,Number(result.parameters?.retry_after)||0);throw Error('Telegram delivery failed');}
   const ack=await admin.rpc('fixihub_notification_job',{p_action:'sent',p_id:job.id,p_lease:job.lease});
   if(ack.error) throw Error('Acknowledgement failed');
   sent++;
   await new Promise(resolve=>setTimeout(resolve,1100));
  } catch {
   failed++;
   const retried=await admin.rpc('fixihub_notification_job',{p_action:'retry',p_id:job.id,p_lease:job.lease,p_error:'Delivery failed; scheduled for retry',p_delay:retryAfter});
   if(retried.error) throw Error('Notification retry unavailable');
   break;
  }
 }
 return {sent,failed};
}
