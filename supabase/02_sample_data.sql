-- Only synthetic test projects. Their dates follow the current Bangkok month.
-- This does NOT import or connect to Google Sheets.
begin;
with dates as (select date_trunc('month',now() at time zone 'Asia/Bangkok')::date as first_day),
samples(id,title,department_id,start_offset,end_offset,status,is_public) as (values
 ('10000000-0000-4000-8000-000000000001'::uuid,'ตัวอย่าง: ประชุมทบทวนแผนปฏิบัติราชการ','PLAN',5,7,'IN_PROGRESS',true),
 ('10000000-0000-4000-8000-000000000002'::uuid,'ตัวอย่าง: กิจกรรมพัฒนาทักษะนักศึกษา','STUDENT',9,11,'COMPLETED',true),
 ('10000000-0000-4000-8000-000000000003'::uuid,'ตัวอย่าง: ทบทวนและพัฒนาหลักสูตร','ACADEMIC',14,18,'DONE',true),
 ('10000000-0000-4000-8000-000000000004'::uuid,'ตัวอย่าง: ประชุมเตรียมความพร้อมประจำเดือน','ADMIN',22,22,'NOT_STARTED',true),
 ('10000000-0000-4000-8000-000000000005'::uuid,'ตัวอย่าง: โครงการภายในสำหรับตรวจสิทธิ์','PLAN',19,20,'NOT_STARTED',false)
)
insert into public.fte_projects(id,title,department_id,plan_start,plan_end,status,is_public)
select s.id,s.title,s.department_id,d.first_day+s.start_offset,d.first_day+s.end_offset,s.status,s.is_public from samples s cross join dates d
on conflict(id) do update set title=excluded.title,department_id=excluded.department_id,plan_start=excluded.plan_start,plan_end=excluded.plan_end,status=excluded.status,is_public=excluded.is_public;
commit;
