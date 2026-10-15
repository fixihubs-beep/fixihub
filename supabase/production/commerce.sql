-- FIXIHUB production commerce v1. Additive and independent of the legacy prototype.
-- Run this complete file in Supabase SQL Editor. It installs CLOSED; do not edit grants.
begin;
create schema if not exists fixihub_live;
revoke all on schema fixihub_live from public, anon, authenticated;
create table if not exists fixihub_live.settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 qr_url text not null default '', payee text not null default '', support text not null default '',
 opens_at timestamptz not null default '2026-10-15T16:00:00Z',
 closes_at timestamptz not null default '2026-10-31T15:59:59Z',
 release_at timestamptz not null default '2026-10-31T16:00:00Z',
 check(opens_at < closes_at and closes_at <= release_at)
);
insert into fixihub_live.settings(id) values(true) on conflict do nothing;
create table if not exists fixihub_live.profiles (
 id uuid primary key references auth.users(id), display_name text not null, email text not null,
 avatar_url text, role text not null default 'customer' check(role in ('customer','staff','admin','superadmin')),
 active boolean not null default true, delivery jsonb
);
create table if not exists fixihub_live.books (id uuid primary key, document jsonb not null);
create table if not exists fixihub_live.queue (
 id uuid primary key references auth.users(id), sequence bigint generated always as identity unique,
 joined_at timestamptz not null default clock_timestamp(), seen_at timestamptz not null default clock_timestamp(),
 state text not null check(state in ('waiting','active','expired','complete')),
 expires_at timestamptz, lease uuid not null default gen_random_uuid()
);
create table if not exists fixihub_live.orders (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references fixihub_live.profiles(id),
 request_id uuid not null, lease uuid not null, customer_name text not null,
 created_at timestamptz not null default clock_timestamp(), expires_at timestamptz,
 status text not null check(status in ('awaiting_payment','payment_review','payment_issue','confirmed','preparing','cancelled','expired','refund_requested','refunded')),
 quantity integer not null check(quantity between 1 and 1000), book_total numeric(12,2) not null check(book_total=quantity*30),
 shipping_total numeric(12,2) not null check(shipping_total in (5,10)), address text not null,
 phone text not null, email text not null, country text not null check(country='MY'), region text not null,
 tracking_number text, items jsonb not null,
 unique(customer_id,request_id), unique(customer_id,lease)
);
create table if not exists fixihub_live.uploads (
 path text primary key, order_id uuid not null references fixihub_live.orders(id),
 customer_id uuid not null references auth.users(id), mime text not null check(mime in ('image/jpeg','image/png','application/pdf')),
 created_at timestamptz not null default clock_timestamp(), expires_at timestamptz not null default clock_timestamp()+interval '10 minutes'
);
create table if not exists fixihub_live.payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references fixihub_live.orders(id),
 kind text not null default 'book' check(kind='book'), amount numeric(12,2) not null,
 status text not null default 'pending' check(status in ('pending','verified','rejected')),
 receipt_path text not null unique references fixihub_live.uploads(path), reference text not null,
 note text not null default '', created_at timestamptz not null default clock_timestamp(),
 reviewed_by uuid references auth.users(id), reviewed_at timestamptz
);
create unique index if not exists live_one_receipt on fixihub_live.payments(order_id) where status <> 'rejected';
create unique index if not exists live_transfer_reference on fixihub_live.payments(lower(trim(reference))) where status <> 'rejected';
create table if not exists fixihub_live.events (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null, order_id uuid references fixihub_live.orders(id),
 action text not null, detail text not null, created_at timestamptz not null default clock_timestamp()
);
create index if not exists live_orders_customer on fixihub_live.orders(customer_id,created_at desc);
create index if not exists live_orders_expiry on fixihub_live.orders(expires_at) where status='awaiting_payment';
create index if not exists live_queue_position on fixihub_live.queue(state,sequence);
create index if not exists live_events_order on fixihub_live.events(order_id);

-- All tables deny direct API access. The narrow RPC below validates auth and permissions.
do $$ declare t text; begin
 foreach t in array array['settings','profiles','books','queue','orders','uploads','payments','events'] loop
 execute format('alter table fixihub_live.%I enable row level security',t);
 end loop;
