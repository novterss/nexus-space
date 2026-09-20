# 🚀 คู่มือเชื่อม GitHub + Deploy Vercel + ปักหมุดหน้าโปรไฟล์ (Portfolio)

เอกสารนี้รวบรวมขั้นตอนทีละสเต็ปแบบเข้าใจง่าย สำหรับ:
1. นำโค้ดขึ้น **GitHub** (`github.com/Novterss/nexus-space`)
2. Deploy ขึ้น **Vercel** ให้ได้ลิงก์เว็บใช้งานจริงฟรีตลอดชีพ
3. **ปักหมุด (Pin)** โชว์โปรเจคนี้เด่นๆ บนหน้าโปรไฟล์ GitHub ของคุณ

---

## 📌 ขั้นตอนที่ 1: สร้าง Repository บน GitHub (ใช้เวลา 1 นาที)

1. เปิดเว็บ **[github.com](https://github.com/)** แล้วเข้าสู่ระบบ (User: `Novterss`)
2. คลิกปุ่ม **`+`** สีเขียว หรือ **`New`** ที่มุมซ้ายบน เพื่อสร้าง Repository ใหม่
3. กรอกข้อมูลดังนี้:
   - **Repository name:** `nexus-space` *(หรือชื่อที่คุณต้องการ)*
   - **Description:** `🏢 Full-stack Meeting Room & Co-working Space Booking System with PostgreSQL & JavaScript | CSC362 Database Systems Project`
   - **Public / Private:** เลือก **`Public`** *(สำคัญ! เพื่อให้ปักหมุดโชว์หน้าโปรไฟล์และใส่พอร์ตได้)*
   - ⚠️ **ไม่ต้องติ๊ก** "Add a README file", "Add .gitignore", หรือ "Choose a license" *(เพราะในเครื่องเราสร้างไว้ครบสมบูรณ์แล้ว)*
4. กดปุ่ม **`Create repository`** สีเขียว

---

## 📌 ขั้นตอนที่ 2: Push โค้ดจากเครื่องขึ้น GitHub (ใช้เวลา 30 วินาที)

หลังจากสร้าง repo แล้ว ให้เปิด **PowerShell** หรือ Terminal ในโฟลเดอร์นี้ แล้วรัน 2 คำสั่งนี้:

```powershell
git remote add origin https://github.com/Novterss/nexus-space.git
git push -u origin main
```

> 💡 **หมายเหตุ:**  
> หาก Windows ถามยืนยันสิทธิ์ GitHub ให้กดปุ่ม **"Sign in with your browser"** แล้วกดอนุมัติในเว็บได้เลย  
> เท่านี้โค้ดทั้งหมด พร้อม README สวยๆ สองภาษาจะขึ้นไปอยู่บน GitHub ทันที!

---

## 📌 ขั้นตอนที่ 3: Deploy ขึ้น Vercel ได้เว็บจริง (ฟรี 100%)

วิธีที่แนะนำที่สุดและง่ายที่สุดคือ **เชื่อมผ่าน GitHub** (เมื่อใดก็ตามที่คุณแก้โค้ดแล้ว push ขึ้น GitHub เว็บจะอัปเดตให้อัตโนมัติ!):

### วิธีผ่านหน้าเว็บ Vercel (แนะนำที่สุด 🌟):
1. ไปที่เว็บ **[vercel.com](https://vercel.com/)** แล้วกด **Log In** ด้วย GitHub Account (`Novterss`)
2. บนหน้า Dashboard กดปุ่ม **`Add New...`** มุมขวาบน → เลือก **`Project`**
3. คุณจะเห็นลิสต์โปรเจคจาก GitHub ให้กดปุ่ม **`Import`** ข้างๆ ชื่อ **`nexus-space`**
4. ในหน้า Configure Project:
   - **Framework Preset:** เลือก `Other` (หรือปล่อยเป็นค่า default)
   - **Root Directory:** `./` (ปล่อยตามเดิม)
   - **Build and Output Settings:** ปล่อยตามเดิม
5. กดปุ่ม **`Deploy`** สีฟ้า!
6. รอประมาณ 10–20 วินาที หน้าจอจะขึ้นลูกโป่ง Confetti 🎉 พร้อมลิงก์ เช่น:
   `https://nexus-space-xxxx.vercel.app`

### หรือวิธีรันผ่าน Terminal (ถ้าต้องการทำในเครื่อง):
1. พิมพ์คำสั่ง:
   ```powershell
   vercel login
   ```
2. เลือกยืนยันผ่านเบราว์เซอร์ (GitHub)
3. รันคำสั่ง deploy:
   ```powershell
   vercel --prod
   ```

---

## 📌 ขั้นตอนที่ 4: ปักหมุด (Pin) โชว์บนหน้าโปรไฟล์ GitHub

เพื่อให้เวลามีคนหรืออาจารย์ หรือ HR เปิดเข้ามาดู `github.com/Novterss` แล้วเห็นโปรเจคนี้เป็นผลงานเด่นทันที:

1. เปิดหน้าโปรไฟล์ตัวเอง: **`https://github.com/Novterss`**
2. มองหาแท็บ **"Overview"**
3. เลื่อนลงมาใต้ Bio จะเจอปุ่ม **`Customize your pins`** (หรือ **`Edit pins`**)
4. ติ๊กเครื่องหมายถูกหน้า **`nexus-space`**
5. กดปุ่ม **`Save pins`**
6. ✨ โปรเจคนี้จะขึ้นเป็นการ์ดโชว์หราอยู่บนสุดของหน้าโปรไฟล์คุณทันที!

---

## 📌 ขั้นตอนที่ 5: ตกแต่ง Repository บน GitHub ให้เหมือนมือโปร

เมื่อเข้าไปที่หน้ารวมไฟล์ของ repo `https://github.com/Novterss/nexus-space`:

1. มองหาปุ่ม **⚙️ ฟันเฟือง** ข้างๆ ส่วน **"About"** (มุมขวาบนของหน้าเว็บ)
2. กรอกข้อมูล:
   - **Description:** `🏢 Full-stack Meeting Room & Co-working Space Booking System with PostgreSQL & JavaScript | CSC362 Project`
   - **Website:** ใส่ลิงก์ Vercel ที่ได้จากขั้นตอนที่ 3 เช่น `https://nexus-space.vercel.app`
   - **Include in the home page:** ติ๊กถูกทั้ง `Releases`, `Packages`, `Environments`
3. ในช่อง **Topics** ให้พิมพ์แท็กเหล่านี้ลงไป (ช่วยให้ติด search และดูโปรมาก):
   - `postgresql`
   - `database-systems`
   - `booking-system`
   - `javascript`
   - `csc362`
   - `sql`
   - `coworking-space`
   - `responsive-design`
   - `vercel`
4. กด **`Save changes`**

---

## 📌 ขั้นตอนที่ 6: อัปเดตลิงก์ในเอกสารส่งงานอาจารย์

เมื่อได้ลิงก์ Vercel แล้ว:
1. นำลิงก์ Vercel และ GitHub ไปใส่ใน:
   - [PROJECT_SUBMISSION_INFO.md](file:///c:/Users/User/Desktop/CSCMONDAY/PROJECT_SUBMISSION_INFO.md)
   - สไลด์นำเสนอหน้าสุดท้าย
2. เมื่ออาจารย์เปิดชีทวิชา หรือคลิกลิงก์ จะสามารถคลิกลองเล่นระบบจริงบนมือถือหรือคอมพิวเตอร์ได้ทันที โดยไม่ต้องรันโค้ดในเครื่องอาจารย์เลย! 🚀
