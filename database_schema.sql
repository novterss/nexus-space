-- ====================================================================
-- โครงการ: ระบบจองห้องประชุมและ Co-working Space
-- รายวิชา: CSC362 Database Systems (sec 02)
-- นักศึกษา: 6800401 นายณพัชรกัณฑ์ พัชญ์ชัยพงศา
-- DBMS: PostgreSQL (มาตรฐาน RDBMS)
-- หมายเหตุการปรับปรุงตามคำแนะนำอาจารย์:
-- 1. ยุบตาราง PAYMENT รวมเข้าใน BOOKING (ลด Over-normalization ป้องกันตาราง 1:1 ซ้ำซ้อน)
-- 2. เพิ่มตาราง BOOKING_ROOM (แก้ความสัมพันธ์ Many-to-Many ทำให้ 1 การจองเลือกได้หลายห้อง)
-- ====================================================================

-- 1. ลบตารางเดิมออกหากมีอยู่ (เรียงลำดับจากตารางลูกไปตารางแม่)
DROP TABLE IF EXISTS BOOKING_EQUIPMENT CASCADE;
DROP TABLE IF EXISTS BOOKING_ROOM CASCADE;
DROP TABLE IF EXISTS BOOKING CASCADE;
DROP TABLE IF EXISTS EQUIPMENT CASCADE;
DROP TABLE IF EXISTS ROOM CASCADE;
DROP TABLE IF EXISTS MEMBER CASCADE;
DROP TABLE IF EXISTS PAYMENT CASCADE; -- ลบตาราง PAYMENT เดิมทิ้ง

-- ====================================================================
-- ตารางที่ 1: MEMBER (ข้อมูลสมาชิก)
-- ====================================================================
CREATE TABLE MEMBER (
    MEMBER_CODE VARCHAR(20) PRIMARY KEY,
    FNAME VARCHAR(50) NOT NULL,
    LNAME VARCHAR(50) NOT NULL,
    PHONE VARCHAR(20) UNIQUE NOT NULL,
    EMAIL VARCHAR(100) UNIQUE NOT NULL,
    MEMBER_TYPE VARCHAR(20) DEFAULT 'General' CHECK (MEMBER_TYPE IN ('General', 'VIP', 'Student')),
    REGISTER_DATE DATE DEFAULT CURRENT_DATE
);

COMMENT ON TABLE MEMBER IS 'ตารางจัดเก็บข้อมูลสมาชิกผู้ใช้งาน Co-working Space';
COMMENT ON COLUMN MEMBER.MEMBER_CODE IS 'รหัสสมาชิก (Primary Key) เช่น M001';
COMMENT ON COLUMN MEMBER.MEMBER_TYPE IS 'ประเภทสมาชิก: General, VIP, Student';

-- ====================================================================
-- ตารางที่ 2: ROOM (ข้อมูลห้องประชุม/พื้นที่ทำงาน)
-- ====================================================================
CREATE TABLE ROOM (
    ROOM_CODE VARCHAR(20) PRIMARY KEY,
    ROOM_NAME VARCHAR(100) NOT NULL,
    ROOM_TYPE VARCHAR(50) NOT NULL CHECK (ROOM_TYPE IN ('Meeting Room', 'Creative Pod', 'Boardroom', 'Event Hall')),
    CAPACITY INT NOT NULL CHECK (CAPACITY > 0),
    PRICE_PER_HOUR DECIMAL(10, 2) NOT NULL CHECK (PRICE_PER_HOUR >= 0),
    STATUS VARCHAR(20) DEFAULT 'Available' CHECK (STATUS IN ('Available', 'Occupied', 'Maintenance')),
    FLOOR INT NOT NULL
);

COMMENT ON TABLE ROOM IS 'ตารางจัดเก็บข้อมูลห้องประชุมและพื้นที่ทำงาน';
COMMENT ON COLUMN ROOM.STATUS IS 'สถานะห้อง: Available (ว่าง-สีเขียว), Occupied (ไม่ว่าง-สีแดง), Maintenance (ปิดปรับปรุง)';

-- ====================================================================
-- ตารางที่ 3: EQUIPMENT (ข้อมูลอุปกรณ์เสริมที่ให้บริการ)
-- ====================================================================
CREATE TABLE EQUIPMENT (
    EQUIPMENT_CODE VARCHAR(20) PRIMARY KEY,
    EQUIPMENT_NAME VARCHAR(100) NOT NULL,
    QTY INT NOT NULL DEFAULT 0 CHECK (QTY >= 0),
    STATUS VARCHAR(20) DEFAULT 'Available' CHECK (STATUS IN ('Available', 'Out of Stock', 'Maintenance')),
    PRICE DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (PRICE >= 0)
);

COMMENT ON TABLE EQUIPMENT IS 'ตารางจัดเก็บอุปกรณ์เสริม เช่น โปรเจคเตอร์ ไวท์บอร์ดอัจฉริยะ';
COMMENT ON COLUMN EQUIPMENT.PRICE IS 'ราคาค่าบริการอุปกรณ์เสริมต่อครั้ง (บาท)';

