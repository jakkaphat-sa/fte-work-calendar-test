import test from 'node:test';
import assert from 'node:assert/strict';
import {monthBounds,exclusiveEnd,overlaps,counts,successRate,escapeHtml,safeColor,connectionMode,demoProjects,PROJECT_COLUMNS} from '../docs/domain.js';
test('Month range includes leap-year February and December correctly',()=>{
  assert.deepEqual(monthBounds(new Date(2024,1,15)),{start:'2024-02-01',end:'2024-02-29'});
  assert.deepEqual(monthBounds(new Date(2026,11,15)),{start:'2026-12-01',end:'2026-12-31'});
});
test('Inclusive project end becomes an exclusive calendar end across month/year',()=>{
  assert.equal(exclusiveEnd('2026-10-31'),'2026-11-01');assert.equal(exclusiveEnd('2026-12-31'),'2027-01-01');
});
test('Long projects overlapping the month remain visible',()=>{
  const range={start:'2026-10-01',end:'2026-10-31'};
  assert.equal(overlaps({plan_start:'2026-09-28',plan_end:'2026-11-05'},range),true);
  assert.equal(overlaps({plan_start:'2026-11-01',plan_end:'2026-11-05'},range),false);
});
test('Status counts and rate exclude cancelled projects from the denominator',()=>{
  const c=counts([{status:'COMPLETED'},{status:'IN_PROGRESS'},{status:'CANCELLED'}]);
  assert.equal(c.total,3);assert.equal(c.COMPLETED,1);assert.equal(c.CANCELLED,1);assert.equal(successRate(c),50);
  assert.equal(successRate(counts([{status:'CANCELLED'}])),null);assert.equal(successRate(counts([])),null);
});
test('Untrusted titles and department names cannot inject markup',()=>{
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escapeHtml("'&"),'&#39;&amp;');
});
test('Department color is a validated hex value',()=>{assert.equal(safeColor('#aAbBcC'),'#aAbBcC');assert.equal(safeColor('red;display:none'),'#0891b2');});
test('Empty config is demo; partial config never silently becomes demo',()=>{
  assert.equal(connectionMode({supabaseUrl:'',publishableKey:''}),'demo');
  assert.throws(()=>connectionMode({supabaseUrl:'https://test.supabase.co',publishableKey:''}));
});
test('Only a cloud URL and browser publishable key are accepted',()=>{
  assert.equal(connectionMode({supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test_key'}),'supabase');
  for(const publishableKey of ['sb_secret_test','eyJserviceRole','service_role'])assert.throws(()=>connectionMode({supabaseUrl:'https://test.supabase.co',publishableKey}));
  for(const supabaseUrl of ['http://test.supabase.co','https://test.supabase.co.evil.test','https://x:y@test.supabase.co','https://test.supabase.co/auth'])assert.throws(()=>connectionMode({supabaseUrl,publishableKey:'sb_publishable_test'}));
});
test('Demo records track the selected month and fetch fields exclude owner data',()=>{
  assert.equal(demoProjects(new Date(2026,9,1)).length,4);
  assert.ok(demoProjects(new Date(2026,9,1)).every(p=>p.plan_start.startsWith('2026-10')));
  assert.ok(!PROJECT_COLUMNS.includes('owner_id'));assert.ok(!PROJECT_COLUMNS.includes('email'));
});
