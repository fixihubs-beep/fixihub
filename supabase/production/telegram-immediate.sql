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