-- ====================================================================
-- ตารางที่ 4: BOOKING (ข้อมูลการจองห้องประชุม + รวมข้อมูลการชำระเงิน)
-- ====================================================================
CREATE TABLE BOOKING (
    BOOKING_CODE VARCHAR(20) PRIMARY KEY,
    MEMBER_CODE VARCHAR(20) NOT NULL,
    BOOKING_DATE DATE NOT NULL,
    START_TIME TIME NOT NULL,
    END_TIME TIME NOT NULL,
    STATUS VARCHAR(20) DEFAULT 'Confirmed' CHECK (STATUS IN ('Confirmed', 'Pending', 'Cancelled', 'Completed')),
    TOTAL_PRICE DECIMAL(10, 2) NOT NULL CHECK (TOTAL_PRICE >= 0),
    
    -- รวมข้อมูลการชำระเงินเข้ามาในตาราง BOOKING โดยตรง (แก้ปัญหา 1:1 Over-normalization)
    PAYMENT_METHOD VARCHAR(30) DEFAULT 'PromptPay' CHECK (PAYMENT_METHOD IN ('PromptPay', 'Credit Card', 'Bank Transfer', 'Cash')),
    PAYMENT_STATUS VARCHAR(20) DEFAULT 'Paid' CHECK (PAYMENT_STATUS IN ('Paid', 'Pending', 'Refunded')),
    PAYMENT_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- สร้าง Foreign Key เชื่อมกับตาราง MEMBER
    CONSTRAINT FK_BOOKING_MEMBER FOREIGN KEY (MEMBER_CODE) REFERENCES MEMBER(MEMBER_CODE) ON DELETE RESTRICT,
    
    -- เช็คเวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น
    CONSTRAINT CHK_BOOKING_TIME CHECK (END_TIME > START_TIME)
);

COMMENT ON TABLE BOOKING IS 'ตารางบันทึกการจองและข้อมูลการชำระเงิน (Header การจอง)';
COMMENT ON COLUMN BOOKING.TOTAL_PRICE IS 'ราคารวมสุทธิ (รวมค่าห้องทุกห้องที่เลือกคำนวณตามชั่วโมง + ค่าอุปกรณ์เสริม)';
COMMENT ON COLUMN BOOKING.PAYMENT_STATUS IS 'สถานะการชำระเงิน: Paid (ชำระแล้ว), Pending (รอชำระ), Refunded (คืนเงิน)';

-- ====================================================================
-- ตารางที่ 5: BOOKING_ROOM (ตารางเชื่อม Many-to-Many การจองกับห้องประชุม)
-- ทำให้ 1 การจอง สามารถเลือกจองได้หลายห้องพร้อมกัน
-- ====================================================================
CREATE TABLE BOOKING_ROOM (
    BOOKING_CODE VARCHAR(20) NOT NULL,
    ROOM_CODE VARCHAR(20) NOT NULL,
    
    -- ใช้ Composite Primary Key (PK คู่) ป้องกันการบันทึกห้องซ้ำในการจองใบเดิม
    PRIMARY KEY (BOOKING_CODE, ROOM_CODE),
    
    -- Foreign Keys เชื่อมกับ BOOKING และ ROOM
    CONSTRAINT FK_BR_BOOKING FOREIGN KEY (BOOKING_CODE) REFERENCES BOOKING(BOOKING_CODE) ON DELETE CASCADE,
    CONSTRAINT FK_BR_ROOM FOREIGN KEY (ROOM_CODE) REFERENCES ROOM(ROOM_CODE) ON DELETE RESTRICT
);

COMMENT ON TABLE BOOKING_ROOM IS 'ตารางเชื่อม Many-to-Many ระหว่างการจองและห้องประชุม (รองรับการจองหลายห้องใน 1 บิล)';

-- ====================================================================
-- ตารางที่ 6: BOOKING_EQUIPMENT (ตารางเชื่อม Many-to-Many การจองกับอุปกรณ์)
-- ====================================================================
CREATE TABLE BOOKING_EQUIPMENT (
    BOOKING_CODE VARCHAR(20) NOT NULL,
    EQUIPMENT_CODE VARCHAR(20) NOT NULL,
    QTY_USED INT NOT NULL DEFAULT 1 CHECK (QTY_USED > 0),
    
    -- ใช้ Composite Primary Key (PK คู่)
    PRIMARY KEY (BOOKING_CODE, EQUIPMENT_CODE),
    
    -- Foreign Keys
    CONSTRAINT FK_BE_BOOKING FOREIGN KEY (BOOKING_CODE) REFERENCES BOOKING(BOOKING_CODE) ON DELETE CASCADE,
    CONSTRAINT FK_BE_EQUIPMENT FOREIGN KEY (EQUIPMENT_CODE) REFERENCES EQUIPMENT(EQUIPMENT_CODE) ON DELETE RESTRICT
);

COMMENT ON TABLE BOOKING_EQUIPMENT IS 'ตารางเชื่อมความสัมพันธ์ Many-to-Many ระหว่างการจองและอุปกรณ์ที่ยืมใช้';

