-- ====================================================================
-- โครงการ: ระบบจองห้องประชุมและ Co-working Space
-- รายวิชา: CSC362 Database Systems (sec 02)
-- นักศึกษา: 6800401 นายณพัชรกัณฑ์ พัชญ์ชัยพงศา
-- DBMS: PostgreSQL (มาตรฐาน RDBMS)
-- ====================================================================

-- 1. ลบตารางเดิมออกหากมีอยู่ (เรียงลำดับจากตารางลูกไปตารางแม่)
DROP TABLE IF EXISTS PAYMENT CASCADE;
DROP TABLE IF EXISTS BOOKING_EQUIPMENT CASCADE;
DROP TABLE IF EXISTS BOOKING CASCADE;
DROP TABLE IF EXISTS EQUIPMENT CASCADE;
DROP TABLE IF EXISTS ROOM CASCADE;
DROP TABLE IF EXISTS MEMBER CASCADE;

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

COMMENT ON COLUMN EQUIPMENT.PRICE IS 'ราคาค่าบริการอุปกรณ์เสริมต่อครั้ง (บาท)';

COMMENT ON TABLE EQUIPMENT IS 'ตารางจัดเก็บอุปกรณ์เสริม เช่น โปรเจคเตอร์ ไวท์บอร์ดอัจฉริยะ';

-- ====================================================================
-- ตารางที่ 4: BOOKING (ข้อมูลการจองห้องประชุม)
-- ====================================================================
CREATE TABLE BOOKING (
    BOOKING_CODE VARCHAR(20) PRIMARY KEY,
    MEMBER_CODE VARCHAR(20) NOT NULL,
    ROOM_CODE VARCHAR(20) NOT NULL,
    BOOKING_DATE DATE NOT NULL,
    START_TIME TIME NOT NULL,
    END_TIME TIME NOT NULL,
    STATUS VARCHAR(20) DEFAULT 'Confirmed' CHECK (STATUS IN ('Confirmed', 'Pending', 'Cancelled', 'Completed')),
    TOTAL_PRICE DECIMAL(10, 2) NOT NULL CHECK (TOTAL_PRICE >= 0),
    
    -- สร้าง Foreign Key เชื่อมกับตาราง MEMBER และ ROOM
    CONSTRAINT FK_BOOKING_MEMBER FOREIGN KEY (MEMBER_CODE) REFERENCES MEMBER(MEMBER_CODE) ON DELETE RESTRICT,
    CONSTRAINT FK_BOOKING_ROOM FOREIGN KEY (ROOM_CODE) REFERENCES ROOM(ROOM_CODE) ON DELETE RESTRICT,
    
    -- เช็คเวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น
    CONSTRAINT CHK_BOOKING_TIME CHECK (END_TIME > START_TIME)
);

COMMENT ON TABLE BOOKING IS 'ตารางบันทึกการจองห้องประชุม';
COMMENT ON COLUMN BOOKING.TOTAL_PRICE IS 'ราคารวมสุทธิ (ราคาห้องคำนวณตามชั่วโมง + ค่าอุปกรณ์เสริม)';

-- ====================================================================
-- ตารางที่ 5: BOOKING_EQUIPMENT (ตารางเชื่อม Many-to-Many การจองกับอุปกรณ์)
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
-- ตารางที่ 6: PAYMENT (ข้อมูลการชำระเงิน)
-- ====================================================================
CREATE TABLE PAYMENT (
    PAYMENT_CODE VARCHAR(20) PRIMARY KEY,
    BOOKING_CODE VARCHAR(20) NOT NULL,
    PAYMENT_DATE TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    AMOUNT DECIMAL(10, 2) NOT NULL CHECK (AMOUNT >= 0),
    METHOD VARCHAR(30) NOT NULL CHECK (METHOD IN ('PromptPay', 'Credit Card', 'Bank Transfer', 'Cash')),
    STATUS VARCHAR(20) DEFAULT 'Paid' CHECK (STATUS IN ('Paid', 'Pending', 'Refunded')),
    
    CONSTRAINT FK_PAYMENT_BOOKING FOREIGN KEY (BOOKING_CODE) REFERENCES BOOKING(BOOKING_CODE) ON DELETE CASCADE
);

COMMENT ON TABLE PAYMENT IS 'ตารางบันทึกข้อมูลและประวัติการชำระเงิน';

-- ====================================================================
-- ข้อมูลตัวอย่างเริ่มต้น (SAMPLE SEED DATA)
-- ====================================================================

-- 1. เพิ่มข้อมูลสมาชิก
INSERT INTO MEMBER (MEMBER_CODE, FNAME, LNAME, PHONE, EMAIL, MEMBER_TYPE, REGISTER_DATE) VALUES
('M001', 'ณพัชรกัณฑ์', 'พัชญ์ชัยพงศา', '0812345678', 'naphat@cmu.ac.th', 'VIP', '2026-01-10'),
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

-- 4. เพิ่มข้อมูลการจองห้อง
-- คำนวณ BK20260901: R201 ราคา 250/ชม. x 3 ชม. = 750 + EQ01(150) + EQ02(100) = 1,000
-- คำนวณ BK20260902: R102 ราคา 120/ชม. x 2 ชม. = 240 (ไม่มีอุปกรณ์)
-- คำนวณ BK20260903: R301 ราคา 500/ชม. x 3 ชม. = 1500 + EQ01(150) + EQ03(120x2) + EQ04(80) = 1,970
INSERT INTO BOOKING (BOOKING_CODE, MEMBER_CODE, ROOM_CODE, BOOKING_DATE, START_TIME, END_TIME, STATUS, TOTAL_PRICE) VALUES
('BK20260901', 'M001', 'R201', '2026-09-21', '09:00:00', '12:00:00', 'Confirmed', 1000.00),
('BK20260902', 'M002', 'R102', '2026-09-21', '10:00:00', '12:00:00', 'Confirmed', 240.00),
('BK20260903', 'M004', 'R301', '2026-09-21', '13:00:00', '16:00:00', 'Confirmed', 1970.00);

-- 5. เพิ่มข้อมูลการใช้อุปกรณ์เสริมในการจอง
INSERT INTO BOOKING_EQUIPMENT (BOOKING_CODE, EQUIPMENT_CODE, QTY_USED) VALUES
('BK20260901', 'EQ01', 1),
('BK20260901', 'EQ02', 1),
('BK20260903', 'EQ01', 1),
('BK20260903', 'EQ03', 2),
('BK20260903', 'EQ04', 1);

-- 6. เพิ่มข้อมูลการชำระเงิน
INSERT INTO PAYMENT (PAYMENT_CODE, BOOKING_CODE, PAYMENT_DATE, AMOUNT, METHOD, STATUS) VALUES
('PAY20260901', 'BK20260901', '2026-09-20 10:30:00', 1000.00, 'PromptPay', 'Paid'),
('PAY20260902', 'BK20260902', '2026-09-20 11:15:00', 240.00, 'Credit Card', 'Paid'),
('PAY20260903', 'BK20260903', '2026-09-20 14:00:00', 1970.00, 'PromptPay', 'Paid');

-- ตรวจสอบข้อมูลทั้งหมด
SELECT 'Data successfully initialized for CSC362 Project!' AS Result;
