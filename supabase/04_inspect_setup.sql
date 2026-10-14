-- Inspect in SQL Editor. No data is changed by these queries.
select c.relname,c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('fte_departments','fte_profiles','fte_projects');

select tablename,policyname,roles,cmd,qual
from pg_policies where schemaname='public' and tablename in ('fte_departments','fte_profiles','fte_projects');

select role_name,
has_table_privilege(role_name,'public.fte_projects','SELECT') as can_select,
has_table_privilege(role_name,'public.fte_projects','INSERT') as can_insert,
has_table_privilege(role_name,'public.fte_projects','UPDATE') as can_update,
has_table_privilege(role_name,'public.fte_projects','DELETE') as can_delete
from (values ('anon'),('authenticated')) as roles(role_name);

select schemaname,tablename from pg_publication_tables
where pubname='supabase_realtime' and tablename in ('fte_projects','fte_profiles');
