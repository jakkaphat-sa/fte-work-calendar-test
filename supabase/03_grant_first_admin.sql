-- First sign in with Google on the website, then replace the email below.
-- Run ONLY in the Supabase SQL Editor. This grants private-project read access.
insert into public.fte_profiles(id,role,department_id,enabled)
select id,'SUPER_ADMIN',null,true from auth.users
where lower(email) = lower('YOUR_EMAIL@example.invalid')
on conflict(id) do update set role=excluded.role,department_id=excluded.department_id,enabled=excluded.enabled;

-- Confirm only your own account was granted the intended role.
select u.email,p.role,p.enabled from public.fte_profiles p join auth.users u on u.id=p.id
where lower(u.email)=lower('YOUR_EMAIL@example.invalid');
