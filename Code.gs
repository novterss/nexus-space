/**
 * ====================================================================
 * โครงการ: ระบบจองห้องประชุมและ Co-working Space
 * รายวิชา: CSC362 Database Systems (sec 02)
 * นักศึกษา: 6800401 นายณพัชรกัณฑ์ พัชญ์ชัยพงศา
 * 
 * ไฟล์: Code.gs (Google Apps Script Backend Controller)
 * หน้าที่: เชื่อมต่อ Google Sheets จัดการตารางข้อมูล 6 ตาราง
 * และให้บริการ API สำหรับ Web App
 * ====================================================================
 */

// ชื่อแผ่นงาน (Sheets) ทั้ง 6 ตารางตามฐานข้อมูล
const SHEET_NAMES = {
  MEMBER: 'MEMBER',
  ROOM: 'ROOM',
  EQUIPMENT: 'EQUIPMENT',
  BOOKING: 'BOOKING',
  BOOKING_EQUIPMENT: 'BOOKING_EQUIPMENT',
  PAYMENT: 'PAYMENT'
};

/**
 * 1. ฟังก์ชัน doGet สำหรับแสดงผลหน้าเว็บ index.html (Web App Endpoint)
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ระบบจองห้องประชุมและ Co-working Space | CSC362')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 2. ฟังก์ชันเริ่มต้นฐานข้อมูล (กดครั้งเดียว ระบบจะสร้าง 6 Sheets พร้อม Mock Data ให้ทันที)
 * สามารถเปิด Script Editor แล้วกด Run ฟังก์ชัน "initDatabase" ได้เลย
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // กำหนดหัวตารางของแต่ละ Sheet
  const schemas = {
    [SHEET_NAMES.MEMBER]: [
      ['MEMBER_CODE', 'FNAME', 'LNAME', 'PHONE', 'EMAIL', 'MEMBER_TYPE', 'REGISTER_DATE'],
      ['M001', 'ณพัชรกัณฑ์', 'พัชญ์ชัยพงศา', '0812345678', 'naphat.p@rsu.ac.th', 'VIP', '2026-01-10'],
      ['M002', 'สมชาย', 'ใจดี', '0899998888', 'somchai.j@gmail.com', 'General', '2026-02-15'],
      ['M003', 'อาริยา', 'วงศ์สว่าง', '0845551234', 'ariya.w@outlook.com', 'Student', '2026-03-01'],
      ['M004', 'กานต์', 'ธีรภาพ', '0823334444', 'karn.t@techcorp.io', 'VIP', '2026-03-12']
    ],
    [SHEET_NAMES.ROOM]: [
      ['ROOM_CODE', 'ROOM_NAME', 'ROOM_TYPE', 'CAPACITY', 'PRICE_PER_HOUR', 'STATUS', 'FLOOR'],
      ['R101', 'Focus Pod A', 'Creative Pod', 2, 120, 'Available', 1],
      ['R102', 'Focus Pod B', 'Creative Pod', 2, 120, 'Occupied', 1],
      ['R201', 'Brainstorm Studio', 'Meeting Room', 6, 250, 'Available', 2],
      ['R301', 'Executive Boardroom', 'Boardroom', 14, 500, 'Occupied', 3],
      ['R401', 'Grand Innovation Hall', 'Event Hall', 40, 1200, 'Available', 4]
    ],
    [SHEET_NAMES.EQUIPMENT]: [
      ['EQUIPMENT_CODE', 'EQUIPMENT_NAME', 'QTY', 'STATUS', 'PRICE'],
      ['EQ01', '4K Laser Projector + จอโปรเจคเตอร์', 5, 'Available', 150],
      ['EQ02', 'Smart Interactive Whiteboard', 3, 'Available', 100],
      ['EQ03', 'ชุดไมโครโฟนไร้สายและระบบเสียงประชุม', 4, 'Available', 120],
      ['EQ04', 'กล้อง 360 องศาสำหรับ Hybrid Meeting', 3, 'Available', 80]
    ],
    [SHEET_NAMES.BOOKING]: [
      ['BOOKING_CODE', 'MEMBER_CODE', 'ROOM_CODE', 'BOOKING_DATE', 'START_TIME', 'END_TIME', 'STATUS', 'TOTAL_PRICE'],
      ['BK20260901', 'M001', 'R201', '2026-09-21', '09:00', '12:00', 'Confirmed', 1000],
      ['BK20260902', 'M002', 'R102', '2026-09-21', '10:00', '12:00', 'Confirmed', 240],
      ['BK20260903', 'M004', 'R301', '2026-09-21', '13:00', '16:00', 'Confirmed', 1970]
    ],
    [SHEET_NAMES.BOOKING_EQUIPMENT]: [
      ['BOOKING_CODE', 'EQUIPMENT_CODE', 'QTY_USED'],
      ['BK20260901', 'EQ01', 1],
      ['BK20260901', 'EQ02', 1],
      ['BK20260903', 'EQ01', 1],
      ['BK20260903', 'EQ03', 2],
      ['BK20260903', 'EQ04', 1]
    ],
    [SHEET_NAMES.PAYMENT]: [
      ['PAYMENT_CODE', 'BOOKING_CODE', 'PAYMENT_DATE', 'AMOUNT', 'METHOD', 'STATUS'],
      ['PAY20260901', 'BK20260901', '2026-09-20 10:30', 1000, 'PromptPay', 'Paid'],
      ['PAY20260902', 'BK20260902', '2026-09-20 11:15', 240, 'Credit Card', 'Paid'],
      ['PAY20260903', 'BK20260903', '2026-09-20 14:00', 1970, 'PromptPay', 'Paid']
    ]
  };

  // วนลูปสร้างแต่ละ Sheet
  for (let sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    } else {
      sheet.clear();
    }
    
    const rows = schemas[sheetName];
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    
    // ตกแต่งหัวตาราง: สีน้ำเงินเข้ม ตัวอักษรสีขาว
    const headerRange = sheet.getRange(1, 1, 1, rows[0].length);
    headerRange.setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumns(1, rows[0].length);
  }

  return { success: true, message: 'สร้างฐานข้อมูลและ Mock Data ครบ 6 ตารางเรียบร้อยแล้ว!' };
}

/**
 * 3. ฟังก์ชันดึงรายการห้องประชุมทั้งหมด (สำหรับหน้าแรก)
 * คืนค่ารายการห้องพร้อมสถานะ Available / Occupied
 */
