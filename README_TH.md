# FTE Work Calendar — GitHub Pages + Supabase ชุดเริ่มต้น 0.1

ชุดแรกสำหรับทดลองปฏิทิน สรุปสถานะ เข้าสู่ระบบด้วย Google และอ่านข้อมูลตามสิทธิ์ เป็นโปรเจกต์ใหม่แยกจาก Google Apps Script

## สิ่งที่ทำได้ในชุดนี้

- เปิดปฏิทินแบบเดือน กรองฝ่าย กดงานดูรายละเอียด และดูตารางสรุปที่จัดตัวเลขกึ่งกลาง
- โหมดสว่าง/มืด สีประจำฝ่าย และตราคณะจากระบบเดิม
- เมื่อ config ว่าง ใช้ข้อมูลตัวอย่าง 4 งาน ป้ายบนหน้าจอระบุ “ข้อมูลตัวอย่าง”
- เมื่อใส่ config อ่านข้อมูลจาก Supabase จริง รับสัญญาณเปลี่ยนแปลงแล้วโหลดเดือนที่เปิดใหม่ โดยหน่วงรวมสัญญาณ 650ms
- Google OAuth ไม่รับรหัสผ่านบนหน้า GitHub Pages สมาชิกใหม่เห็นเฉพาะงานสาธารณะจนกว่าผู้ดูแลจะกำหนดสิทธิ์
- Browser อ่านข้อมูลได้อย่างเดียว งานเพิ่ม/แก้ใช้ SQL Editor หรือ Table Editor ของโครงการทดลองในรอบนี้

ยังไม่ใช่การย้ายระบบครบชุด: การมอบงาน รายงาน/ตรวจรับ ยกเลิกโครงการ PDF แผน P/A สรุปรายไตรมาส/ปี อีเมลแจ้งเตือน และการนำเข้าประวัติ Google Sheets จะพัฒนาหลังทดสอบส่วนนี้

## 1. สร้าง Supabase project ก่อน

1. เปิด https://supabase.com/dashboard สมัครหรือเข้าสู่ระบบ
2. กด New project และเลือก Organization ถ้ายังไม่มีให้สร้างตามหน้าจอ
3. ตั้งชื่อ `fte-work-calendar-test` และตั้ง Database password เก็บไว้กับตัวเอง ไม่ต้องส่งรหัสผ่านให้ใคร
4. เลือก Region เช่น Singapore สำหรับทดลองจากไทย แล้วสร้าง project
5. รอจน project พร้อม แล้วเปิด SQL Editor → New query
6. คัดลอกเนื้อหา `supabase/01_schema.sql` ลงไปแล้ว Run
7. เปิด query ใหม่ คัดลอก `supabase/02_sample_data.sql` แล้ว Run

จะได้ 4 ฝ่าย และงานตัวอย่างในเดือนปัจจุบัน 5 งาน โดย 4 งานเป็นสาธารณะ อีก 1 งานเป็นงานภายในสำหรับตรวจสิทธิ์ ชุด SQL ใช้กับ project ใหม่สำหรับทดลอง

## 2. ใส่ค่าการเชื่อมต่อ

1. กด Connect ใน Supabase project เพื่อดู Project URL และ Publishable key หรือเปิด Settings → API Keys เพื่อเลือก key
2. เปิด `docs/config.js` แก้เฉพาะ `supabaseUrl` และ `publishableKey`

```js
export const config = Object.freeze({
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  publishableKey: 'sb_publishable_YOUR_KEY',
  redirectUrl: ''
});
```

Publishable key ถูกออกแบบให้ใช้ใน browser ได้ สิทธิ์จริงคุมด้วย RLS ในฐานข้อมูล ไฟล์ config.js จะเปิดเผยบนเว็บไซต์ ห้ามใส่ Database password, Google Client Secret, sb_secret หรือ service_role

## 3. นำโค้ดขึ้น GitHub Pages

1. เปิด https://github.com/new สร้าง repository ชื่อ `fte-work-calendar-test`
2. หากใช้ GitHub Free ให้เลือก Public สำหรับ GitHub Pages และตั้ง Add README ให้สร้าง branch main
3. แตก ZIP แล้วอัปโหลดเนื้อหาด้านในโฟลเดอร์ `fte-supabase-starter` เข้า repository โดยคงโฟลเดอร์ `docs` และ `supabase` ไว้
4. ใช้ Add file → Upload files ลากโฟลเดอร์/ไฟล์ แล้ว Commit changes หรือใช้ Git ตามปกติ
5. เข้า Settings → Pages → Build and deployment → Source เลือก Deploy from a branch
6. เลือก branch `main` และโฟลเดอร์ `/docs` แล้ว Save
7. รอ GitHub แสดง URL แล้วกด Visit site โดยทั่วไปเป็น `https://YOUR_USERNAME.github.io/fte-work-calendar-test/`

