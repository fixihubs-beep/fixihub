import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
test('live commerce enforces identity, stock, postage, private receipts and staff decisions', async () => {
 const db = new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema auth; create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb,raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,metadata jsonb); alter table storage.objects enable row level security;
 grant usage on schema auth,storage to authenticated; grant execute on function auth.uid() to authenticated; grant select,insert on storage.objects to authenticated;`);
 await db.exec(readFileSync('supabase/production/commerce.sql','utf8'));
 const ids=Array.from({length:3},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
 for(const id of ids) await db.query(`insert into auth.users values($1,'reader@example.test','{"providers":["google"]}','{"full_name":"Reader"}')`,[id]);
 async function as(id:string){await db.exec('reset role; set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);}
 async function call(action:string,data:object={}){return (await db.query<{value:any}>('select public.fixihub_live($1,$2::jsonb) value',[action,JSON.stringify(data)])).rows[0].value;}
 await as(ids[0]); await call('snapshot'); await assert.rejects(call('queue.join'),/not open/);
 await assert.rejects(db.query("select public.fixihub_payment_settings($1::jsonb)",[JSON.stringify({payee:'Merchant'})]),/Superadmin/);
 await assert.rejects(db.query("insert into storage.objects(bucket_id,name,metadata) values('fixihub-payment-qr','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png','{}')"),/row-level security/);
 await db.exec('reset role'); await db.query("update fixihub_live.profiles set role='superadmin' where id=$1",[ids[0]]);
 await as(ids[0]);
 await db.query("insert into storage.objects(bucket_id,name,metadata) values('fixihub-payment-qr','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png','{}')");
 const settings = (await db.query<{value:any}>("select public.fixihub_payment_settings($1::jsonb) value",[JSON.stringify({payee:'Verified Merchant',bank_name:'Test Bank',account_number:'123456789',support:'support@example.test',qr_path:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png'})])).rows[0].value;
 assert.equal(settings.account_number,'123456789');assert.match(settings.qr_url,/fixihub-payment-qr/);
 await db.exec('reset role');await db.query("update fixihub_live.profiles set role='customer' where id=$1",[ids[0]]);await as(ids[0]);

 await assert.rejects(db.query('select * from fixihub_live.orders'),/permission denied/);
 await db.exec("reset role; update fixihub_live.settings set enabled=true,payee='Test',qr_url='/payments/merchant-qr.png',support='test@example.test',opens_at=now()-interval '1 day',closes_at=now()+interval '1 day',release_at=now()+interval '2 days'");
 await as(ids[0]); await call('queue.join');
 const input={request_id:'10000000-0000-4000-8000-000000000001',quantity:3,address:'123 Test Street, Kuala Lumpur',phone:'+60123456789',email:'test@example.test',country:'MY',region:'Sabah'};
 const order=await call('order.create',input);assert.equal(order.book_total,90);assert.equal(order.shipping_total,10);
 assert.equal((await call('order.create',input)).id,order.id);
 await as(ids[1]);assert.equal((await call('snapshot')).orders.length,0);await assert.rejects(call('payment.review',{id:order.id,approve:true,note:'bank checked'}),/Staff/);
 await as(ids[0]);const upload=await call('upload.reserve',{order_id:order.id,mime:'application/pdf'});
 await db.query("insert into storage.objects(bucket_id,name,metadata) values('fixihub-receipts',$1,'{\"size\":100,\"mimetype\":\"application/pdf\"}')",[upload.path]);
 await assert.rejects(db.query('select public.fixihub_finalize_receipt($1,$2,$3)',[ids[0],upload.path,'BANK1']),/permission denied/);
 await as(ids[1]);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await db.exec('reset role; set role service_role');await db.query('select public.fixihub_finalize_receipt($1,$2,$3)',[ids[0],upload.path,'BANK1']);
 await as(ids[0]);const snap=await call('snapshot');assert.equal(snap.orders[0].status,'payment_review');
 await db.exec('reset role');await db.query("update fixihub_live.profiles set role='staff' where id=$1",[ids[0]]);
 await as(ids[0]);await assert.rejects(call('payment.review',{id:snap.payments[0].id,approve:true,note:'Bank checked',bank_checked:true}),/own payment/);
 await db.exec('reset role');await db.query("update fixihub_live.profiles set role='staff' where id=$1",[ids[1]]);
 await as(ids[1]);await call('payment.review',{id:snap.payments[0].id,approve:true,note:'Bank checked',bank_checked:true});
 await as(ids[0]);assert.equal((await call('snapshot')).orders[0].status,'confirmed');
 // Verify administrative mutations through the real SQL boundary, not only hidden UI.
 const bookId='00000000-0000-4000-8000-000000000009';
 await assert.rejects(call('catalog.update',{id:bookId,title:'KACAU',author:'Ariff Adly',description:'Edition',active:true}),/Admin/);
 await assert.rejects(call('campaign.update',{active:false}),/Admin/);
 await as(ids[2]);await call('snapshot');
 await db.exec('reset role');await db.query("update fixihub_live.profiles set role='admin' where id=$1",[ids[1]]);
 await as(ids[1]);
 await call('catalog.update',{id:bookId,title:'KACAU: Movie Tie-In',author:'Ariff Adly',description:'Updated edition description',active:true});
 assert.equal((await call('snapshot')).books.find((b:any)=>b.id===bookId).description,'Updated edition description');
 await assert.rejects(call('access.update',{id:ids[2],role:'superadmin',active:true}),/Superadmin/);
 await call('access.update',{id:ids[2],role:'staff',active:true});
 await as(ids[2]);assert.equal((await call('snapshot')).profile.role,'staff');
 await as(ids[1]);
 await call('campaign.update',{active:false,opens_at:new Date(Date.now()-86400000).toISOString(),closes_at:new Date(Date.now()+86400000).toISOString()});
 assert.equal((await call('snapshot')).payment.enabled,false);
 await call('campaign.update',{active:true,opens_at:new Date(Date.now()-86400000).toISOString(),closes_at:new Date(Date.now()+86400000).toISOString()});
 // A full queue never admits a 51st simultaneous active customer.
 await db.exec("reset role; update fixihub_live.queue set state='complete'");
 for(let i=10;i<61;i++) {
  const id=`00000000-0000-4000-8000-${String(i).padStart(12,'0')}`;
  await db.exec('reset role');
  await db.query(`insert into auth.users values($1,'queue@example.test','{"providers":["google"]}','{}')`,[id]);
  await as(id); const q=await call('queue.join');assert.equal(q.ticket.state,i<60?'active':'waiting');
 }
 await db.exec('reset role');
 assert.equal((await db.query<{n:number}>("select count(*)::int n from fixihub_live.queue where state='active'")).rows[0].n,50);

 } finally {await db.close();}
});