-- ====================================================================
-- ข้อมูลตัวอย่างเริ่มต้น (SAMPLE SEED DATA)
-- ====================================================================

-- 1. เพิ่มข้อมูลสมาชิก
INSERT INTO MEMBER (MEMBER_CODE, FNAME, LNAME, PHONE, EMAIL, MEMBER_TYPE, REGISTER_DATE) VALUES
('M001', 'ณพัชรกัณฑ์', 'พัชญ์ชัยพงศา', '0812345678', 'naphat.p@rsu.ac.th', 'VIP', '2026-01-10'),
('M002', 'สมชาย', 'ใจดี', '0899998888', 'somchai.j@gmail.com', 'General', '2026-02-15'),
('M003', 'อาริยา', 'วงศ์สว่าง', '0845551234', 'ariya.w@outlook.com', 'Student', '2026-03-01'),
('M004', 'กานต์', 'ธีรภาพ', '0823334444', 'karn.t@techcorp.io', 'VIP', '2026-03-12');

-- 2. เพิ่มข้อมูลห้องประชุม/พื้นที่
INSERT INTO ROOM (ROOM_CODE, ROOM_NAME, ROOM_TYPE, CAPACITY, PRICE_PER_HOUR, STATUS, FLOOR) VALUES
('R101', 'Focus Pod A', 'Creative Pod', 2, 120.00, 'Available', 1),
('R102', 'Focus Pod B', 'Creative Pod', 2, 120.00, 'Occupied', 1),
('R201', 'Brainstorm Studio', 'Meeting Room', 6, 250.00, 'Available', 2),
('R301', 'Executive Boardroom', 'Boardroom', 14, 500.00, 'Occupied', 3),
('R401', 'Grand Innovation Hall', 'Event Hall', 40, 1200.00, 'Available', 4);

-- 3. เพิ่มข้อมูลอุปกรณ์เสริม
INSERT INTO EQUIPMENT (EQUIPMENT_CODE, EQUIPMENT_NAME, QTY, STATUS, PRICE) VALUES
('EQ01', '4K Laser Projector + จอโปรเจคเตอร์', 5, 'Available', 150.00),
('EQ02', 'Smart Interactive Whiteboard', 3, 'Available', 100.00),
('EQ03', 'ชุดไมโครโฟนไร้สายและระบบเสียงประชุม', 4, 'Available', 120.00),
('EQ04', 'กล้อง 360 องศาสำหรับ Hybrid Meeting', 3, 'Available', 80.00);

-- 4. เพิ่มข้อมูลการจองห้อง (พร้อมสถานะการชำระเงินในตารางเดียว)
-- BK20260901: จอง 1 ห้อง (R201: 250 x 3ชม = 750) + EQ01(150) + EQ02(100) = 1,000 บาท
-- BK20260902: จอง 2 ห้องพร้อมกัน! (R101: 120 + R102: 120 = 240/ชม. x 2ชม.) = 480 บาท
-- BK20260903: จอง 1 ห้อง (R301: 500 x 3ชม = 1500) + EQ01(150) + EQ03(120x2) + EQ04(80) = 1,970 บาท
INSERT INTO BOOKING (BOOKING_CODE, MEMBER_CODE, BOOKING_DATE, START_TIME, END_TIME, STATUS, TOTAL_PRICE, PAYMENT_METHOD, PAYMENT_STATUS, PAYMENT_DATE) VALUES
('BK20260901', 'M001', '2026-09-21', '09:00:00', '12:00:00', 'Confirmed', 1000.00, 'PromptPay', 'Paid', '2026-09-20 10:30:00'),
('BK20260902', 'M002', '2026-09-21', '10:00:00', '12:00:00', 'Confirmed', 480.00, 'Credit Card', 'Paid', '2026-09-20 11:15:00'),
('BK20260903', 'M004', '2026-09-21', '13:00:00', '16:00:00', 'Confirmed', 1970.00, 'PromptPay', 'Pending', NULL);

-- 5. เพิ่มข้อมูลห้องที่จองในแต่ละใบจอง (ตารางเชื่อม BOOKING_ROOM)
INSERT INTO BOOKING_ROOM (BOOKING_CODE, ROOM_CODE) VALUES
('BK20260901', 'R201'),
('BK20260902', 'R101'), -- จอง Focus Pod A
('BK20260902', 'R102'), -- และจอง Focus Pod B พร้อมกันในบิลเดียว!
('BK20260903', 'R301');

-- 6. เพิ่มข้อมูลการใช้อุปกรณ์เสริมในการจอง (ตารางเชื่อม BOOKING_EQUIPMENT)
INSERT INTO BOOKING_EQUIPMENT (BOOKING_CODE, EQUIPMENT_CODE, QTY_USED) VALUES
('BK20260901', 'EQ01', 1),
('BK20260901', 'EQ02', 1),
('BK20260903', 'EQ01', 1),
('BK20260903', 'EQ03', 2),
('BK20260903', 'EQ04', 1);

-- ตรวจสอบข้อมูลทั้งหมด
SELECT 'Data successfully initialized for CSC362 Project (Updated Schema)!' AS Result;