function getRooms() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.ROOM);
    if (!sheet) return getMockRooms();
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    const rooms = [];
    
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      rooms.push({
        roomCode: row[0],
        roomName: row[1],
        roomType: row[2],
        capacity: Number(row[3]),
        pricePerHour: Number(row[4]),
        status: row[5], // Available (เขียว) หรือ Occupied (แดง)
        floor: Number(row[6])
      });
    }
    return rooms;
  } catch (err) {
    return getMockRooms();
  }
}

/**
 * 4. ฟังก์ชันดึงรายการอุปกรณ์เสริม (สำหรับฟอร์มจอง)
 */
function getEquipments() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.EQUIPMENT);
    if (!sheet) return getMockEquipments();
    
    const data = sheet.getDataRange().getValues();
    const equipments = [];
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      equipments.push({
        equipmentCode: row[0],
        equipmentName: row[1],
        qty: Number(row[2]),
        status: row[3],
        price: Number(row[4] || 100)
      });
    }
    return equipments;
  } catch (err) {
    return getMockEquipments();
  }
}

/**
 * 5. ฟังก์ชันบันทึกการจองห้อง (Transaction: ลง BOOKING, BOOKING_EQUIPMENT, PAYMENT)
 */
function submitBooking(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookingSheet = ss.getSheetByName(SHEET_NAMES.BOOKING);
    const bookingEqSheet = ss.getSheetByName(SHEET_NAMES.BOOKING_EQUIPMENT);
    const paymentSheet = ss.getSheetByName(SHEET_NAMES.PAYMENT);
    const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBER);
    
    if (!bookingSheet) {
      throw new Error('ไม่พบตารางฐานข้อมูล กรุณารัน initDatabase ก่อน');
    }

    // 5.1 ตรวจสอบหรือสร้างข้อมูลสมาชิก (หากไม่มีรหัส)
    let memberCode = data.memberCode;
    if (!memberCode) {
      memberCode = 'M' + Math.floor(100 + Math.random() * 900);
      const regDate = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
      memberSheet.appendRow([
        memberCode,
        data.fname || 'สมาชิกทั่วไป',
        data.lname || '',
        data.phone || '0800000000',
        data.email || 'guest@coworking.space',
        'General',
        regDate
      ]);
    }

    // 5.2 ตรวจสอบการจองซ้ำ (Overlap Time Validation)
    const existingBookings = bookingSheet.getDataRange().getValues();
    for (let i = 1; i < existingBookings.length; i++) {
      let b = existingBookings[i];
      let bRoom = b[2];
      let bDate = Utilities.formatDate(new Date(b[3]), 'GMT+7', 'yyyy-MM-dd');
      let bStart = String(b[4]);
      let bEnd = String(b[5]);
      let bStatus = b[6];

      if (bRoom === data.roomCode && bDate === data.bookingDate && bStatus !== 'Cancelled') {
        // เช็คช่วงเวลาทับซ้อน (StartA < EndB && EndA > StartB)
        if (data.startTime < bEnd && data.endTime > bStart) {
          return {
            success: false,
            message: 'ขออภัย ห้องนี้มีผู้จองในช่วงเวลา ' + bStart + ' - ' + bEnd + ' แล้ว'
          };
        }
      }
    }

    // 5.3 สร้างรหัสการจองและบันทึกลง BOOKING
    const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss');
    const bookingCode = 'BK' + timestamp.substring(2, 10) + Math.floor(10 + Math.random() * 90);
    
    bookingSheet.appendRow([
      bookingCode,
      memberCode,
      data.roomCode,
      data.bookingDate,
      data.startTime,
      data.endTime,
      'Confirmed',
      Number(data.totalPrice)
    ]);

    // 5.4 บันทึกลง BOOKING_EQUIPMENT (Junction Table)
    if (data.equipments && data.equipments.length > 0) {
      data.equipments.forEach(function(eq) {
        bookingEqSheet.appendRow([
          bookingCode,
          eq.equipmentCode,
          Number(eq.qtyUsed || 1)
        ]);
      });
    }

    // 5.5 สร้างรายการบันทึก PAYMENT
    const paymentCode = 'PAY' + timestamp.substring(2, 10) + Math.floor(10 + Math.random() * 90);
    const payDate = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');
    paymentSheet.appendRow([
      paymentCode,
      bookingCode,
      payDate,
      Number(data.totalPrice),
      data.paymentMethod || 'PromptPay',
      'Paid'
    ]);

    return {
      success: true,
      bookingCode: bookingCode,
      paymentCode: paymentCode,
      message: 'จองห้องสำเร็จเรียบร้อยแล้ว!'
    };

  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.toString() };
  }
}