end $$;
revoke all on all tables in schema fixihub_live from public,anon,authenticated;
revoke all on all sequences in schema fixihub_live from public,anon,authenticated;

create or replace function fixihub_live.reserved() returns integer language sql stable set search_path='' as $$
 select coalesce(sum(quantity),0)::integer from fixihub_live.orders
 where status in ('payment_review','confirmed','preparing','refund_requested')
 or (status='awaiting_payment' and expires_at>clock_timestamp())
$$;
create or replace function fixihub_live.tick() returns void language plpgsql set search_path='' as $$
declare slots integer; s fixihub_live.settings;
begin
 select * into s from fixihub_live.settings where id for update;
 update fixihub_live.orders set status='expired' where status='awaiting_payment' and expires_at<=clock_timestamp();
 update fixihub_live.queue set state='expired' where (state='active' and expires_at<=clock_timestamp()) or (state='waiting' and seen_at<clock_timestamp()-interval '2 minutes');
 if s.enabled and clock_timestamp() between s.opens_at and s.closes_at and fixihub_live.reserved()<1000 then
  select 50-count(*) into slots from fixihub_live.queue where state='active';
  update fixihub_live.queue set state='active',expires_at=clock_timestamp()+interval '5 minutes'
  where id in (select id from fixihub_live.queue where state='waiting' order by sequence limit greatest(slots,0));
 end if;
end $$;

-- Private upload policy helper: no arbitrary object names, overwrites or public receipts.
create or replace function public.fixihub_receipt_access(p_path text,p_write boolean) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from fixihub_live.uploads u join fixihub_live.orders o on o.id=u.order_id
 join fixihub_live.profiles me on me.id=auth.uid() and me.active
 where u.path=p_path and (
  (p_write and u.customer_id=me.id and u.expires_at>clock_timestamp()
    and o.status in ('awaiting_payment','expired')
    and not exists(select 1 from fixihub_live.payments p where p.receipt_path=u.path))
  or (not p_write and (u.customer_id=me.id or me.role in ('staff','admin','superadmin')))
 ))
$$;
revoke all on function public.fixihub_receipt_access(text,boolean) from public,anon;
grant execute on function public.fixihub_receipt_access(text,boolean) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('fixihub-receipts','fixihub-receipts',false,10485760,array['image/jpeg','image/png','application/pdf'])
 on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists fixihub_live_receipt_insert on storage.objects;
create policy fixihub_live_receipt_insert on storage.objects for insert to authenticated
 with check(bucket_id='fixihub-receipts' and public.fixihub_receipt_access(name,true));
drop policy if exists fixihub_live_receipt_read on storage.objects;
create policy fixihub_live_receipt_read on storage.objects for select to authenticated
 using(bucket_id='fixihub-receipts' and public.fixihub_receipt_access(name,false));

create or replace function public.fixihub_live(p_action text,p_data jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); me fixihub_live.profiles; target fixihub_live.profiles;
 s fixihub_live.settings; q fixihub_live.queue; o fixihub_live.orders; p fixihub_live.payments;
 identity_record auth.users; result jsonb; qty integer; fee integer; oid uuid; dest text; newrole text;
 role_staff boolean; role_admin boolean; v_note text; v_path text; v_mime text; newstatus text;
