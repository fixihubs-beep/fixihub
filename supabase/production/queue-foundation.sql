-- FIXIHUB queue foundation. Run on the intended Supabase project only.
-- This is NOT the complete preorder schema and does not enable live checkout.
-- Order/receipt RPCs must validate/complete leases transactionally; see docs/QUEUE-LAUNCH.md.
begin;
create schema if not exists fixihub_queue;
revoke all on schema fixihub_queue from public, anon, authenticated;
create table if not exists fixihub_queue.control (
  singleton boolean primary key default true check(singleton),
  enabled boolean not null default false
);
insert into fixihub_queue.control(singleton) values (true) on conflict do nothing;
create table if not exists fixihub_queue.tickets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sequence bigint generated always as identity unique,
  state text not null check(state in ('waiting','active','expired','complete','left')),
  joined_at timestamptz not null default clock_timestamp(),
  seen_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz,
  lease_id uuid,
  check(state <> 'active' or (expires_at is not null and lease_id is not null))
);
alter table fixihub_queue.tickets enable row level security;
alter table fixihub_queue.control enable row level security;
revoke all on all tables in schema fixihub_queue from public, anon, authenticated;
revoke all on all sequences in schema fixihub_queue from public, anon, authenticated;

-- Internal helper. The control row serializes every admission, preventing overbooking.
create or replace function fixihub_queue.advance() returns void
language plpgsql security definer set search_path = '' as $$
declare slots integer; now_at timestamptz;
begin
  perform 1 from fixihub_queue.control where singleton for update;
  now_at := clock_timestamp();
  update fixihub_queue.tickets set state='expired' where state='active' and expires_at <= now_at;
  -- Disconnected waiting visitors relinquish their position after two minutes.
  update fixihub_queue.tickets set state='left' where state='waiting' and seen_at < now_at - interval '2 minutes';
  if not (select enabled from fixihub_queue.control where singleton) then return; end if;
  select greatest(0,50-count(*))::integer into slots from fixihub_queue.tickets where state='active';
  update fixihub_queue.tickets set state='active', expires_at=now_at+interval '5 minutes', lease_id=gen_random_uuid()
  where user_id in (select user_id from fixihub_queue.tickets where state='waiting' order by sequence limit slots);
end;
$$;
revoke all on function fixihub_queue.advance() from public, anon, authenticated;

-- Poll every 10 seconds with jitter, not continuously. Uses server time, not client time.
create or replace function public.fixihub_queue_status() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare who uuid := auth.uid(); ticket fixihub_queue.tickets; ahead bigint; is_enabled boolean;
begin
  if who is null then raise exception 'Sign in first' using errcode='42501'; end if;
  perform 1 from fixihub_queue.control where singleton for update;
  -- Expire a stale waiting ticket before renewing heartbeat.
  perform fixihub_queue.advance();
  update fixihub_queue.tickets set seen_at=clock_timestamp() where user_id=who;
  select * into ticket from fixihub_queue.tickets where user_id=who;
  select enabled into is_enabled from fixihub_queue.control where singleton;
  select count(*) into ahead from fixihub_queue.tickets where state='waiting' and sequence < ticket.sequence;
  return jsonb_build_object('enabled',is_enabled,'state',coalesce(ticket.state,'none'),'ahead',case when ticket.state='waiting' then ahead else 0 end,
    'expires_at',ticket.expires_at,'lease_id',ticket.lease_id,'server_now',clock_timestamp(),'capacity',50);
end;
$$;
revoke all on function public.fixihub_queue_status() from public, anon;
grant execute on function public.fixihub_queue_status() to authenticated;

create or replace function public.fixihub_queue_join() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare who uuid := auth.uid(); old_state text;
begin
  if who is null then raise exception 'Sign in first' using errcode='42501'; end if;
  perform 1 from fixihub_queue.control where singleton for update;
  if not (select enabled from fixihub_queue.control where singleton) then raise exception 'The waiting room is not open'; end if;
  perform fixihub_queue.advance();
  select state into old_state from fixihub_queue.tickets where user_id=who;
  if old_state is null or old_state in ('expired','complete','left') then
    delete from fixihub_queue.tickets where user_id=who;
    insert into fixihub_queue.tickets(user_id,state) values(who,'waiting');
  else
    update fixihub_queue.tickets set seen_at=clock_timestamp() where user_id=who;
  end if;
  return public.fixihub_queue_status();
end;
$$;
revoke all on function public.fixihub_queue_join() from public, anon;
grant execute on function public.fixihub_queue_join() to authenticated;

create or replace function public.fixihub_queue_leave() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in first' using errcode='42501'; end if;
  perform 1 from fixihub_queue.control where singleton for update;
  -- Active leases must be resolved through the order cancellation transaction.
  update fixihub_queue.tickets set state='left' where user_id=auth.uid() and state='waiting';
  return public.fixihub_queue_status();
end;
$$;
revoke all on function public.fixihub_queue_leave() from public, anon;
grant execute on function public.fixihub_queue_leave() to authenticated;

-- Only call inside trusted order/receipt database transactions, never grant to browser roles.
create or replace function fixihub_queue.require_lease(who uuid, expected_lease uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare deadline timestamptz;
begin
  perform 1 from fixihub_queue.control where singleton for update;
  select expires_at into deadline from fixihub_queue.tickets
    where user_id=who and state='active' and lease_id=expected_lease and expires_at > clock_timestamp();
  if deadline is null then raise exception 'Checkout slot expired or unavailable'; end if;
  return deadline;
end;
$$;
revoke all on function fixihub_queue.require_lease(uuid,uuid) from public, anon, authenticated;
create or replace function fixihub_queue.complete(who uuid, expected_lease uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from fixihub_queue.control where singleton for update;
  update fixihub_queue.tickets set state='complete' where user_id=who and lease_id=expected_lease and state='active';
  perform fixihub_queue.advance();
end;
$$;
revoke all on function fixihub_queue.complete(uuid,uuid) from public, anon, authenticated;
commit;
