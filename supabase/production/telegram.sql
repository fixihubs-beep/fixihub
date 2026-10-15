-- Run after commerce.sql. No historical users/orders are broadcast.
begin;
create table if not exists fixihub_live.notifications (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('LOGIN','ORDER','PAYMENT','FEEDBACK')),
 source_id uuid not null, payload jsonb not null, created_at timestamptz not null default now(),
 attempts integer not null default 0, available_at timestamptz not null default now(),
 lease uuid, sent_at timestamptz, last_error text, unique(kind,source_id)
);
alter table fixihub_live.notifications enable row level security;
create index if not exists notification_pending on fixihub_live.notifications(available_at,created_at) where sent_at is null;
create table if not exists fixihub_live.feedback (
 id uuid primary key, user_id uuid not null references auth.users(id),
 category text not null, message text not null, page text not null, created_at timestamptz not null default now()
);
alter table fixihub_live.feedback enable row level security;
create index if not exists feedback_user_created on fixihub_live.feedback(user_id,created_at);
revoke all on fixihub_live.notifications,fixihub_live.feedback from public,anon,authenticated;
create or replace function fixihub_live.enqueue_notification() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into fixihub_live.notifications(kind,source_id,payload) values(TG_ARGV[0],new.id,to_jsonb(new)) on conflict(kind,source_id) do nothing;
 return new;
end $$;
drop trigger if exists notify_new_user on fixihub_live.profiles;
create trigger notify_new_user after insert on fixihub_live.profiles for each row execute function fixihub_live.enqueue_notification('LOGIN');
drop trigger if exists notify_new_order on fixihub_live.orders;
create trigger notify_new_order after insert on fixihub_live.orders for each row execute function fixihub_live.enqueue_notification('ORDER');
drop trigger if exists notify_new_payment on fixihub_live.payments;
create trigger notify_new_payment after insert on fixihub_live.payments for each row execute function fixihub_live.enqueue_notification('PAYMENT');
create or replace function public.fixihub_feedback(p_id uuid,p_category text,p_message text,p_page text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare me fixihub_live.profiles;
begin
 select * into me from fixihub_live.profiles where id=auth.uid() and active for update;
 if me.id is null then raise exception 'Sign in with Google to send feedback.'; end if;
 if exists(select 1 from fixihub_live.feedback where id=p_id and user_id=me.id) then return jsonb_build_object('id',p_id); end if;
 if p_category is null or p_category not in ('Feedback','Order issue','Payment issue','Website issue') or length(trim(coalesce(p_message,''))) not between 10 and 2000 or p_page is null or length(p_page)>200 or left(p_page,1)<>'/' then raise exception 'Choose a category and enter 10–2000 characters.'; end if;
 if (select count(*) from fixihub_live.feedback where user_id=me.id and created_at>now()-interval '10 minutes')>=3 then raise exception 'Please wait ten minutes before sending more feedback.'; end if;
 insert into fixihub_live.feedback values(p_id,me.id,p_category,trim(p_message),p_page,now());
 insert into fixihub_live.notifications(kind,source_id,payload) values('FEEDBACK',p_id,jsonb_build_object('id',p_id,'name',me.display_name,'email',me.email,'category',p_category,'message',trim(p_message),'page',p_page));
 return jsonb_build_object('id',p_id);
end $$;
revoke all on function public.fixihub_feedback(uuid,text,text,text) from public,anon;
grant execute on function public.fixihub_feedback(uuid,text,text,text) to authenticated;
-- Worker claims a single job with a two-minute lease; concurrent workers cannot claim it.
create or replace function public.fixihub_notification_job(p_action text,p_id uuid default null,p_lease uuid default null,p_error text default null,p_delay integer default 30) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job fixihub_live.notifications;
begin
 if p_action='claim' then
  select * into job from fixihub_live.notifications where sent_at is null and available_at<=now() order by created_at,id for update skip locked limit 1;
  if job.id is null then return null; end if;
  update fixihub_live.notifications set lease=gen_random_uuid(),available_at=now()+interval '2 minutes',attempts=attempts+1 where id=job.id returning * into job;
  return to_jsonb(job);
 elsif p_action='sent' then
  update fixihub_live.notifications set sent_at=now(),last_error=null,lease=null where id=p_id and lease=p_lease and sent_at is null;
 elsif p_action='retry' then
  update fixihub_live.notifications set available_at=now()+make_interval(secs=>greatest(30,least(86400,p_delay))),last_error=left(p_error,120),lease=null where id=p_id and lease=p_lease and sent_at is null;
 else raise exception 'Unknown action.';
 end if;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.fixihub_notification_job(text,uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.fixihub_notification_job(text,uuid,uuid,text,integer) to service_role;
revoke all on function fixihub_live.enqueue_notification() from public,anon,authenticated;
commit;

-- Run after telegram.sql; safe to rerun. Only the server can claim a user's new notifications.
begin;
create or replace function public.fixihub_notification_claim_for_user(p_user uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job fixihub_live.notifications;
begin
 if not exists(select 1 from fixihub_live.profiles where id=p_user and active) then return null; end if;
 select n.* into job from fixihub_live.notifications n
 where n.sent_at is null and n.attempts=0 and n.available_at<=now() and (
  (n.kind='LOGIN' and n.source_id=p_user) or
  (n.kind='ORDER' and exists(select 1 from fixihub_live.orders o where o.id=n.source_id and o.customer_id=p_user)) or
  (n.kind='PAYMENT' and exists(select 1 from fixihub_live.payments p join fixihub_live.orders o on o.id=p.order_id where p.id=n.source_id and o.customer_id=p_user)) or
  (n.kind='FEEDBACK' and exists(select 1 from fixihub_live.feedback f where f.id=n.source_id and f.user_id=p_user))
 ) order by n.created_at,n.id for update of n skip locked limit 1;
 if job.id is null then return null; end if;
 update fixihub_live.notifications set lease=gen_random_uuid(),available_at=now()+interval '2 minutes',attempts=attempts+1 where id=job.id returning * into job;
 return to_jsonb(job);
end $$;
revoke all on function public.fixihub_notification_claim_for_user(uuid) from public,anon,authenticated;
grant execute on function public.fixihub_notification_claim_for_user(uuid) to service_role;
commit;