ไม่ต้องใช้ npm build สำหรับการเผยแพร่ชุดนี้ Pages ใช้เฉพาะไฟล์ใน docs ส่วน SQL คู่มือ และ tests อยู่นอกโฟลเดอร์ที่เผยแพร่ Repository Public ยังอ่าน source เหล่านี้ได้ จึงใช้เฉพาะข้อมูลตัวอย่างและไม่มีข้อมูลโครงการจริงใน ZIP

ตอนนี้ควรเปิดหน้าปฏิทินได้และขึ้น “เชื่อมต่อ Supabase แล้ว” ผู้ที่ยังไม่ได้ล็อกอินเห็นงานสาธารณะ 4 งาน

## 4. เปิด Google login เมื่อหน้าเว็บใช้งานได้

1. เปิด https://console.cloud.google.com/ สร้างหรือเลือก Google Cloud project
2. ใน Google Auth Platform ตั้ง Branding และ Audience ตามบัญชีที่ใช้ หากเป็น External/Testing ให้เพิ่มอีเมลผู้ทดสอบ หากมีองค์กรที่รองรับ Internal ให้ตั้งตามนโยบายองค์กร
3. ใช้ scopes `openid`, `userinfo.email`, `userinfo.profile`
4. สร้าง OAuth client ชนิด Web application
5. Authorized JavaScript origins ใส่ `https://YOUR_USERNAME.github.io` โดยไม่ใส่ชื่อ repository ต่อท้าย
6. เปิด Supabase → Authentication → Sign In / Providers → Google แล้วคัดลอก Callback URL ที่ Supabase แสดง โดยทั่วไปเป็น `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
7. ใส่ Callback URL นั้นใน Authorized redirect URIs ของ Google OAuth client
8. ใส่ Google Client ID และ Client Secret ในหน้า Google provider ของ Supabase แล้ว Enable/Save ทั้งสองค่านี้ไม่ต้องใส่ใน GitHub
9. Supabase → Authentication → URL Configuration: ตั้ง Site URL และ Redirect URLs เป็น URL GitHub Pages ของคุณพร้อมชื่อ repository และ `/` ท้าย URL
10. ตั้ง `redirectUrl` ใน `docs/config.js` เป็น URL เดียวกัน Commit แล้วรอ Pages อัปเดต จากนั้นกดเข้าสู่ระบบด้วย Google

ถ้าทดลองที่ localhost ให้เพิ่ม URL ที่ใช้จริงใน Redirect URLs เช่น `http://localhost:5500/docs/` และเพิ่ม origin `http://localhost:5500` ใน Google ตามขั้นตอนข้างบน ปกติ redirect ของ Google กลับไปที่ Supabase ก่อน แล้ว Supabase จึงกลับมาที่เว็บ

## 5. กำหนดสิทธิ์บัญชีแรก

1. เข้าสู่ระบบบนเว็บด้วย Google ครั้งหนึ่ง เพื่อให้บัญชีปรากฏใน Supabase → Authentication → Users
2. เปิด `supabase/03_grant_first_admin.sql` เปลี่ยน `YOUR_EMAIL@example.invalid` ทั้งสองตำแหน่งเป็นอีเมลบัญชีของคุณ
3. Run ใน SQL Editor เท่านั้น แล้วกดรีเฟรชหน้าเว็บ
4. บัญชีนี้จะเป็น SUPER_ADMIN และเห็นงานตัวอย่างภายในเพิ่มเป็น 5 งาน

ผู้ใช้ที่เข้าระบบยังแก้ไขโครงการผ่าน API ไม่ได้ในชุดเริ่มต้น บทบาทนี้ใช้ตรวจขอบเขตการอ่านข้อมูลก่อน การเพิ่ม/มอบหมาย/แก้ไขโครงการจะมีฟังก์ชันฝั่งฐานข้อมูลที่ตรวจสิทธิ์ในระยะถัดไป

| บัญชี | ขอบเขตการอ่านในชุดทดลอง |
|---|---|
| ไม่ล็อกอิน หรือยังไม่มี profile/ถูกปิดใช้งาน | งานที่ is_public = true |
| SUPER_ADMIN / EXECUTIVE ที่ enabled | ทุกงาน |
| DEPT_ADMIN ที่ enabled | งานสาธารณะ + งานภายในฝ่ายตน |
| ASSIGNEE ที่ enabled | งานสาธารณะ + งานภายในที่ owner_id ตรงกับบัญชีตน |

