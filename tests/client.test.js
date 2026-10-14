// Execute the shipped client against a small DOM/calendar/API adapter.
// These tests do not execute Supabase RLS or render a browser screenshot.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as domain from '../docs/domain.js';
const html=fs.readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const source=fs.readFileSync(new URL('../docs/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function harness(){
  const elements=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],{id:m[1],value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,open:false,attrs:{},classes:new Set(),setAttribute(k,v){this.attrs[k]=v;},replaceChildren(...options){this.options=options;this.value='';},classList:{toggle(){}},close(){this.open=false;},showModal(){this.open=true;}}]));
  class Calendar{
    constructor(el,options){this.options=options;this.sources=[];}
    render(){this.options.datesSet({view:{currentStart:new Date(2026,9,1)}});}
    batchRendering(fn){fn();}
    getEventSources(){return this.sources;}
    addEventSource(events){const self=this;const source={events,remove(){self.sources=self.sources.filter(s=>s!==source);}};this.sources.push(source);}
  }
  const events={},style={};
  const ctx=vm.createContext({...domain,config:{supabaseUrl:'',publishableKey:'',redirectUrl:''},document:{readyState:'loading',hidden:false,getElementById:id=>elements.get(id),addEventListener(){},body:{classList:{add(){},remove(){}}},documentElement:{dataset:{},style:{setProperty:(k,v)=>style[k]=v}}},window:{FullCalendar:{Calendar},addEventListener:(event,fn)=>events[event]=fn},matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},Option:class{constructor(text,value){this.text=text;this.value=value;}},Date,URL,AbortController,setTimeout,clearTimeout,console,location:{href:'https://example.github.io/fte-work-calendar-test/'}});
  vm.runInContext(source,ctx);return {ctx,elements,state:vm.runInContext('state',ctx)};
}
function queryFor(data,count=data.length){
  const calls=[];const q={};for(const name of ['select','lte','gte','order','limit','abortSignal','eq'])q[name]=(...args)=>{calls.push([name,...args]);return q;};
  q.then=(resolve,reject)=>Promise.resolve({data,error:null,count}).then(resolve,reject);return {q,calls};
}
test('First boot shows a labelled demo with four projects and usable theme control',async()=>{
  const h=harness();await h.ctx.init();assert.equal(h.state.projects.length,4);assert.equal(h.elements.get('connectionLabel').textContent,'ข้อมูลตัวอย่าง');assert.equal(h.elements.get('loginButton').disabled,true);
  h.elements.get('themeButton').onclick();assert.equal(h.ctx.document.documentElement.dataset.theme,'dark');
});
test('Department filter changes counts, table rows and event source together',async()=>{
  const h=harness();await h.ctx.init();h.elements.get('departmentFilter').value='ACADEMIC';await h.ctx.refresh();
  assert.equal(h.state.calendar.sources.length,1);assert.equal(h.state.calendar.sources[0].events.length,1);assert.ok(h.elements.get('summaryRows').innerHTML.includes('ฝ่ายวิชาการ'));assert.ok(!h.elements.get('summaryRows').innerHTML.includes('ฝ่ายบริหาร'));
});
test('Month navigation replaces the event source instead of accumulating sources',async()=>{
  const h=harness();await h.ctx.init();h.state.month=new Date(2026,10,1);await h.ctx.refresh();await h.ctx.refresh();
  assert.equal(h.state.calendar.sources.length,1);assert.ok(h.state.projects.every(p=>p.plan_start.startsWith('2026-11')));
});
test('Connected read sends both overlap boundaries and selected department',async()=>{
  const h=harness();await h.ctx.init();const {q,calls}=queryFor(domain.demoProjects(h.state.month));h.state.mode='supabase';h.state.client={from:name=>{assert.equal(name,'fte_projects');return q;}};h.elements.get('departmentFilter').value='PLAN';await h.ctx.refresh();
  assert.ok(calls.some(c=>c[0]==='lte'&&c[1]==='plan_start'&&c[2]==='2026-10-31'));assert.ok(calls.some(c=>c[0]==='gte'&&c[1]==='plan_end'&&c[2]==='2026-10-01'));assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='department_id'&&c[2]==='PLAN'));
});
test('Oversized and failed reads clear stale data rather than show partial summaries',async()=>{
  const h=harness();await h.ctx.init();h.state.mode='supabase';h.state.client={from:()=>queryFor([],501).q};await h.ctx.refresh();assert.equal(h.state.projects.length,0);assert.match(h.elements.get('notice').textContent,/500/);
  h.state.client={from:()=>{throw Error('network unavailable');}};await h.ctx.refresh();assert.equal(h.state.projects.length,0);assert.equal(h.elements.get('connectionLabel').textContent,'โหลดข้อมูลไม่สำเร็จ');
});
test('A late response from an old account cannot repopulate the screen',async()=>{
  const h=harness();await h.ctx.init();const {q}=queryFor([]);let release;q.then=(resolve)=>new Promise(r=>{release=result=>r(resolve(result));});h.state.mode='supabase';h.state.client={from:()=>q};
  const pending=h.ctx.refresh();await new Promise(r=>setTimeout(r,0));h.state.epoch++;h.state.sequence++;h.state.projects=[];
  release({data:domain.demoProjects(),error:null,count:4});await pending;assert.equal(h.state.projects.length,0);
});
test('Project detail uses text, and calendar event HTML escapes an injected title',async()=>{
  const h=harness();await h.ctx.init();const project={...h.state.projects[0],title:'<script>alert(1)</script>'};h.ctx.openProject(project);assert.equal(h.elements.get('projectTitle').textContent,project.title);assert.equal(h.elements.get('projectDialog').open,true);
  const content=h.state.calendar.options.eventContent({event:{title:project.title,extendedProps:project}});assert.ok(content.html.includes('&lt;script&gt;'));assert.ok(!content.html.includes('<script>'));
});