begin
 if p_action='catalog' then
  select * into s from fixihub_live.settings where id;
  return jsonb_build_object('books',coalesce((select jsonb_agg(document) from fixihub_live.books),'[]'),
   'campaigns',jsonb_build_array(jsonb_build_object('id','00000000-0000-4000-8000-000000000200','book_id','00000000-0000-4000-8000-000000000009','title','KACAU Movie Tie-In','opens_at',s.opens_at,'closes_at',s.closes_at,'release_at',s.release_at,'capacity',1000,'reserved',fixihub_live.reserved(),'active',s.enabled,'featured',true)),
   'payment',jsonb_build_object('enabled',s.enabled,'qr_url',s.qr_url,'payee',s.payee,'support',s.support));
 end if;
 if uid is null then raise exception 'Sign in with Google first.'; end if;
 select * into identity_record from auth.users where id=uid;
 if not coalesce(identity_record.raw_app_meta_data->'providers','[]'::jsonb) ? 'google' then raise exception 'Google login is required.'; end if;
 -- A single small lock serializes admission, inventory, receipt decisions and role changes.
 select * into s from fixihub_live.settings where id for update;
 insert into fixihub_live.profiles(id,display_name,email,avatar_url)
 values(uid,left(coalesce(nullif(identity_record.raw_user_meta_data->>'fixihub_display_name',''),identity_record.raw_user_meta_data->>'full_name',identity_record.raw_user_meta_data->>'name','Reader'),100),coalesce(identity_record.email,''),coalesce(identity_record.raw_user_meta_data->>'avatar_url',identity_record.raw_user_meta_data->>'picture'))
 on conflict(id) do update set display_name=excluded.display_name,email=excluded.email,avatar_url=excluded.avatar_url;
 select * into me from fixihub_live.profiles where id=uid;
 if not me.active then raise exception 'Your account is inactive. Contact support.'; end if;
 role_staff:=me.role in ('staff','admin','superadmin'); role_admin:=me.role in ('admin','superadmin');
 perform fixihub_live.tick();
 if p_action='snapshot' then
  result:=public.fixihub_live('catalog');
  return result || jsonb_build_object('profile',to_jsonb(me),
   'orders',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from fixihub_live.orders x where role_staff or x.customer_id=uid),'[]'),
   'payments',coalesce((select jsonb_agg(to_jsonb(x)) from fixihub_live.payments x join fixihub_live.orders ord on ord.id=x.order_id where role_staff or ord.customer_id=uid),'[]'),
   'profiles',coalesce((select jsonb_agg(to_jsonb(x)) from fixihub_live.profiles x where role_admin or x.id=uid),'[]'),
   'events',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from fixihub_live.events x where (x.action='access.updated' and me.role='superadmin') or (x.action<>'access.updated' and (role_admin or exists(select 1 from fixihub_live.orders ord where ord.id=x.order_id and (ord.customer_id=uid or role_staff))))),'[]'));
 elsif p_action in ('queue.read','queue.join','queue.leave') then
  select * into q from fixihub_live.queue where id=uid;
  if p_action='queue.join' then
   if not s.enabled or not(clock_timestamp() between s.opens_at and s.closes_at) then raise exception 'Preorders are not open.'; end if;
   if fixihub_live.reserved()>=1000 then raise exception 'This edition is sold out.'; end if;
   if q.id is null or q.state in ('expired','complete') then
    delete from fixihub_live.queue where id=uid;
    insert into fixihub_live.queue(id,state) values(uid,'waiting');
   end if;
  elsif p_action='queue.leave' then
   update fixihub_live.queue set state='complete' where id=uid and state='waiting';
  end if;
  update fixihub_live.queue set seen_at=clock_timestamp() where id=uid;
  perform fixihub_live.tick();
  select * into q from fixihub_live.queue where id=uid;
  return jsonb_build_object('ticket',case when q.id is null then null else jsonb_build_object('id',q.id,'joined',extract(epoch from q.joined_at)*1000,'state',q.state,'expires',extract(epoch from q.expires_at)*1000) end,
   'ahead',case when q.state='waiting' then (select count(*) from fixihub_live.queue where state='waiting' and sequence<q.sequence) else 0 end,
   'server_now',extract(epoch from clock_timestamp())*1000);
 elsif p_action='order.create' then
  select * into o from fixihub_live.orders where customer_id=uid and request_id=(p_data->>'request_id')::uuid;
  if o.id is not null then return to_jsonb(o); end if;
  if not s.enabled or s.payee='' or s.qr_url='' or s.support='' or not(clock_timestamp() between s.opens_at and s.closes_at) then raise exception 'Checkout is not open.'; end if;
  select * into q from fixihub_live.queue where id=uid and state='active' and expires_at>clock_timestamp();
  if q.id is null then raise exception 'Join the queue for an active checkout slot.'; end if;
  if exists(select 1 from fixihub_live.orders where customer_id=uid and lease=q.lease) then raise exception 'Finish your current order before starting another.'; end if;
  qty:=(p_data->>'quantity')::integer;
  if qty is null or qty<1 or qty>1000 or fixihub_live.reserved()+qty>1000 then raise exception 'Not enough remaining copies.'; end if;
  dest:=p_data->>'region';
  if (p_data->>'country') is distinct from 'MY' or dest is null or not(dest=any(array['Johor','Kedah','Kelantan','Kuala Lumpur','Labuan','Melaka','Negeri Sembilan','Pahang','Penang','Perak','Perlis','Putrajaya','Sabah','Sarawak','Selangor','Terengganu'])) then raise exception 'Choose a Malaysian delivery state.'; end if;
  fee:=case when dest in ('Sabah','Sarawak','Labuan') then 10 else 5 end;
  if length(trim(coalesce(p_data->>'address','')))<12 or length(p_data->>'address')>1000 or coalesce(p_data->>'phone','') !~ '^\+[0-9]{9,15}$' or coalesce(p_data->>'email','') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(p_data->>'email')>200 then raise exception 'Check your contact and delivery details.'; end if;
  insert into fixihub_live.orders(customer_id,request_id,lease,customer_name,expires_at,status,quantity,book_total,shipping_total,address,phone,email,country,region,items)
  values(uid,(p_data->>'request_id')::uuid,q.lease,me.display_name,q.expires_at,'awaiting_payment',qty,qty*30,fee,trim(p_data->>'address'),p_data->>'phone',p_data->>'email','MY',dest,
   jsonb_build_array(jsonb_build_object('book_id','00000000-0000-4000-8000-000000000009','campaign_id','00000000-0000-4000-8000-000000000200','quantity',qty,'unit_price',30,'title','KACAU: Movie Tie-In','format','physical'))) returning * into o;
  insert into fixihub_live.events(actor_id,order_id,action,detail) values(uid,o.id,'order.created','Order reserved until checkout deadline.');
  return to_jsonb(o);
 elsif p_action='upload.reserve' then
  select * into o from fixihub_live.orders where id=(p_data->>'order_id')::uuid and customer_id=uid;
  if o.id is null or o.status not in ('awaiting_payment','expired') or o.created_at<clock_timestamp()-interval '7 days' then raise exception 'Receipt upload is not available for this order. Contact support.'; end if;
  if (select count(*) from fixihub_live.uploads where order_id=o.id and created_at>clock_timestamp()-interval '10 minutes')>=5 then raise exception 'Too many upload attempts. Please wait before trying again.'; end if;
  v_mime:=p_data->>'mime';
  if v_mime is null or v_mime not in ('image/jpeg','image/png','application/pdf') then raise exception 'Use JPG, PNG or PDF.'; end if;
  v_path:=uid::text||'/'||o.id::text||'/'||gen_random_uuid()::text||case v_mime when 'application/pdf' then '.pdf' when 'image/png' then '.png' else '.jpg' end;
  insert into fixihub_live.uploads(path,order_id,customer_id,mime) values(v_path,o.id,uid,v_mime);
  return jsonb_build_object('path',v_path);
 elsif p_action='payment.review' then
  if not role_staff then raise exception 'Staff access required.'; end if;
  select * into p from fixihub_live.payments where id=(p_data->>'id')::uuid;
  select * into o from fixihub_live.orders where id=p.order_id;
  if p.id is null or p.status<>'pending' or o.status not in ('payment_review','payment_issue') then raise exception 'This receipt has already been handled.'; end if;
  if o.customer_id=uid then raise exception 'You cannot review your own payment.'; end if;
  v_note:=trim(coalesce(p_data->>'note',''));
  if length(v_note)<3 or length(v_note)>500 then raise exception 'Record the bank verification or correction reason.'; end if;
  if coalesce((p_data->>'approve')::boolean,false) then
   if not coalesce((p_data->>'bank_checked')::boolean,false) then raise exception 'Confirm bank verification first.'; end if;
   if o.status='payment_issue' then raise exception 'No stock was held for this late payment. Record its refund instead.'; end if;
   update fixihub_live.payments set status='verified',note=v_note,reviewed_by=uid,reviewed_at=clock_timestamp() where id=p.id;
   update fixihub_live.orders set status='confirmed',expires_at=null where id=o.id;
   newstatus:='payment.approved';
  else
   update fixihub_live.payments set status='rejected',note=v_note,reviewed_by=uid,reviewed_at=clock_timestamp() where id=p.id;
   update fixihub_live.orders set status=case when o.status='payment_issue' then 'expired' else 'awaiting_payment' end,expires_at=clock_timestamp()+interval '24 hours' where id=o.id;
   newstatus:='payment.rejected';
  end if;
  insert into fixihub_live.events(actor_id,order_id,action,detail) values(uid,o.id,newstatus,v_note);
 elsif p_action='order.transition' then
  select * into o from fixihub_live.orders where id=(p_data->>'id')::uuid;
  if o.id is null or not(role_staff or o.customer_id=uid) then raise exception 'Order unavailable.'; end if;
  v_note:=trim(coalesce(p_data->>'note',''));
  if length(v_note)<3 or length(v_note)>500 then raise exception 'Provide a reason or reference.'; end if;
  case p_data->>'action'
   when 'cancel' then
    if o.status<>'awaiting_payment' then raise exception 'Only unpaid orders can be cancelled.'; end if;
    newstatus:='cancelled';
   when 'prepare' then
    if not role_staff or o.status<>'confirmed' or clock_timestamp()<s.release_at then raise exception 'Only confirmed orders can be prepared after the expected publication date.'; end if;
    newstatus:='preparing';
   when 'request_refund' then
    if o.status not in ('confirmed','preparing') then raise exception 'Only paid orders can request a refund.'; end if;
    newstatus:='refund_requested';
   when 'refund' then
    if not role_admin or o.status not in ('refund_requested','payment_issue') then raise exception 'Admin access and a refund request or late-payment issue are required.'; end if;
    newstatus:='refunded';
   else raise exception 'Unknown order action.';
  end case;
  update fixihub_live.orders set status=newstatus where id=o.id;
  if newstatus='cancelled' then update fixihub_live.queue set state='complete' where id=o.customer_id and lease=o.lease; end if;
  insert into fixihub_live.events(actor_id,order_id,action,detail) values(uid,o.id,'order.'||newstatus,v_note);
 elsif p_action='profile.delivery' then
  if p_data->'delivery' is not null and p_data->'delivery'<>'null'::jsonb then
   if jsonb_typeof(p_data->'delivery')<>'object' or length((p_data->'delivery')::text)>2500 then raise exception 'Invalid address.'; end if;
  end if;
  update fixihub_live.profiles set delivery=nullif(p_data->'delivery','null'::jsonb) where id=uid;
 elsif p_action='access.update' then
  if not role_admin then raise exception 'Admin access required.'; end if;
  select * into target from fixihub_live.profiles where id=(p_data->>'id')::uuid;
  newrole:=p_data->>'role';
  if target.id is null or newrole is null or newrole not in ('customer','staff','admin','superadmin') then raise exception 'Invalid account or role.'; end if;
  if target.id=uid then raise exception 'You cannot change your own access.'; end if;
  if me.role<>'superadmin' and (target.role in ('admin','superadmin') or newrole in ('admin','superadmin')) then raise exception 'Superadmin access required.'; end if;
  if target.role='superadmin' and (newrole<>'superadmin' or not coalesce((p_data->>'active')::boolean,false)) and (select count(*) from fixihub_live.profiles where role='superadmin' and active)<=1 then raise exception 'Keep at least one active superadmin.'; end if;
  update fixihub_live.profiles set role=newrole,active=coalesce((p_data->>'active')::boolean,false) where id=target.id;
  insert into fixihub_live.events(actor_id,action,detail) values(uid,'access.updated',target.id::text||': '||newrole);
 elsif p_action='catalog.update' then
  if not role_admin then raise exception 'Admin access required.'; end if;
  if length(trim(coalesce(p_data->>'title','')))=0 or length(trim(coalesce(p_data->>'author','')))=0 or length(trim(coalesce(p_data->>'description','')))=0 then raise exception 'Title, author and description required.'; end if;
  if (p_data->>'id')='00000000-0000-4000-8000-000000000009' and not coalesce((p_data->>'active')::boolean,false) then raise exception 'Pause the campaign instead of hiding KACAU.'; end if;
  update fixihub_live.books set document=document||jsonb_build_object('title',left(p_data->>'title',200),'author',left(p_data->>'author',200),'description',left(p_data->>'description',6000),'active',coalesce((p_data->>'active')::boolean,false)) where id=(p_data->>'id')::uuid;
  if not found then raise exception 'Book unavailable.'; end if;
  insert into fixihub_live.events(actor_id,action,detail) values(uid,'catalog.updated',p_data->>'id');
 elsif p_action='campaign.update' then
  if not role_admin then raise exception 'Admin access required.'; end if;
  if (p_data->>'active')::boolean and (s.payee='' or s.qr_url='' or s.support='') then raise exception 'Configure merchant QR, payee and support before opening.'; end if;
  update fixihub_live.settings set opens_at=(p_data->>'opens_at')::timestamptz,closes_at=(p_data->>'closes_at')::timestamptz,enabled=coalesce((p_data->>'active')::boolean,false) where id;
  insert into fixihub_live.events(actor_id,action,detail) values(uid,'campaign.updated','Campaign schedule or admission changed.');
 else raise exception 'Unknown operation.';
 end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.fixihub_live(text,jsonb) from public;
