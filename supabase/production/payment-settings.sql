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