/**
 * 6. ฟังก์ชันดึงประวัติการจองของสมาชิกตามเบอร์โทรหรืออีเมล
 */
function getMemberBookings(searchQuery) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBER);
    const bookingSheet = ss.getSheetByName(SHEET_NAMES.BOOKING);
    const roomSheet = ss.getSheetByName(SHEET_NAMES.ROOM);
    const paymentSheet = ss.getSheetByName(SHEET_NAMES.PAYMENT);
    
    if (!bookingSheet) return [];

    const members = memberSheet.getDataRange().getValues();
    let targetMemberCode = null;
    let memberName = '';
    
    // ค้นหาสมาชิก
    for (let i = 1; i < members.length; i++) {
      if (members[i][0] == searchQuery || members[i][3] == searchQuery || members[i][4] == searchQuery) {
        targetMemberCode = members[i][0];
        memberName = members[i][1] + ' ' + members[i][2];
        break;
      }
    }

    if (!targetMemberCode) {
      return { success: false, message: 'ไม่พบข้อมูลสมาชิกจากเบอร์โทรหรือรหัสที่ระบุ' };
    }

    // ดึงห้องเพื่อหาชื่อห้อง
    const rooms = roomSheet.getDataRange().getValues();
    const roomMap = {};
    for (let i = 1; i < rooms.length; i++) {
      roomMap[rooms[i][0]] = rooms[i][1];
    }

    // ดึงสถานะการจ่ายเงิน
    const payments = paymentSheet.getDataRange().getValues();
    const payMap = {};
    for (let i = 1; i < payments.length; i++) {
      payMap[payments[i][1]] = { status: payments[i][5], method: payments[i][4] };
    }

    // ดึงรายการจอง
    const bookings = bookingSheet.getDataRange().getValues();
    const result = [];
    for (let i = 1; i < bookings.length; i++) {
      let b = bookings[i];
      if (b[1] == targetMemberCode) {
        let bDate = Utilities.formatDate(new Date(b[3]), 'GMT+7', 'yyyy-MM-dd');
        let payInfo = payMap[b[0]] || { status: 'Pending', method: '-' };
        result.push({
          bookingCode: b[0],
          memberName: memberName,
          roomCode: b[2],
          roomName: roomMap[b[2]] || b[2],
          bookingDate: bDate,
          startTime: b[4],
          endTime: b[5],
          status: b[6],
          totalPrice: b[7],
          paymentStatus: payInfo.status,
          paymentMethod: payInfo.method
        });
      }
    }

    return { success: true, memberName: memberName, bookings: result };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * 7. ฟังก์ชันสำหรับหน้า Admin: ดึงรายการจองทั้งหมด
 */