grant execute on function public.fixihub_live(text,jsonb) to anon,authenticated;

-- Called ONLY by the trusted receipt-verification server after validating file contents.
create or replace function public.fixihub_finalize_receipt(p_user uuid,p_path text,p_reference text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare u fixihub_live.uploads; o fixihub_live.orders; existing fixihub_live.payments; next_status text;
begin
 perform 1 from fixihub_live.settings where id for update;
 perform fixihub_live.tick();
 if not exists(select 1 from fixihub_live.profiles where id=p_user and active) then raise exception 'Account unavailable.'; end if;
 select * into u from fixihub_live.uploads where path=p_path and customer_id=p_user;
 select * into o from fixihub_live.orders where id=u.order_id and customer_id=p_user;
 select * into existing from fixihub_live.payments where receipt_path=p_path;
 if existing.id is not null then return jsonb_build_object('ok',true,'order_id',o.id); end if;
 if u.path is null or o.id is null or u.expires_at<=clock_timestamp() or o.status not in ('awaiting_payment','expired') then raise exception 'This upload can no longer be submitted. Refresh the order.'; end if;
 if length(trim(coalesce(p_reference,'')))<3 or length(p_reference)>120 then raise exception 'Enter a transfer reference of 3–120 characters.'; end if;
 if not exists(select 1 from storage.objects where bucket_id='fixihub-receipts' and name=p_path and (metadata->>'size')::bigint between 1 and 10485760 and metadata->>'mimetype'=u.mime) then raise exception 'Receipt file unavailable or invalid.'; end if;
 next_status:='payment_review';
 if o.status='expired' and fixihub_live.reserved()+o.quantity>1000 then next_status:='payment_issue'; end if;
 insert into fixihub_live.payments(order_id,amount,receipt_path,reference) values(o.id,o.book_total+o.shipping_total,p_path,trim(p_reference));
 update fixihub_live.orders set status=next_status,expires_at=null where id=o.id;
 update fixihub_live.queue set state='complete' where id=p_user and lease=o.lease;
 insert into fixihub_live.events(actor_id,order_id,action,detail) values(p_user,o.id,'payment.submitted',case when next_status='payment_issue' then 'Late payment received without available stock. Admin refund review required.' else 'Receipt submitted for bank verification.' end);
 return jsonb_build_object('ok',true,'order_id',o.id,'status',next_status);
end $$;
revoke all on function public.fixihub_finalize_receipt(uuid,text,text) from public,anon,authenticated;
grant execute on function public.fixihub_finalize_receipt(uuid,text,text) to service_role;
revoke all on all functions in schema fixihub_live from public,anon,authenticated;
commit;

-- Public catalogue seed only; no mock customers or orders.
begin;
insert into fixihub_live.books(id,document) values('00000000-0000-4000-8000-000000000001','{"id":"00000000-0000-4000-8000-000000000001","slug":"jelik","title":"JELIK","author":"Ismi Fa Ismail","category":"Horror","color":"#b9d559","price":25,"description":"A voice from Malaysia’s contemporary fiction shelf. Public title and author metadata; publisher cover artwork.","stock":80,"format":"physical","cover_image":"/covers/jelik.jpg","source_url":"https://shop.cziplee.com/products/jelik-by-ismi-fa-ismail","provenance":"public_metadata","active":true,"sale_mode":"catalog_only"}'::jsonb) on conflict(id) do nothing;
insert into fixihub_live.books(id,document) values('00000000-0000-4000-8000-000000000002','{"id":"00000000-0000-4000-8000-000000000002","slug":"renjana","title":"RENJANA","author":"Qiydenneskala","category":"Fiction","color":"#db8871","price":25,"description":"Explore a different voice in Malay-language fiction. Public title and author metadata; demo catalog description.","stock":73,"format":"physical","cover_image":"/covers/renjana.jpg","source_url":"https://www.gerakbudaya.com/product/renjana","provenance":"public_metadata","active":true,"sale_mode":"catalog_only"}'::jsonb) on conflict(id) do nothing;
insert into fixihub_live.books(id,document) values('00000000-0000-4000-8000-000000000003','{"id":"00000000-0000-4000-8000-000000000003","slug":"amuk","title":"AMUK","author":"Khairi Mohd","category":"Thriller","color":"#eabc4b","price":25,"description":"Discover contemporary Malaysian storytelling. Public title and author metadata; demo genre assignment.","stock":66,"format":"physical","cover_image":"/covers/amuk.jpg","source_url":"https://www.gerakbudaya.com/product/amuk-by-khairi-mohd-buku-fixi-","provenance":"public_metadata","active":true,"sale_mode":"catalog_only"}'::jsonb) on conflict(id) do nothing;
insert into fixihub_live.books(id,document) values('00000000-0000-4000-8000-000000000004','{"id":"00000000-0000-4000-8000-000000000004","slug":"jelaga","title":"JELAGA","author":"Faizal Sulaiman","category":"Fiction","color":"#9fadd2","price":25,"description":"A new addition to your reading stack. Public title and author metadata; publisher cover artwork.","stock":59,"format":"physical","cover_image":"/covers/jelaga.jpg","source_url":"https://www.gerakbudaya.com/product/jelaga","provenance":"public_metadata","active":true,"sale_mode":"catalog_only"}'::jsonb) on conflict(id) do nothing;
insert into fixihub_live.books(id,document) values('00000000-0000-4000-8000-000000000005','{"id":"00000000-0000-4000-8000-000000000005","slug":"gantung-3","title":"GANTUNG:3","author":"Nadia Khan","category":"Thriller","color":"#b797bb","price":27,"description":"The third Gantung title, listed in the official store. Pricing and stock here are for demonstration.","stock":52,"format":"physical","cover_image":"/covers/gantung-3.jpg","source_url":"https://www.gerakbudaya.com/product/gantung-3-nadia-khan-fixi","provenance":"public_metadata","active":true,"sale_mode":"catalog_only"}'::jsonb) on conflict(id) do nothing;
insert into fixihub_live.books(id,document) values('00000000-0000-4000-8000-000000000006','{"id":"00000000-0000-4000-8000-000000000006","slug":"motel","title":"MOTEL","author":"Sahidzan Salleh","category":"Horror","color":"#73aba4","price":25,"description":"Browse this public FIXI title in our academic catalog. Genre and description are editorial demo data.","stock":45,"format":"physical","cover_image":"/covers/motel.jpg","source_url":"https://mphonline.com/products/motel","provenance":"public_metadata","active":true,"sale_mode":"catalog_only"}'::jsonb) on conflict(id) do nothing;
insert into fixihub_live.books(id,document) values('00000000-0000-4000-8000-000000000009','{"id":"00000000-0000-4000-8000-000000000009","slug":"kacau-movie-tie-in","title":"KACAU: Movie Tie-In","author":"Ariff Adly","category":"Movie Tie-In","price":30,"stock":0,"color":"#19b467","description":"The limited edition for the upcoming KACAU movie. Only 1,000 copies, with no reprint. Expected publication on 1 November 2026.","format":"physical","cover_image":"/covers/kacau-movie-wrap.png","back_cover_image":"/covers/kacau-movie-wrap.png","source_url":null,"provenance":"public_metadata","active":true,"sale_mode":"preorder","page_count":328,"publication_date":"2026-11-01"}'::jsonb) on conflict(id) do nothing;
commit;
-- Run after commerce.sql (also included at the end of the latest commerce.sql).
begin;
alter table fixihub_live.settings add column if not exists bank_name text not null default '';
alter table fixihub_live.settings add column if not exists account_number text not null default '';
alter table fixihub_live.settings add column if not exists instructions text not null default '';
create or replace function public.fixihub_is_superadmin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from fixihub_live.profiles where id=auth.uid() and active and role='superadmin')
$$;
revoke all on function public.fixihub_is_superadmin() from public,anon;
grant execute on function public.fixihub_is_superadmin() to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fixihub-payment-qr','fixihub-payment-qr',true,10485760,array['image/png','image/jpeg'])
on conflict(id) do update set public=true,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists fixihub_qr_upload on storage.objects;
create policy fixihub_qr_upload on storage.objects for insert to authenticated
with check(bucket_id='fixihub-payment-qr' and public.fixihub_is_superadmin() and name ~ '^[0-9a-f-]{36}\.(png|jpg)$');
-- No overwrite/delete API: published QR paths remain immutable.
create or replace function public.fixihub_payment_settings(p_data jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s fixihub_live.settings; v_path text;
begin
 if p_data is not null then
  if not public.fixihub_is_superadmin() then raise exception 'Superadmin access required.'; end if;
  select * into s from fixihub_live.settings where id for update;
  if s.enabled then raise exception 'Pause the campaign before changing payment instructions.'; end if;
  if exists(select 1 from fixihub_live.orders where status='awaiting_payment' and expires_at>clock_timestamp()) then raise exception 'Wait until active payment reservations finish before changing bank details.'; end if;
  if length(trim(coalesce(p_data->>'payee','')))=0 or length(p_data->>'payee')>150 or length(trim(coalesce(p_data->>'bank_name','')))=0 or length(p_data->>'bank_name')>100 or coalesce(p_data->>'account_number','') !~ '^[0-9 -]{5,40}$' or length(trim(coalesce(p_data->>'support','')))=0 or length(p_data->>'support')>200 or length(coalesce(p_data->>'instructions',''))>1000 then raise exception 'Check the payee, bank, account number and support details.'; end if;
  v_path:=p_data->>'qr_path';
  if v_path is not null and v_path<>'' then
   if not exists(select 1 from storage.objects where bucket_id='fixihub-payment-qr' and name=v_path) then raise exception 'Upload the QR image first.'; end if;
  end if;
  update fixihub_live.settings set payee=trim(p_data->>'payee'),bank_name=trim(p_data->>'bank_name'),account_number=trim(p_data->>'account_number'),support=trim(p_data->>'support'),instructions=trim(coalesce(p_data->>'instructions','')),
   qr_url=case when v_path is not null and v_path<>'' then '/storage/v1/object/public/fixihub-payment-qr/'||v_path else qr_url end where id;
  insert into fixihub_live.events(actor_id,action,detail) values(auth.uid(),'payment.settings.updated','Merchant QR or bank instructions updated by superadmin.');
 end if;
 select * into s from fixihub_live.settings where id;
 return jsonb_build_object('enabled',s.enabled,'qr_url',s.qr_url,'payee',s.payee,'support',s.support,'bank_name',s.bank_name,'account_number',s.account_number,'instructions',s.instructions);
end $$;
revoke all on function public.fixihub_payment_settings(jsonb) from public;
grant execute on function public.fixihub_payment_settings(jsonb) to anon,authenticated;
commit;
