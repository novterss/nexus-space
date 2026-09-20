# Prompt สำหรับสั่ง Gemini ทำสไลด์นำเสนอ

คัดลอก prompt ด้านล่างนี้ทั้งหมดไปวางใน Gemini ได้เลย:

---

## PROMPT (ก๊อปปี้ตั้งแต่บรรทัดถัดไปจนถึงจุดสิ้นสุด)

```
ช่วยสร้างสไลด์นำเสนอ (Google Slides) ให้หน่อยครับ สำหรับวิชา Database Systems ระดับมหาวิทยาลัย จำนวน 7 สไลด์ ดีไซน์โทนสีน้ำเงินเข้ม-ขาว ดูเป็นมืออาชีพ สะอาดตา อ่านง่าย

ข้อมูลโปรเจค:
- ชื่อโปรเจค: ระบบจองห้องประชุมและ Co-working Space
- วิชา: CSC362-64 sec02 Database Systems
- อาจารย์ผู้สอน: อ.สุมนา เกษมสวัสดิ์
- ผู้จัดทำ: 6800401 นายณพัชรกัณฑ์ พัชญ์ชัยพงศา
- DBMS: PostgreSQL
- ภาษา: SQL, JavaScript, HTML5/CSS3

โครงสร้างสไลด์ 7 หน้า:

สไลด์ 1 - หน้าปก:
หัวข้อใหญ่: "ระบบจองห้องประชุมและ Co-working Space"
หัวข้อย่อย: "การออกแบบและพัฒนาระบบฐานข้อมูลเชิงสัมพันธ์ด้วย PostgreSQL"
ข้อมูลผู้จัดทำ: "นายณพัชรกัณฑ์ พัชญ์ชัยพงศา | รหัส 6800401"
ข้อมูลวิชา: "CSC362-64 sec02 Database Systems | อ.สุมนา เกษมสวัสดิ์"

สไลด์ 2 - ที่มาของปัญหาและขอบเขตระบบ:
หัวข้อ: "ที่มาของปัญหาและขอบเขตของระบบ"
แบ่งเป็น 2 ส่วน
ส่วนซ้าย - ปัญหา 3 ข้อ:
  1. การจองซ้ำซ้อน (Double Booking) จากการจดลงกระดาษหรือแชต
  2. ไม่ทราบสถานะห้องว่าง/ไม่ว่างแบบเรียลไทม์
  3. คำนวณราคาผิดพลาดเมื่อมีอุปกรณ์เสริมหลายรายการ
ส่วนขวา - ขอบเขตงาน 5 ข้อ:
  1. จัดการข้อมูลสมาชิกและห้องประชุม
  2. แสดงสถานะห้องว่าง (สีเขียว) / ไม่ว่าง (สีแดง)
  3. ฟอร์มจองห้องพร้อมเลือกอุปกรณ์เสริม
  4. คำนวณราคาอัตโนมัติ: (ราคาห้อง × ชั่วโมง) + ค่าอุปกรณ์
  5. แสดงประวัติการจองและระบบตรวจสอบสำหรับผู้ดูแล

สไลด์ 3 - ER Diagram:
หัวข้อ: "แผนภาพความสัมพันธ์ ER Diagram (6 ตาราง)"
เว้นพื้นที่ตรงกลางไว้ให้ใส่รูป ER Diagram (จะแปะรูปทีหลัง)
ด้านล่างใส่ข้อความสรุปความสัมพันธ์:
  - MEMBER (1) → (M) BOOKING
  - ROOM (1) → (M) BOOKING
  - EQUIPMENT (1) → (M) BOOKING_EQUIPMENT
  - BOOKING (1) → (M) BOOKING_EQUIPMENT
  - BOOKING (1) → (M) PAYMENT

สไลด์ 4 - Normalization & Junction Table:
หัวข้อ: "การจัดการความสัมพันธ์ Many-to-Many"
เนื้อหาสำคัญ:
  - ปัญหา: 1 การจอง ยืมอุปกรณ์ได้หลายชิ้น และ 1 อุปกรณ์ ถูกยืมได้ในหลายการจอง → ความสัมพันธ์ M:M
  - วิธีแก้ไข: ทำ Normalization แตกเป็นตารางเชื่อม "BOOKING_EQUIPMENT"
  - Primary Key: ใช้ Composite Primary Key คู่ (BOOKING_CODE + EQUIPMENT_CODE) ป้องกันการบันทึกอุปกรณ์ชิ้นเดิมซ้ำในการจองใบเดิม
  แสดงเป็นแผนภาพ: BOOKING ←→ BOOKING_EQUIPMENT ←→ EQUIPMENT

สไลด์ 5 - โครงสร้างตารางใน PostgreSQL:
หัวข้อ: "โครงสร้างฐานข้อมูล 6 ตาราง (PostgreSQL)"
แสดงเป็นตาราง 2 คอลัมน์ (ชื่อตาราง | Field หลัก):
  1. MEMBER: MEMBER_CODE (PK), FNAME, LNAME, PHONE, EMAIL, MEMBER_TYPE, REGISTER_DATE
  2. ROOM: ROOM_CODE (PK), ROOM_NAME, ROOM_TYPE, CAPACITY, PRICE_PER_HOUR, STATUS, FLOOR
  3. EQUIPMENT: EQUIPMENT_CODE (PK), EQUIPMENT_NAME, QTY, STATUS, PRICE
  4. BOOKING: BOOKING_CODE (PK), MEMBER_CODE (FK), ROOM_CODE (FK), BOOKING_DATE, START_TIME, END_TIME, STATUS, TOTAL_PRICE
  5. BOOKING_EQUIPMENT: BOOKING_CODE (PK,FK), EQUIPMENT_CODE (PK,FK), QTY_USED → Composite PK
  6. PAYMENT: PAYMENT_CODE (PK), BOOKING_CODE (FK), PAYMENT_DATE, AMOUNT, METHOD, STATUS

สไลด์ 6 - หน้าจอจำลอง UI Prototype:
หัวข้อ: "ตัวอย่างหน้าจอ Web Interface Prototype"
เว้นพื้นที่ตรงกลางไว้ให้ใส่รูป Screenshot (จะแปะรูปทีหลัง)
ด้านล่างระบุ 3 จุดสำคัญ:
  - หน้ารายการห้อง: สถานะสีเขียว (ว่าง) / สีแดง (ไม่ว่าง)
  - ฟอร์มจอง: เลือกเวลาและอุปกรณ์เสริม พร้อมคำนวณราคาแบบ Real-time
  - หน้า Admin: ตรวจสอบรายการจองและอัปเดตสถานะชำระเงิน

สไลด์ 7 - สรุปและ Q&A:
หัวข้อ: "สรุปผลและตอบข้อซักถาม"
เนื้อหา:
  - ระบบช่วยลดปัญหาการจองซ้ำซ้อน
  - จัดการข้อมูลอย่างเป็นระเบียบตามหลักฐานข้อมูลเชิงสัมพันธ์ (Relational Database)
  - รองรับการขยายตัวในอนาคต
  ข้อความปิด: "ขอขอบพระคุณอาจารย์ และพร้อมรับฟังคำแนะนำหรือตอบข้อซักถามครับ"

หมายเหตุ: ขอดีไซน์ที่ดูเป็นทางการ สะอาดตา ไม่รกเกินไป ใช้ไอคอนประกอบได้ ตัวอักษรอ่านง่าย ขนาดเหมาะสม
```

---

## วิธีใช้ prompt นี้

1. เปิด **Google Gemini** (gemini.google.com) หรือ **Gemini ใน Google Slides**
2. ก๊อปปี้ prompt ทั้งหมดด้านบน (ตั้งแต่ "ช่วยสร้างสไลด์..." ถึง "...ขนาดเหมาะสม")
3. วางใน Gemini แล้วกด Enter
4. Gemini จะสร้างสไลด์ให้ 7 หน้า
5. **สิ่งที่ต้องทำเพิ่มเติมหลังได้สไลด์:**
   - สไลด์ 3: แปะรูป ER Diagram (แคปจากไฟล์ er_diagram_access_style.html)
   - สไลด์ 6: แปะรูป Screenshot หน้าเว็บ (แคปจากไฟล์ index.html)

## ถ้าใช้ Canva แทน Google Slides

ก๊อปปี้ prompt เดียวกันไปวางใน Canva Magic Design / Canva AI ได้เลย เปลี่ยนคำว่า "(Google Slides)" เป็น "(Canva Presentation)" ก็พอครับ
