/**
 * ====================================================================
 * โครงการ: ระบบจองห้องประชุมและ Co-working Space
 * รายวิชา: CSC362 Database Systems (sec 02)
 * นักศึกษา: 6800401 นายณพัชรกัณฑ์ พัชญ์ชัยพงศา
 * 
 * ไฟล์: Code.gs (Google Apps Script Backend Controller)
 * โครงสร้างใหม่ตามคำแนะนำอาจารย์:
 * 1. ยุบตาราง PAYMENT รวมเข้าในตาราง BOOKING (แก้ปัญหา 1:1 Over-normalization)
 * 2. เพิ่มตารางเชื่อม BOOKING_ROOM (Many-to-Many ทำให้จองหลายห้องพร้อมกันได้ใน 1 บิล)
 * ====================================================================
 */

// ชื่อแผ่นงาน (Sheets) 6 ตารางตามฐานข้อมูลที่ปรับปรุงแล้ว
const SHEET_NAMES = {
  MEMBER: 'MEMBER',
  ROOM: 'ROOM',
  EQUIPMENT: 'EQUIPMENT',
  BOOKING: 'BOOKING',
  BOOKING_ROOM: 'BOOKING_ROOM',
  BOOKING_EQUIPMENT: 'BOOKING_EQUIPMENT'
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
 * 2. ฟังก์ชันเริ่มต้นฐานข้อมูล (สร้าง Sheets พร้อม Mock Data ตามโครงสร้างใหม่)
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ลบ Sheet PAYMENT เดิมออกหากมีอยู่ (เนื่องจากยุบรวมเข้า BOOKING แล้ว)
  const oldPaymentSheet = ss.getSheetByName('PAYMENT');
  if (oldPaymentSheet) {
    try { ss.deleteSheet(oldPaymentSheet); } catch(e) {}
  }

  // กำหนดหัวตารางและ Mock Data ของแต่ละ Sheet
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
      // รวมฟิลด์ชำระเงินเข้ามาในตาราง BOOKING โดยตรง
      ['BOOKING_CODE', 'MEMBER_CODE', 'BOOKING_DATE', 'START_TIME', 'END_TIME', 'STATUS', 'TOTAL_PRICE', 'PAYMENT_METHOD', 'PAYMENT_STATUS', 'PAYMENT_DATE'],
      ['BK20260901', 'M001', '2026-09-21', '09:00', '12:00', 'Confirmed', 1000, 'PromptPay', 'Paid', '2026-09-20 10:30'],
      ['BK20260902', 'M002', '2026-09-21', '10:00', '12:00', 'Confirmed', 480, 'Credit Card', 'Paid', '2026-09-20 11:15'], // จอง 2 ห้องพร้อมกัน
      ['BK20260903', 'M004', '2026-09-21', '13:00', '16:00', 'Confirmed', 1970, 'PromptPay', 'Pending', '']
    ],
    [SHEET_NAMES.BOOKING_ROOM]: [
      // ตารางเชื่อม Many-to-Many: 1 การจองเลือกได้หลายห้อง
      ['BOOKING_CODE', 'ROOM_CODE'],
      ['BK20260901', 'R201'],
      ['BK20260902', 'R101'], // บิล BK20260902 จองห้อง Focus Pod A
      ['BK20260902', 'R102'], // และจองห้อง Focus Pod B พร้อมกันในบิลเดียว!
      ['BK20260903', 'R301']
    ],
    [SHEET_NAMES.BOOKING_EQUIPMENT]: [
      ['BOOKING_CODE', 'EQUIPMENT_CODE', 'QTY_USED'],
      ['BK20260901', 'EQ01', 1],
      ['BK20260901', 'EQ02', 1],
      ['BK20260903', 'EQ01', 1],
      ['BK20260903', 'EQ03', 2],
      ['BK20260903', 'EQ04', 1]
    ]
  };

  for (let sheetName in schemas) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    } else {
      sheet.clear();
    }
    
    const rows = schemas[sheetName];
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    
    const headerRange = sheet.getRange(1, 1, 1, rows[0].length);
    headerRange.setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumns(1, rows[0].length);
  }

  return { success: true, message: 'ปรับปรุงฐานข้อมูลตามคำแนะนำอาจารย์ (ยุบ Payment + จองหลายห้อง) เรียบร้อยแล้ว!' };
}

/**
 * 3. ฟังก์ชันดึงรายการห้องประชุมทั้งหมด
 */
function getRooms() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.ROOM);
    if (!sheet) return getMockRooms();
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const rooms = [];
    for (let i = 1; i < data.length; i++) {
      let row = data[i];
      rooms.push({
        roomCode: row[0],
        roomName: row[1],
        roomType: row[2],
        capacity: Number(row[3]),
        pricePerHour: Number(row[4]),
        status: row[5],
        floor: Number(row[6])
      });
    }
    return rooms;
  } catch (err) {
    return getMockRooms();
  }
}

/**
 * 4. ฟังก์ชันดึงรายการอุปกรณ์เสริม
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
 * 5. ฟังก์ชันบันทึกการจองห้อง (Transaction: ลง BOOKING, BOOKING_ROOM หลายห้อง, และ BOOKING_EQUIPMENT)
 */
