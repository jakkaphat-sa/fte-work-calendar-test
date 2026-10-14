-- Starter 0.1: use a NEW Supabase test project. Run in Dashboard > SQL Editor.
-- The browser is read-only. Provision roles in the SQL Editor, never in the browser.
begin;

create table if not exists public.fte_departments (
  id text primary key,
  name text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  sort_order integer not null default 0
);
create table if not exists public.fte_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('SUPER_ADMIN','EXECUTIVE','DEPT_ADMIN','ASSIGNEE')),
  department_id text references public.fte_departments(id),
  enabled boolean not null default false,
  check (role in ('SUPER_ADMIN','EXECUTIVE') or department_id is not null)
);
create table if not exists public.fte_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 250),
  department_id text not null references public.fte_departments(id),
  owner_id uuid references auth.users(id) on delete set null,
  plan_start date not null,
  plan_end date not null,
  status text not null default 'NOT_STARTED' check (status in ('NOT_STARTED','IN_PROGRESS','DONE','COMPLETED','CANCELLED')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  check (plan_end >= plan_start)
);
create index if not exists fte_projects_plan_range_idx on public.fte_projects(plan_start,plan_end);
create index if not exists fte_projects_department_dates_idx on public.fte_projects(department_id,plan_start,plan_end);
create index if not exists fte_projects_owner_idx on public.fte_projects(owner_id);

alter table public.fte_departments enable row level security;
alter table public.fte_profiles enable row level security;
alter table public.fte_projects enable row level security;

grant usage on schema public to anon,authenticated;
revoke all on public.fte_departments,public.fte_profiles,public.fte_projects from public,anon,authenticated;
grant select on public.fte_departments,public.fte_projects to anon,authenticated;
grant select on public.fte_profiles to authenticated;

drop policy if exists fte_departments_read on public.fte_departments;
create policy fte_departments_read on public.fte_departments for select to anon,authenticated using (true);
drop policy if exists fte_profiles_self_read on public.fte_profiles;
create policy fte_profiles_self_read on public.fte_profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists fte_projects_public_read on public.fte_projects;
create policy fte_projects_public_read on public.fte_projects for select to anon,authenticated using (is_public);
drop policy if exists fte_projects_member_read on public.fte_projects;
create policy fte_projects_member_read on public.fte_projects for select to authenticated using (
  exists (
    select 1 from public.fte_profiles p
    where p.id = (select auth.uid()) and p.enabled
    and (
      p.role in ('SUPER_ADMIN','EXECUTIVE')
      or (p.role = 'DEPT_ADMIN' and p.department_id = fte_projects.department_id)
      or (p.role = 'ASSIGNEE' and fte_projects.owner_id = (select auth.uid()))
    )
  )
);

insert into public.fte_departments(id,name,color,sort_order) values
 ('PLAN','ฝ่ายแผนและประกันคุณภาพการศึกษา','#7162e9',1),
 ('STUDENT','ฝ่ายพัฒนานักศึกษา','#ec4899',2),
 ('ACADEMIC','ฝ่ายวิชาการ','#0ea5e9',3),
 ('ADMIN','ฝ่ายบริหาร','#f59e0b',4)
on conflict (id) do nothing;

-- Enable push notifications. Repeat runs do not add a table twice.
do $$
declare table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['fte_projects','fte_profiles'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name) then
        execute format('alter publication supabase_realtime add table public.%I',table_name);
      end if;
    end loop;
  end if;
end $$;
commit;