## 6. ตรวจการเชื่อมต่อและ Realtime

- เปิดแบบไม่ล็อกอินหรือ Incognito: ควรเห็นเฉพาะ 4 งานสาธารณะ ไม่เห็นชื่อ “โครงการภายในสำหรับตรวจสิทธิ์”
- ล็อกอินด้วยบัญชีแรกที่กำหนด SUPER_ADMIN: ควรเห็น 5 งาน กดดูรายละเอียดได้
- เปิด Table Editor ของ Supabase แก้ status ของงานตัวอย่างสาธารณะหนึ่งงาน กด Save แล้วดูปฏิทิน/จำนวนงานในเว็บโดยไม่กดรีเฟรช
- ออกจากระบบ: งานภายในและรายละเอียดที่เปิดอยู่ต้องถูกล้าง แล้วกลับมาเห็นงานสาธารณะ
- ลองสลับเดือน เลือกฝ่าย และเปิดโหมดมืด
- รัน `supabase/04_inspect_setup.sql`: relrowsecurity ต้อง true ทั้ง 3 ตาราง, INSERT/UPDATE/DELETE ของ anon และ authenticated ต้อง false, และ publication มี fte_projects กับ fte_profiles
- ตรวจสมาชิกต่างฝ่ายด้วยบัญชีทดสอบก่อนนำข้อมูลจริงเข้า ระบบเก่ายังเป็นแหล่งข้อมูลใช้งานจนกว่าจะนำเข้าครบและเทียบจำนวน/ประวัติ

หากไม่ได้รับ Realtime ให้ตรวจ Database → Replication / Publications ว่าตารางถูกเพิ่มใน supabase_realtime แล้ว และโครงการ/เครือข่ายรองรับ WebSocket สามารถกดรีเฟรชดูข้อมูลล่าสุดได้

## ทดสอบบนเครื่อง

ใช้ VS Code Live Server หรือเปิด terminal ในโฟลเดอร์ชุดเริ่มต้นแล้วรัน:

```bash
python -m http.server 5500
```

เปิด `http://localhost:5500/docs/` ไม่เปิด index.html ผ่าน file:// เพราะ JavaScript modules ต้องใช้ HTTP

ทดสอบ JavaScript ด้วย Node.js 22 หรือใหม่กว่า:

```bash
node --test tests/*.test.js
```

ตรวจออฟไลน์ 16 กรณี: วันที่ข้ามเดือน/ปี, จำนวนและอัตราสำเร็จ, config/keys, การหนี HTML, ตัวกรองและการเปลี่ยนเดือน, query แบบช่วงวันที่ทับเดือน, ข้อมูลตอบกลับเก่าหลังเปลี่ยนบัญชี และการล้างข้อมูลเมื่ออ่านล้มเหลว

ยังไม่ได้รัน SQL/RLS บน Supabase project จริง ทดสอบ OAuth/Re​altime กับบัญชีจริง หรือเรนเดอร์ด้วย Chromium ต้องทำตามขั้นตอนตรวจด้านบนหลังสร้างบัญชีและ project

## ลำดับงานหลังชุดเริ่มต้น

1. ทดสอบ RLS ทุกบทบาทและบัญชีต่างฝ่าย รวมการปิดใช้งานผู้ใช้
2. สร้างรายการผู้รับงานและการมอบหมาย พร้อมตรวจสิทธิ์/การแก้ไขพร้อมกันฝั่งฐานข้อมูล
3. เพิ่มรายงานความคืบหน้า ตรวจรับ ส่งกลับ และยกเลิก พร้อมประวัติการแก้ไข
4. เพิ่ม Storage แบบ private สำหรับ PDF พร้อมสิทธิ์และลิงก์ดูตัวอย่างที่มีอายุ
5. เพิ่มสรุปไตรมาส/ปี แผน P/A และแจ้งเตือนตามกติกาเดิม
6. เขียนตัวนำเข้าจาก Google Sheets เก็บรหัสเดิม/ประวัติ และย้ายหรือเชื่อม PDF หลังตรวจจำนวนเทียบตรงกัน
7. ทดสอบผู้ใช้จริงและเปลี่ยน URL ใช้งานเมื่อพร้อม

## เอกสารอ้างอิง

- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/realtime/postgres-changes
- https://github.com/supabase/supabase-js/releases/tag/v2.117.3

ไลบรารีในหน้าเว็บ: FullCalendar 6.1.19 และ Supabase JS 2.117.3 แบบตรึงรุ่น โหลดจาก CDN เมื่อจำเป็น ไม่ต้องติดตั้ง dependencies เพื่อใช้หน้าเว็บ