function submitBooking(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookingSheet = ss.getSheetByName(SHEET_NAMES.BOOKING);
    const bookingRoomSheet = ss.getSheetByName(SHEET_NAMES.BOOKING_ROOM);
    const bookingEqSheet = ss.getSheetByName(SHEET_NAMES.BOOKING_EQUIPMENT);
    const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBER);
    
    if (!bookingSheet || !bookingRoomSheet) {
      throw new Error('ไม่พบตารางฐานข้อมูล กรุณารัน initDatabase ก่อน');
    }

    // แปลง roomCodes ให้เป็น Array เสมอ (รองรับทั้งจอง 1 ห้อง และหลายห้อง)
    let selectedRooms = data.roomCodes;
    if (!selectedRooms || !Array.isArray(selectedRooms)) {
      selectedRooms = data.roomCode ? [data.roomCode] : [];
    }

    if (selectedRooms.length === 0) {
      return { success: false, message: 'กรุณาเลือกห้องประชุมอย่างน้อย 1 ห้อง' };
    }

    // 5.1 ตรวจสอบหรือสร้างข้อมูลสมาชิก
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

    // 5.2 ตรวจสอบการจองซ้ำสำหรับทุกห้องที่เลือก
    const existingBookings = bookingSheet.getDataRange().getValues();
    const existingBookingRooms = bookingRoomSheet.getDataRange().getValues();

    // สร้าง Map หาว่า bookingCode ไหนจองห้องอะไรบ้าง
    const bookingRoomMap = {};
    for (let j = 1; j < existingBookingRooms.length; j++) {
      let bCode = existingBookingRooms[j][0];
      let rCode = existingBookingRooms[j][1];
      if (!bookingRoomMap[bCode]) bookingRoomMap[bCode] = [];
      bookingRoomMap[bCode].push(rCode);
    }

    for (let i = 1; i < existingBookings.length; i++) {
      let b = existingBookings[i];
      let bCode = b[0];
      let bDate = Utilities.formatDate(new Date(b[2]), 'GMT+7', 'yyyy-MM-dd');
      let bStart = String(b[3]);
      let bEnd = String(b[4]);
      let bStatus = b[5];

      if (bDate === data.bookingDate && bStatus !== 'Cancelled') {
        const roomsInThisBooking = bookingRoomMap[bCode] || [];
        for (let r = 0; r < selectedRooms.length; r++) {
          let reqRoom = selectedRooms[r];
          if (roomsInThisBooking.indexOf(reqRoom) !== -1) {
            if (data.startTime < bEnd && data.endTime > bStart) {
              return {
                success: false,
                message: 'ขออภัย ห้อง ' + reqRoom + ' มีผู้จองในช่วงเวลา ' + bStart + ' - ' + bEnd + ' แล้ว'
              };
            }
          }
        }
      }
    }

    // 5.3 สร้างรหัสการจองและบันทึกลง BOOKING พร้อมข้อมูลชำระเงิน
    const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMddHHmmss');
    const bookingCode = 'BK' + timestamp.substring(2, 10) + Math.floor(10 + Math.random() * 90);
    const payDate = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');
    
    bookingSheet.appendRow([
      bookingCode,
      memberCode,
      data.bookingDate,
      data.startTime,
      data.endTime,
      'Confirmed',
      Number(data.totalPrice),
      data.paymentMethod || 'PromptPay',
      'Paid',
      payDate
    ]);

    // 5.4 บันทึกลง BOOKING_ROOM (รองรับหลายห้องใน 1 บิล)
    selectedRooms.forEach(function(roomCode) {
      bookingRoomSheet.appendRow([
        bookingCode,
        roomCode
      ]);
    });

    // 5.5 บันทึกลง BOOKING_EQUIPMENT
    if (data.equipments && data.equipments.length > 0) {
      data.equipments.forEach(function(eq) {
        bookingEqSheet.appendRow([
          bookingCode,
          eq.equipmentCode,
          Number(eq.qtyUsed || 1)
        ]);
      });
    }

    return {
      success: true,
      bookingCode: bookingCode,
      message: 'จองห้องสำเร็จเรียบร้อยแล้ว (จำนวน ' + selectedRooms.length + ' ห้อง)!'
    };

  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.toString() };
  }
}

/**
 * 6. ฟังก์ชันดึงประวัติการจองของสมาชิกตามเบอร์โทรหรือรหัส
 */
