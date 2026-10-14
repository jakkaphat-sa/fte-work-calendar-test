export const DEPARTMENTS = Object.freeze([
  {id:'PLAN',name:'ฝ่ายแผนและประกันคุณภาพการศึกษา',color:'#7162e9'},
  {id:'STUDENT',name:'ฝ่ายพัฒนานักศึกษา',color:'#ec4899'},
  {id:'ACADEMIC',name:'ฝ่ายวิชาการ',color:'#0ea5e9'},
  {id:'ADMIN',name:'ฝ่ายบริหาร',color:'#f59e0b'}
]);
export const STATUSES = Object.freeze({
  NOT_STARTED:{name:'ยังไม่เริ่ม',color:'#64748b'},
  IN_PROGRESS:{name:'อยู่ระหว่างดำเนินการ',color:'#2563eb'},
  DONE:{name:'รอตรวจรับ',color:'#0f766e'},
  COMPLETED:{name:'เสร็จสิ้น',color:'#059669'},
  CANCELLED:{name:'ยกเลิก',color:'#64748b'}
});
export const PROJECT_COLUMNS = 'id,title,department_id,plan_start,plan_end,status';
export function isoDay(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function monthBounds(date){
  return {start:isoDay(new Date(date.getFullYear(),date.getMonth(),1)),end:isoDay(new Date(date.getFullYear(),date.getMonth()+1,0))};
}
export function exclusiveEnd(iso){
  const date=new Date(iso+'T12:00:00');date.setDate(date.getDate()+1);return isoDay(date);
}
export function overlaps(project,range){return project.plan_start<=range.end&&project.plan_end>=range.start;}
export function counts(projects){
  const result={total:projects.length,NOT_STARTED:0,IN_PROGRESS:0,DONE:0,COMPLETED:0,CANCELLED:0};
  for(const project of projects)if(Object.hasOwn(STATUSES,project.status))result[project.status]++;
  return result;
}
export function successRate(c){const active=c.total-c.CANCELLED;return active>0?Math.round(c.COMPLETED/active*100):null;}
export function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
export function safeColor(value){return /^#[0-9a-f]{6}$/i.test(value||'')?value:'#0891b2';}
export function connectionMode(cfg){
  if(!cfg.supabaseUrl&&!cfg.publishableKey)return 'demo';
  let url;try{url=new URL(cfg.supabaseUrl);}catch{throw Error('ตรวจ Project URL ใน docs/config.js');}
  if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw Error('Project URL ต้องเป็น https://ชื่อโปรเจกต์.supabase.co');
  if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(cfg.publishableKey))throw Error('ใช้ Publishable key ที่ขึ้นต้น sb_publishable_ ใน docs/config.js เท่านั้น');
  return 'supabase';
}
export function demoProjects(date=new Date()){
  const prefix=monthBounds(date).start.slice(0,8),day=n=>prefix+String(n).padStart(2,'0');
  return [
    {id:'demo-plan',title:'ประชุมทบทวนแผนปฏิบัติราชการ',department_id:'PLAN',plan_start:day(6),plan_end:day(8),status:'IN_PROGRESS'},
    {id:'demo-student',title:'กิจกรรมพัฒนาทักษะนักศึกษา',department_id:'STUDENT',plan_start:day(10),plan_end:day(12),status:'COMPLETED'},
    {id:'demo-academic',title:'ทบทวนและพัฒนาหลักสูตร',department_id:'ACADEMIC',plan_start:day(15),plan_end:day(19),status:'DONE'},
    {id:'demo-admin',title:'ประชุมเตรียมความพร้อมประจำเดือน',department_id:'ADMIN',plan_start:day(23),plan_end:day(23),status:'NOT_STARTED'}
  ];
}
