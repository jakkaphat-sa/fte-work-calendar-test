import {config} from './config.js';
import {DEPARTMENTS,STATUSES,PROJECT_COLUMNS,monthBounds,exclusiveEnd,counts,successRate,escapeHtml,safeColor,connectionMode,demoProjects} from './domain.js';
const $=id=>document.getElementById(id);
const state={mode:'demo',client:null,session:null,profile:null,departments:DEPARTMENTS,projects:[],month:new Date(),calendar:null,ready:false,sequence:0,epoch:0,channel:null,timer:null,abort:null};
const ROLE_NAMES={SUPER_ADMIN:'ผู้ดูแลระบบสูงสุด',EXECUTIVE:'ผู้บริหาร',DEPT_ADMIN:'ผู้ดูแลฝ่าย',ASSIGNEE:'ผู้รับผิดชอบงาน'};
const dateText=iso=>new Date(iso+'T12:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});
function notice(message,error=false){$('notice').textContent=message;$('notice').hidden=!message;$('notice').classList.toggle('error',error);}
function errorText(error){
  if(error?.code==='42P01')return 'ยังไม่พบตารางข้อมูล กรุณารัน supabase/01_schema.sql ก่อน';
  if(error?.code==='42501')return 'ยังไม่ได้กำหนดสิทธิ์ฐานข้อมูล กรุณาตรวจ 01_schema.sql';
  return error?.message||'เชื่อมต่อไม่สำเร็จ กรุณาลองรีเฟรชอีกครั้ง';
}
function renderDepartments(){
  const old=$('departmentFilter').value;
  $('departmentFilter').replaceChildren(new Option('ทุกฝ่าย',''),...state.departments.map(d=>new Option(d.name,d.id)));
  if(state.departments.some(d=>d.id===old))$('departmentFilter').value=old;
  $('sideDepartments').innerHTML=state.departments.map(d=>`<div class="side-department" style="--dept:${safeColor(d.color)}"><i aria-hidden="true"></i><span>${escapeHtml(d.name)}</span></div>`).join('');
}
function renderAccount(){
  $('loginButton').hidden=!!state.session;$('loginButton').disabled=!state.client;
  $('logoutButton').hidden=!state.session;
  if(!state.session){$('accountLabel').textContent='ผู้เยี่ยมชม';return;}
  const role=state.profile?.enabled?ROLE_NAMES[state.profile.role]:'รอผู้ดูแลกำหนดสิทธิ์';
  $('accountLabel').textContent=(state.session.user.user_metadata?.full_name||state.session.user.email||'สมาชิก')+' · '+(role||'สมาชิก');
}
function renderProjects(){
  const selected=$('departmentFilter').value,projects=state.projects.filter(p=>!selected||p.department_id===selected);
  const c=counts(projects),department=state.departments.find(d=>d.id===selected);
  document.documentElement.style.setProperty('--selected-dept',safeColor(department?.color));
  const definitions=[['total','ภาระงานทั้งหมด'],...Object.entries(STATUSES).map(([key,status])=>[key,status.name])];
  $('summary').innerHTML=definitions.map(([key,label])=>`<div class="stat"><div class="stat-label">${label}</div><div class="stat-value">${c[key]}<small>งาน</small></div></div>`).join('');
  const month=state.month.toLocaleDateString('th-TH',{month:'long',year:'numeric'});
  $('monthLabel').textContent=month;$('scopeLabel').textContent=`${month} · ${department?.name||'ทุกฝ่าย'} · ${projects.length} งาน`;
  $('summaryRows').innerHTML=state.departments.filter(d=>!selected||d.id===selected).map(d=>{
    const x=counts(projects.filter(p=>p.department_id===d.id)),rate=successRate(x);
    return `<tr style="--dept:${safeColor(d.color)}"><th scope="row"><span class="department-name"><i class="dot" aria-hidden="true"></i><span>${escapeHtml(d.name)}</span></span></th>${['total','NOT_STARTED','IN_PROGRESS','DONE','COMPLETED','CANCELLED'].map(k=>`<td>${x[k]}</td>`).join('')}<td>${rate==null?'—':rate+'%'}</td></tr>`;
  }).join('');
  state.calendar.batchRendering(()=>{
    for(const source of state.calendar.getEventSources())source.remove();
    state.calendar.addEventSource(projects.map(project=>({id:project.id,title:project.title,start:project.plan_start,end:exclusiveEnd(project.plan_end),allDay:true,extendedProps:project})));
  });
}
async function profileFor(session){
  if(!session)return null;
  const {data,error}=await state.client.from('fte_profiles').select('id,role,department_id,enabled').eq('id',session.user.id).maybeSingle();
  if(error)throw error;return data;
}
async function refresh(quiet=false){
  if(!state.ready||document.hidden)return;
  const sequence=++state.sequence,epoch=state.epoch;
  state.abort?.abort();const controller=new AbortController();state.abort=controller;
  if(!quiet){document.body.classList.add('is-loading');$('refreshButton').disabled=true;}
  try{
    if(state.mode==='demo')state.projects=demoProjects(state.month);
    else{
      const range=monthBounds(state.month),profile=await profileFor(state.session);
      if(sequence!==state.sequence||epoch!==state.epoch)return;
      let query=state.client.from('fte_projects').select(PROJECT_COLUMNS,{count:'exact'}).lte('plan_start',range.end).gte('plan_end',range.start).order('plan_start').order('id').limit(501).abortSignal(controller.signal);
      if($('departmentFilter').value)query=query.eq('department_id',$('departmentFilter').value);
      const {data,error,count}=await query;
      if(error)throw error;
      if(sequence!==state.sequence||epoch!==state.epoch)return;
      if(count>500||data.length>500)throw Error('เดือนนี้มีมากกว่า 500 งาน กรุณาเลือกฝ่ายเพื่อจำกัดข้อมูลในชุดทดลอง');
      state.projects=data;state.profile=profile;renderAccount();
    }
    if(sequence!==state.sequence||epoch!==state.epoch)return;
    renderProjects();notice('');
    $('connectionLabel').textContent=state.mode==='demo'?'ข้อมูลตัวอย่าง':'เชื่อมต่อ Supabase แล้ว';
  }catch(error){
    if(sequence===state.sequence&&epoch===state.epoch&&!controller.signal.aborted){
      state.projects=[];renderProjects();notice(errorText(error),true);$('connectionLabel').textContent='โหลดข้อมูลไม่สำเร็จ';
    }
  }finally{
    if(sequence===state.sequence){document.body.classList.remove('is-loading');$('refreshButton').disabled=false;}
  }
}
function scheduleRefresh(){clearTimeout(state.timer);state.timer=setTimeout(()=>refresh(true),650);}
async function applySession(session){
  const epoch=++state.epoch;++state.sequence;state.abort?.abort();
  state.session=session;state.profile=null;state.projects=[];renderAccount();renderProjects();
  if($('projectDialog').open)$('projectDialog').close();
  if(state.channel){const previous=state.channel;state.channel=null;await state.client.removeChannel(previous);}
  if(epoch!==state.epoch)return;
  await refresh();
  if(epoch!==state.epoch)return;
  const channel=state.client.channel('fte-calendar-'+epoch).on('postgres_changes',{event:'*',schema:'public',table:'fte_projects'},scheduleRefresh);
  if(session)channel.on('postgres_changes',{event:'*',schema:'public',table:'fte_profiles',filter:'id=eq.'+session.user.id},scheduleRefresh);
  state.channel=channel.subscribe(status=>{
    if(epoch!==state.epoch)return;
    if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')$('connectionLabel').textContent='ข้อมูลพร้อม · กดรีเฟรชได้';
  });
}
function openProject(project){
  $('projectTitle').textContent=project.title;
  $('projectDepartment').textContent=state.departments.find(d=>d.id===project.department_id)?.name||project.department_id;
  $('projectDates').textContent=dateText(project.plan_start)+(project.plan_start===project.plan_end?'':' – '+dateText(project.plan_end));
  $('projectStatus').textContent=STATUSES[project.status]?.name||project.status;
  $('projectDialog').showModal();
}
function setupTheme(){
  let theme;try{theme=localStorage.getItem('fte.supabase.theme');}catch{}
  if(!['light','dark'].includes(theme))theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  const apply=()=>{document.documentElement.dataset.theme=theme;$('themeButton').textContent=theme==='dark'?'โหมดสว่าง':'โหมดมืด';$('themeButton').setAttribute('aria-pressed',String(theme==='dark'));};
  apply();$('themeButton').onclick=()=>{theme=theme==='dark'?'light':'dark';apply();try{localStorage.setItem('fte.supabase.theme',theme);}catch{}};
}
async function init(){
  setupTheme();renderDepartments();renderAccount();
  if(!window.FullCalendar){notice('โหลดปฏิทินไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วเปิดหน้าใหม่',true);return;}
  state.calendar=new window.FullCalendar.Calendar($('calendar'),{
    initialView:'dayGridMonth',locale:'th',height:'auto',dayMaxEvents:3,
    headerToolbar:{left:'prev,next today',center:'title',right:''},buttonText:{today:'วันนี้'},
    datesSet:info=>{state.month=new Date(info.view.currentStart);if(state.ready)refresh();},
    eventContent:info=>{
      const p=info.event.extendedProps,d=state.departments.find(d=>d.id===p.department_id),status=STATUSES[p.status]||STATUSES.NOT_STARTED;
      return {html:`<div class="calendar-event" style="--dept:${safeColor(d?.color)}"><i class="status-dot" style="background:${status.color}" aria-hidden="true"></i>${escapeHtml(d?.name||p.department_id)} : ${escapeHtml(info.event.title)}</div>`};
    },eventClick:info=>openProject(info.event.extendedProps)
  });state.calendar.render();renderProjects();
  $('closeDialog').onclick=()=>$('projectDialog').close();
  $('departmentFilter').onchange=()=>refresh();$('refreshButton').onclick=()=>refresh();
  $('loginButton').onclick=async()=>{
    if(!state.client)return;
    try{
      const redirect=new URL(config.redirectUrl||location.href);redirect.hash='';redirect.search='';
      const {error}=await state.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirect.href}});
      if(error)throw error;
    }catch(error){notice(errorText(error),true);}
  };
  $('logoutButton').onclick=async()=>{const {error}=await state.client.auth.signOut();if(error)notice(errorText(error),true);};
  try{
    state.mode=connectionMode(config);
    if(state.mode==='demo'){state.ready=true;await refresh();return;}
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm');
    state.client=createClient(config.supabaseUrl,config.publishableKey,{auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
    const {data:departments,error}=await state.client.from('fte_departments').select('id,name,color').order('sort_order');
    if(error)throw error;
    state.departments=departments;renderDepartments();state.ready=true;
    const {data:sessionData,error:sessionError}=await state.client.auth.getSession();if(sessionError)throw sessionError;
    state.client.auth.onAuthStateChange((event,session)=>{
      if(event==='INITIAL_SESSION')return;
      if(event==='TOKEN_REFRESHED'){state.session=session;return;}
      // Keep Supabase requests outside the synchronous auth callback.
      setTimeout(()=>applySession(session).catch(e=>notice(errorText(e),true)),0);
    });
    await applySession(sessionData.session);
  }catch(error){state.ready=false;state.projects=[];renderProjects();notice(errorText(error),true);$('connectionLabel').textContent='ตรวจการตั้งค่า';renderAccount();}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleRefresh();});
window.addEventListener('online',scheduleRefresh);
window.addEventListener('offline',()=>notice('ขณะนี้ออฟไลน์ ข้อมูลจะโหลดใหม่เมื่อเชื่อมต่อได้'));
window.addEventListener('pagehide',()=>{if(state.channel)state.channel.unsubscribe();});
if(document.readyState==='complete')init();else window.addEventListener('load',init,{once:true});