function getMemberBookings(searchQuery) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBER);
    const bookingSheet = ss.getSheetByName(SHEET_NAMES.BOOKING);
    const bookingRoomSheet = ss.getSheetByName(SHEET_NAMES.BOOKING_ROOM);
    const roomSheet = ss.getSheetByName(SHEET_NAMES.ROOM);
    
    if (!bookingSheet) return [];

    const members = memberSheet.getDataRange().getValues();
    let targetMemberCode = null;
    let memberName = '';
    
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

    // ทำ Map รหัสห้อง -> ชื่อห้อง
    const rooms = roomSheet.getDataRange().getValues();
    const roomMap = {};
    for (let i = 1; i < rooms.length; i++) {
      roomMap[rooms[i][0]] = rooms[i][1];
    }

    // ทำ Map หาห้องทั้งหมดของแต่ละ bookingCode
    const bookingRooms = bookingRoomSheet.getDataRange().getValues();
    const bRoomNamesMap = {};
    for (let j = 1; j < bookingRooms.length; j++) {
      let bCode = bookingRooms[j][0];
      let rCode = bookingRooms[j][1];
      let rName = roomMap[rCode] || rCode;
      if (!bRoomNamesMap[bCode]) bRoomNamesMap[bCode] = [];
      bRoomNamesMap[bCode].push(rName);
    }

    const bookings = bookingSheet.getDataRange().getValues();
    const result = [];
    for (let i = 1; i < bookings.length; i++) {
      let b = bookings[i];
      if (b[1] == targetMemberCode) {
        let bDate = Utilities.formatDate(new Date(b[2]), 'GMT+7', 'yyyy-MM-dd');
        let assignedRooms = bRoomNamesMap[b[0]] || ['ห้องประชุม'];
        result.push({
          bookingCode: b[0],
          memberName: memberName,
          roomNames: assignedRooms.join(', '),
          bookingDate: bDate,
          startTime: b[3],
          endTime: b[4],
          status: b[5],
          totalPrice: b[6],
          paymentMethod: b[7],
          paymentStatus: b[8],
          paymentDate: b[9]
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
    const bookingRoomSheet = ss.getSheetByName(SHEET_NAMES.BOOKING_ROOM);
    const memberSheet = ss.getSheetByName(SHEET_NAMES.MEMBER);
    const roomSheet = ss.getSheetByName(SHEET_NAMES.ROOM);
    
    if (!bookingSheet || !bookingRoomSheet) return getMockAdminBookings();

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

    const bookingRooms = bookingRoomSheet.getDataRange().getValues();
    const bRoomNamesMap = {};
    for (let j = 1; j < bookingRooms.length; j++) {
      let bCode = bookingRooms[j][0];
      let rCode = bookingRooms[j][1];
      let rName = roomMap[rCode] || rCode;
      if (!bRoomNamesMap[bCode]) bRoomNamesMap[bCode] = [];
      bRoomNamesMap[bCode].push(rName);
    }

    const bookings = bookingSheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < bookings.length; i++) {
      let b = bookings[i];
      let bDate = Utilities.formatDate(new Date(b[2]), 'GMT+7', 'yyyy-MM-dd');
      let assignedRooms = bRoomNamesMap[b[0]] || ['ห้องประชุม'];
      list.push({
        bookingCode: b[0],
        memberInfo: memberMap[b[1]] || b[1],
        roomNames: assignedRooms.join(', '),
        bookingDate: bDate,
        startTime: b[3],
        endTime: b[4],
        status: b[5],
        totalPrice: b[6],
        paymentMethod: b[7],
        paymentStatus: b[8],
        paymentDate: b[9]
      });
    }
    return list.reverse();
  } catch (err) {
    return getMockAdminBookings();
  }
}

/**
 * 8. ฟังก์ชัน Admin: อัปเดตสถานะการชำระเงิน (อัปเดตลงคอลัมน์ PAYMENT_STATUS ใน BOOKING โดยตรง)
 */
function updatePaymentStatus(bookingCode, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const bookingSheet = ss.getSheetByName(SHEET_NAMES.BOOKING);
    const data = bookingSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === bookingCode) {
        // คอลัมน์ที่ 9 คือ PAYMENT_STATUS (1-based index)
        bookingSheet.getRange(i + 1, 9).setValue(newStatus);
        return { success: true, message: 'อัปเดตสถานะการชำระเงินของ ' + bookingCode + ' เป็น ' + newStatus + ' เรียบร้อย' };
      }
    }
    return { success: false, message: 'ไม่พบรายการจองนี้ในระบบ' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ==========================================
// Mock Data สำรองกรณีรัน Local Preview
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
    { bookingCode: 'BK20260901', memberInfo: 'ณพัชรกัณฑ์ พัชญ์ชัยพงศา (0812345678)', roomNames: 'Brainstorm Studio', bookingDate: '2026-09-21', startTime: '09:00', endTime: '12:00', status: 'Confirmed', totalPrice: 1000, paymentStatus: 'Paid', paymentMethod: 'PromptPay' },
    { bookingCode: 'BK20260902', memberInfo: 'สมชาย ใจดี (0899998888)', roomNames: 'Focus Pod A, Focus Pod B', bookingDate: '2026-09-21', startTime: '10:00', endTime: '12:00', status: 'Confirmed', totalPrice: 480, paymentStatus: 'Paid', paymentMethod: 'Credit Card' },
    { bookingCode: 'BK20260903', memberInfo: 'กานต์ ธีรภาพ (0823334444)', roomNames: 'Executive Boardroom', bookingDate: '2026-09-21', startTime: '13:00', endTime: '16:00', status: 'Confirmed', totalPrice: 1970, paymentStatus: 'Pending', paymentMethod: 'PromptPay' }
  ];
}