function getAllBookingsAdmin() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookingSheet = ss.getSheetByName(SHEET_NAMES.BOOKING);
    const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBER);
    const roomSheet = ss.getSheetByName(SHEET_NAMES.ROOM);
    const paymentSheet = ss.getSheetByName(SHEET_NAMES.PAYMENT);
    
    if (!bookingSheet) return getMockAdminBookings();

    const members = memberSheet.getDataRange().getValues();
    const memberMap = {};
    for (let i = 1; i < members.length; i++) {
      memberMap[members[i][0]] = members[i][1] + ' ' + members[i][2] + ' (' + members[i][3] + ')';
    }

    const rooms = roomSheet.getDataRange().getValues();
    const roomMap = {};
    for (let i = 1; i < rooms.length; i++) {
      roomMap[rooms[i][0]] = rooms[i][1];
    }

    const payments = paymentSheet.getDataRange().getValues();
    const payMap = {};
    for (let i = 1; i < payments.length; i++) {
      payMap[payments[i][1]] = { code: payments[i][0], status: payments[i][5], method: payments[i][4] };
    }

    const bookings = bookingSheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < bookings.length; i++) {
      let b = bookings[i];
      let bDate = Utilities.formatDate(new Date(b[3]), 'GMT+7', 'yyyy-MM-dd');
      let pay = payMap[b[0]] || { status: 'Pending', method: '-' };
      list.push({
        bookingCode: b[0],
        memberInfo: memberMap[b[1]] || b[1],
        roomName: roomMap[b[2]] || b[2],
        bookingDate: bDate,
        startTime: b[4],
        endTime: b[5],
        status: b[6],
        totalPrice: b[7],
        paymentStatus: pay.status,
        paymentMethod: pay.method
      });
    }
    return list.reverse(); // เอาล่าสุดขึ้นก่อน
  } catch (err) {
    return getMockAdminBookings();
  }
}

/**
 * 8. ฟังก์ชัน Admin: อัปเดตสถานะการชำระเงิน
 */
function updatePaymentStatus(bookingCode, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const paymentSheet = ss.getSheetByName(SHEET_NAMES.PAYMENT);
    const data = paymentSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === bookingCode) {
        paymentSheet.getRange(i + 1, 6).setValue(newStatus);
        return { success: true, message: 'อัปเดตสถานะเป็น ' + newStatus + ' เรียบร้อย' };
      }
    }
    return { success: false, message: 'ไม่พบรายการจองนี้ในระบบ' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==========================================
// Mock Data สำรองกรณีไม่ได้เชื่อม Google Sheets
// ==========================================
function getMockRooms() {
  return [
    { roomCode: 'R101', roomName: 'Focus Pod A', roomType: 'Creative Pod', capacity: 2, pricePerHour: 120, status: 'Available', floor: 1 },
    { roomCode: 'R102', roomName: 'Focus Pod B', roomType: 'Creative Pod', capacity: 2, pricePerHour: 120, status: 'Occupied', floor: 1 },
    { roomCode: 'R201', roomName: 'Brainstorm Studio', roomType: 'Meeting Room', capacity: 6, pricePerHour: 250, status: 'Available', floor: 2 },
    { roomCode: 'R301', roomName: 'Executive Boardroom', roomType: 'Boardroom', capacity: 14, pricePerHour: 500, status: 'Occupied', floor: 3 },
    { roomCode: 'R401', roomName: 'Grand Innovation Hall', roomType: 'Event Hall', capacity: 40, pricePerHour: 1200, status: 'Available', floor: 4 }
  ];
}

function getMockEquipments() {
  return [
    { equipmentCode: 'EQ01', equipmentName: '4K Laser Projector + จอโปรเจคเตอร์', qty: 5, status: 'Available', price: 150 },
    { equipmentCode: 'EQ02', equipmentName: 'Smart Interactive Whiteboard', qty: 3, status: 'Available', price: 100 },
    { equipmentCode: 'EQ03', equipmentName: 'ชุดไมโครโฟนไร้สายและระบบเสียงประชุม', qty: 4, status: 'Available', price: 120 },
    { equipmentCode: 'EQ04', equipmentName: 'กล้อง 360 องศาสำหรับ Hybrid Meeting', qty: 3, status: 'Available', price: 80 }
  ];
}

function getMockAdminBookings() {
  return [
    { bookingCode: 'BK20260901', memberInfo: 'ณพัชรกัณฑ์ พัชญ์ชัยพงศา (0812345678)', roomName: 'Brainstorm Studio', bookingDate: '2026-09-21', startTime: '09:00', endTime: '12:00', status: 'Confirmed', totalPrice: 1000, paymentStatus: 'Paid', paymentMethod: 'PromptPay' },
    { bookingCode: 'BK20260902', memberInfo: 'สมชาย ใจดี (0899998888)', roomName: 'Focus Pod B', bookingDate: '2026-09-21', startTime: '10:00', endTime: '12:00', status: 'Confirmed', totalPrice: 240, paymentStatus: 'Paid', paymentMethod: 'Credit Card' },
    { bookingCode: 'BK20260903', memberInfo: 'กานต์ ธีรภาพ (0823334444)', roomName: 'Executive Boardroom', bookingDate: '2026-09-21', startTime: '13:00', endTime: '16:00', status: 'Confirmed', totalPrice: 1970, paymentStatus: 'Pending', paymentMethod: 'PromptPay' }
  ];
}
