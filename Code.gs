/**
 * ====================================================================
 * โครงการ: ระบบจองห้องประชุมและ Co-working Space (NEXUS SPACE)
 * รายวิชา: CSC362 Database Systems (sec 02)
 * นักศึกษา: นายณพัชรกัณฑ์ พัชญ์ชัยพงศา
 *
 * ไฟล์: Code.gs (Google Apps Script Backend)
 * ใช้ Google Sheets เป็นที่เก็บข้อมูล โดยมี 6 ชีตตรงกับ 6 ตารางใน database_schema.sql
 *   MEMBER, ROOM, EQUIPMENT, BOOKING (+ข้อมูลชำระเงิน), BOOKING_ROOM, BOOKING_EQUIPMENT
 *
 * ฟังก์ชันที่หน้าเว็บ (index.html) เรียกผ่าน google.script.run:
 *   getRooms, getEquipments, getAllBookingsAdmin, getTableCounts,
 *   getMemberBookings, submitBooking, updatePaymentStatus, updateBookingStatus
 * ====================================================================
 */

const SHEET_NAMES = {
  MEMBER: 'MEMBER',
  ROOM: 'ROOM',
  EQUIPMENT: 'EQUIPMENT',
  BOOKING: 'BOOKING',
  BOOKING_ROOM: 'BOOKING_ROOM',
  BOOKING_EQUIPMENT: 'BOOKING_EQUIPMENT'
};

// ค่าที่อนุญาต (ตรงกับ CHECK constraints ใน database_schema.sql)
const OPEN_HOUR = 9;
const CLOSE_HOUR = 18;
const MEMBER_TYPES = ['General', 'VIP', 'Student'];
const PAYMENT_METHODS = ['PromptPay', 'Credit Card', 'Bank Transfer', 'Cash'];
const INSTANT_PAY = ['PromptPay', 'Credit Card'];
const BOOKING_STATUSES = ['Confirmed', 'Pending', 'Cancelled', 'Completed'];
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Refunded'];

// ลำดับคอลัมน์ของชีต BOOKING (1-based)
const BK_COL = { CODE: 1, MEMBER: 2, DATE: 3, START: 4, END: 5, STATUS: 6, TOTAL: 7, METHOD: 8, PAY_STATUS: 9, PAY_DATE: 10 };

/**
 * 1. Web App Endpoint
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('NEXUS SPACE · ระบบจองห้องประชุม | CSC362')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * 2. สร้างชีตทั้ง 6 ตารางพร้อม Seed Data (ชุดเดียวกับ database_schema.sql)
 *    ทุกคอลัมน์ตั้งเป็น Plain text เพื่อไม่ให้ Sheets แปลงเบอร์โทร/วันที่/เวลาเอง
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ตาราง PAYMENT ถูกยุบรวมเข้า BOOKING แล้ว
  const oldPayment = ss.getSheetByName('PAYMENT');
  if (oldPayment) ss.deleteSheet(oldPayment);

  const schemas = {};
  schemas[SHEET_NAMES.MEMBER] = [
    ['MEMBER_CODE', 'FNAME', 'LNAME', 'PHONE', 'EMAIL', 'MEMBER_TYPE', 'REGISTER_DATE'],
    ['M001', 'ณพัชรกัณฑ์', 'พัชญ์ชัยพงศา', '0812345678', 'naphat.p@example.com', 'VIP', '2026-01-10'],
    ['M002', 'สมชาย', 'ใจดี', '0899998888', 'somchai.j@gmail.com', 'General', '2026-02-15'],
    ['M003', 'อาริยา', 'วงศ์สว่าง', '0845551234', 'ariya.w@outlook.com', 'Student', '2026-03-01'],
    ['M004', 'กานต์', 'ธีรภาพ', '0823334444', 'karn.t@techcorp.io', 'VIP', '2026-03-12']
  ];
  schemas[SHEET_NAMES.ROOM] = [
    ['ROOM_CODE', 'ROOM_NAME', 'ROOM_TYPE', 'CAPACITY', 'PRICE_PER_HOUR', 'STATUS', 'FLOOR'],
    ['R101', 'Focus Pod A', 'Creative Pod', '2', '120.00', 'Available', '1'],
    ['R102', 'Focus Pod B', 'Creative Pod', '2', '120.00', 'Occupied', '1'],
    ['R201', 'Brainstorm Studio', 'Meeting Room', '6', '250.00', 'Available', '2'],
    ['R301', 'Executive Boardroom', 'Boardroom', '14', '500.00', 'Occupied', '3'],
    ['R401', 'Grand Innovation Hall', 'Event Hall', '40', '1200.00', 'Available', '4']
  ];
  schemas[SHEET_NAMES.EQUIPMENT] = [
    ['EQUIPMENT_CODE', 'EQUIPMENT_NAME', 'QTY', 'STATUS', 'PRICE'],
    ['EQ01', '4K Laser Projector + จอโปรเจคเตอร์', '5', 'Available', '150.00'],
    ['EQ02', 'Smart Interactive Whiteboard', '3', 'Available', '100.00'],
    ['EQ03', 'ชุดไมโครโฟนไร้สายและระบบเสียงประชุม', '4', 'Available', '120.00'],
    ['EQ04', 'กล้อง 360 องศาสำหรับ Hybrid Meeting', '3', 'Available', '80.00']
  ];
  schemas[SHEET_NAMES.BOOKING] = [
    ['BOOKING_CODE', 'MEMBER_CODE', 'BOOKING_DATE', 'START_TIME', 'END_TIME', 'STATUS', 'TOTAL_PRICE', 'PAYMENT_METHOD', 'PAYMENT_STATUS', 'PAYMENT_DATE'],
    ['BK20260901', 'M001', '2026-09-21', '09:00:00', '12:00:00', 'Confirmed', '1000.00', 'PromptPay', 'Paid', '2026-09-20 10:30:00'],
    ['BK20260902', 'M002', '2026-09-21', '10:00:00', '12:00:00', 'Confirmed', '480.00', 'Credit Card', 'Paid', '2026-09-20 11:15:00'],
    ['BK20260903', 'M004', '2026-09-21', '13:00:00', '16:00:00', 'Confirmed', '1970.00', 'PromptPay', 'Pending', '']
  ];
  schemas[SHEET_NAMES.BOOKING_ROOM] = [
    ['BOOKING_CODE', 'ROOM_CODE'],
    ['BK20260901', 'R201'],
    ['BK20260902', 'R101'],
    ['BK20260902', 'R102'],
    ['BK20260903', 'R301']
  ];
  schemas[SHEET_NAMES.BOOKING_EQUIPMENT] = [
    ['BOOKING_CODE', 'EQUIPMENT_CODE', 'QTY_USED'],
    ['BK20260901', 'EQ01', '1'],
    ['BK20260901', 'EQ02', '1'],
    ['BK20260903', 'EQ01', '1'],
    ['BK20260903', 'EQ03', '2'],
    ['BK20260903', 'EQ04', '1']
  ];

  Object.keys(schemas).forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.clear();
    const rows = schemas[name];
    const cols = rows[0].length;
    sheet.getRange(1, 1, sheet.getMaxRows(), cols).setNumberFormat('@');
    sheet.getRange(1, 1, rows.length, cols).setValues(rows);
    sheet.getRange(1, 1, 1, cols).setBackground('#1a1917').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, cols);
  });

  return { success: true, message: 'สร้างฐานข้อมูล 6 ตารางพร้อม Seed Data เรียบร้อยแล้ว' };
}

/* ====================================================================
   HELPERS
   ==================================================================== */
function tz_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || 'Asia/Bangkok';
}

function pad2_(n) {
  return ('0' + n).slice(-2);
}

// แปลงค่าจากชีตให้เป็นข้อความ (กันกรณี Sheets แปลงเป็น Date/Number อัตโนมัติ)
function str_(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

function isDate_(v) {
  return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
}

function fmtDate_(v) {
  if (isDate_(v)) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  return str_(v).slice(0, 10);
}

function fmtTime_(v) {
  if (isDate_(v)) return Utilities.formatDate(v, tz_(), 'HH:mm');
  const s = str_(v);
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  return m ? pad2_(m[1]) + ':' + m[2] : s;
}

function fmtDateTime_(v) {
  if (isDate_(v)) return Utilities.formatDate(v, tz_(), 'yyyy-MM-dd HH:mm:ss');
  return str_(v);
}

function fmtPhone_(v) {
  const digits = str_(v).replace(/\D/g, '');
  // ถ้าชีตตัดเลข 0 นำหน้าทิ้ง (เก็บเป็นตัวเลข) ให้เติมกลับ
  return digits.length === 9 ? '0' + digits : digits;
}

function toMin_(t) {
  const p = fmtTime_(t).split(':');
  return Number(p[0]) * 60 + Number(p[1] || 0);
}

function overlaps_(aS, aE, bS, bE) {
  return aS < bE && aE > bS;
}

function todayStr_() {
  return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd');
}

function nowStamp_() {
  return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm:ss');
}

function sheet_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error('ไม่พบชีต ' + name + ' กรุณารันฟังก์ชัน initDatabase ก่อน');
  return sh;
}

// อ่านชีตเป็น array of objects (ข้ามแถวว่าง)
function readTable_(name) {
  const values = sheet_(name).getDataRange().getValues();
  if (values.length < 2) return [];
  const head = values[0].map(str_);
  const out = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i].every(function (c) { return str_(c) === ''; })) continue;
    const row = { _row: i + 1 };
    head.forEach(function (h, j) { row[h] = values[i][j]; });
    out.push(row);
  }
  return out;
}

// เพิ่มแถวเป็น Plain text
function appendText_(name, arr) {
  const sh = sheet_(name);
  const r = sh.getLastRow() + 1;
  const range = sh.getRange(r, 1, 1, arr.length);
  range.setNumberFormat('@');
  range.setValues([arr.map(function (v) { return v === null || v === undefined ? '' : String(v); })]);
}

function loadAll_() {
  return {
    members: readTable_(SHEET_NAMES.MEMBER),
    rooms: readTable_(SHEET_NAMES.ROOM),
    equipments: readTable_(SHEET_NAMES.EQUIPMENT),
    bookings: readTable_(SHEET_NAMES.BOOKING),
    bookingRooms: readTable_(SHEET_NAMES.BOOKING_ROOM),
    bookingEquipments: readTable_(SHEET_NAMES.BOOKING_EQUIPMENT)
  };
}

// สร้าง object สำหรับหน้าเว็บจากแถว BOOKING + JOIN ตารางที่เกี่ยวข้อง (ไม่มี Date object เพื่อให้ส่งผ่าน google.script.run ได้)
function bookingView_(b, db) {
  const code = str_(b.BOOKING_CODE);
  const memberCode = str_(b.MEMBER_CODE);
  const m = db.members.filter(function (x) { return str_(x.MEMBER_CODE) === memberCode; })[0];
  const roomCodes = db.bookingRooms
    .filter(function (x) { return str_(x.BOOKING_CODE) === code; })
    .map(function (x) { return str_(x.ROOM_CODE); });
  const roomNames = roomCodes.map(function (c) {
    const r = db.rooms.filter(function (x) { return str_(x.ROOM_CODE) === c; })[0];
    return r ? str_(r.ROOM_NAME) : c;
  });
  const equipments = db.bookingEquipments
    .filter(function (x) { return str_(x.BOOKING_CODE) === code; })
    .map(function (x) {
      const ec = str_(x.EQUIPMENT_CODE);
      const e = db.equipments.filter(function (q) { return str_(q.EQUIPMENT_CODE) === ec; })[0];
      return { equipmentCode: ec, equipmentName: e ? str_(e.EQUIPMENT_NAME) : ec, qtyUsed: Number(x.QTY_USED) || 0 };
    });
  const memberName = m ? str_(m.FNAME) + ' ' + str_(m.LNAME) : memberCode;
  const phone = m ? fmtPhone_(m.PHONE) : '';
  return {
    bookingCode: code,
    memberCode: memberCode,
    memberName: memberName,
    phone: phone,
    email: m ? str_(m.EMAIL) : '',
    memberInfo: m ? memberName + ' (' + phone + ')' : memberName,
    roomCodes: roomCodes,
    roomNames: roomNames.join(', '),
    equipments: equipments,
    bookingDate: fmtDate_(b.BOOKING_DATE),
    startTime: fmtTime_(b.START_TIME),
    endTime: fmtTime_(b.END_TIME),
    status: str_(b.STATUS),
    totalPrice: Number(b.TOTAL_PRICE) || 0,
    paymentMethod: str_(b.PAYMENT_METHOD),
    paymentStatus: str_(b.PAYMENT_STATUS),
    paymentDate: fmtDateTime_(b.PAYMENT_DATE)
  };
}

/* ====================================================================
   READ APIs
   ==================================================================== */
function getRooms() {
  return readTable_(SHEET_NAMES.ROOM).map(function (r) {
    return {
      roomCode: str_(r.ROOM_CODE),
      roomName: str_(r.ROOM_NAME),
      roomType: str_(r.ROOM_TYPE),
      capacity: Number(r.CAPACITY) || 0,
      pricePerHour: Number(r.PRICE_PER_HOUR) || 0,
      status: str_(r.STATUS) || 'Available',
      floor: Number(r.FLOOR) || 0
    };
  });
}

function getEquipments() {
  return readTable_(SHEET_NAMES.EQUIPMENT).map(function (e) {
    return {
      equipmentCode: str_(e.EQUIPMENT_CODE),
      equipmentName: str_(e.EQUIPMENT_NAME),
      qty: Number(e.QTY) || 0,
      status: str_(e.STATUS) || 'Available',
      price: Number(e.PRICE) || 0
    };
  });
}

function getAllBookingsAdmin() {
  const db = loadAll_();
  return db.bookings.map(function (b) { return bookingView_(b, db); }).reverse();
}

function getTableCounts() {
  const out = {};
  Object.keys(SHEET_NAMES).forEach(function (k) { out[k] = readTable_(SHEET_NAMES[k]).length; });
  return out;
}

/**
 * ค้นหาประวัติด้วย เบอร์โทร / อีเมล / รหัสสมาชิก / เลขที่ใบจอง
 */
function getMemberBookings(query) {
  const key = str_(query);
  if (!key) return { success: false, message: 'กรุณากรอกข้อมูลสำหรับค้นหา', bookings: [] };
  const low = key.toLowerCase();
  const digits = key.replace(/\D/g, '');
  const db = loadAll_();

  const m = db.members.filter(function (x) {
    return str_(x.MEMBER_CODE).toLowerCase() === low ||
      str_(x.EMAIL).toLowerCase() === low ||
      (digits.length >= 9 && fmtPhone_(x.PHONE) === digits);
  })[0];

  if (m) {
    const mc = str_(m.MEMBER_CODE);
    return {
      success: true,
      memberCode: mc,
      memberName: str_(m.FNAME) + ' ' + str_(m.LNAME),
      memberType: str_(m.MEMBER_TYPE),
      bookings: db.bookings
        .filter(function (b) { return str_(b.MEMBER_CODE) === mc; })
        .map(function (b) { return bookingView_(b, db); })
        .reverse()
    };
  }

  const b = db.bookings.filter(function (x) { return str_(x.BOOKING_CODE).toLowerCase() === low; })[0];
  if (b) {
    const v = bookingView_(b, db);
    const mm = db.members.filter(function (x) { return str_(x.MEMBER_CODE) === v.memberCode; })[0];
    return { success: true, memberCode: v.memberCode, memberName: v.memberName, memberType: mm ? str_(mm.MEMBER_TYPE) : '', bookings: [v] };
  }

  return { success: false, message: 'ไม่พบข้อมูลสมาชิกหรือเลขที่ใบจองนี้', bookings: [] };
}

/* ====================================================================
   WRITE APIs
   ==================================================================== */

/**
 * บันทึกการจอง: BOOKING (+ชำระเงิน) → BOOKING_ROOM (หลายห้อง) → BOOKING_EQUIPMENT
 * ตรวจสอบ: เวลา, ห้องซ้อนทับ, สต็อกอุปกรณ์, PHONE/EMAIL UNIQUE และคำนวณราคาฝั่งเซิร์ฟเวอร์
 */
function submitBooking(d) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (e) {
    return { success: false, message: 'ระบบกำลังประมวลผลคำขออื่น กรุณาลองใหม่อีกครั้ง' };
  }

  try {
    d = d || {};
    const fail = function (msg) { return { success: false, message: msg }; };
    const db = loadAll_();

    // --- 1) ตรวจสอบข้อมูลนำเข้า ---
    const roomCodes = [];
    (Array.isArray(d.roomCodes) ? d.roomCodes : []).forEach(function (c) {
      c = str_(c);
      if (c && roomCodes.indexOf(c) === -1) roomCodes.push(c);
    });
    if (!roomCodes.length) return fail('กรุณาเลือกห้องประชุมอย่างน้อย 1 ห้อง');

    const rooms = roomCodes.map(function (c) {
      return db.rooms.filter(function (r) { return str_(r.ROOM_CODE) === c; })[0];
    });
    if (rooms.some(function (r) { return !r; })) return fail('ไม่พบรหัสห้องที่เลือกในตาราง ROOM');
    const mt = rooms.filter(function (r) { return str_(r.STATUS) === 'Maintenance'; })[0];
    if (mt) return fail('ห้อง ' + str_(mt.ROOM_NAME) + ' ปิดปรับปรุง (Maintenance) ไม่สามารถจองได้');

    const bookingDate = str_(d.bookingDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) return fail('กรุณาระบุวันที่จอง');
    if (bookingDate < todayStr_()) return fail('ไม่สามารถจองย้อนหลังได้');
    const s = toMin_(d.startTime);
    const e = toMin_(d.endTime);
    if (!(e > s)) return fail('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น (CHECK END_TIME > START_TIME)');
    if (s < OPEN_HOUR * 60 || e > CLOSE_HOUR * 60) return fail('เวลาให้บริการ ' + pad2_(OPEN_HOUR) + ':00 – ' + pad2_(CLOSE_HOUR) + ':00 น.');

    const fname = str_(d.fname);
    const lname = str_(d.lname);
    const phone = str_(d.phone).replace(/\D/g, '');
    const email = str_(d.email);
    if (!fname || !lname) return fail('กรุณากรอกชื่อและนามสกุล');
    if (fname.length > 50 || lname.length > 50) return fail('ชื่อและนามสกุลยาวได้ไม่เกิน 50 ตัวอักษร');
    if (!/^0\d{9}$/.test(phone)) return fail('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 100) return fail('รูปแบบอีเมลไม่ถูกต้อง');
    const memberType = MEMBER_TYPES.indexOf(d.memberType) !== -1 ? d.memberType : 'General';
    const method = PAYMENT_METHODS.indexOf(d.paymentMethod) !== -1 ? d.paymentMethod : 'PromptPay';

    // --- 2) MEMBER (PHONE / EMAIL เป็น UNIQUE) ---
    let member = db.members.filter(function (x) { return fmtPhone_(x.PHONE) === phone; })[0];
    if (member && str_(member.EMAIL).toLowerCase() !== email.toLowerCase()) {
      return fail('เบอร์ ' + phone + ' เป็นของสมาชิก ' + str_(member.MEMBER_CODE) + ' ซึ่งใช้อีเมลอื่น กรุณากรอกอีเมลที่ลงทะเบียนไว้');
    }
    if (!member && db.members.some(function (x) { return str_(x.EMAIL).toLowerCase() === email.toLowerCase(); })) {
      return fail('อีเมลนี้ถูกใช้โดยสมาชิกท่านอื่นแล้ว (EMAIL เป็น UNIQUE)');
    }

    // --- 3) ตรวจการจองซ้อนทับทุกห้องที่เลือก ---
    const sameSlot = db.bookings.filter(function (b) {
      return fmtDate_(b.BOOKING_DATE) === bookingDate && str_(b.STATUS) !== 'Cancelled' &&
        overlaps_(s, e, toMin_(b.START_TIME), toMin_(b.END_TIME));
    });
    for (let i = 0; i < sameSlot.length; i++) {
      const bc = str_(sameSlot[i].BOOKING_CODE);
      const clash = db.bookingRooms.filter(function (x) {
        return str_(x.BOOKING_CODE) === bc && roomCodes.indexOf(str_(x.ROOM_CODE)) !== -1;
      })[0];
      if (clash) {
        const rc = str_(clash.ROOM_CODE);
        const r = db.rooms.filter(function (x) { return str_(x.ROOM_CODE) === rc; })[0];
        return fail('ห้อง ' + str_(r.ROOM_NAME) + ' (' + rc + ') ถูกจองแล้วโดย ' + bc + ' ช่วง ' +
          fmtTime_(sameSlot[i].START_TIME) + '–' + fmtTime_(sameSlot[i].END_TIME) + ' น.');
      }
    }

    // --- 4) ตรวจอุปกรณ์และสต็อกในช่วงเวลาเดียวกัน ---
    const eqReq = {};
    (Array.isArray(d.equipments) ? d.equipments : []).forEach(function (x) {
      const q = Math.floor(Number(x && x.qtyUsed));
      const c = str_(x && x.equipmentCode);
      if (c && q > 0) eqReq[c] = (eqReq[c] || 0) + q;
    });
    const slotCodes = sameSlot.map(function (b) { return str_(b.BOOKING_CODE); });
    let eqCost = 0;
    const eqCodes = Object.keys(eqReq);
    for (let i = 0; i < eqCodes.length; i++) {
      const code = eqCodes[i];
      const eq = db.equipments.filter(function (x) { return str_(x.EQUIPMENT_CODE) === code; })[0];
      if (!eq) return fail('ไม่พบอุปกรณ์รหัส ' + code);
      if (str_(eq.STATUS) !== 'Available') return fail(str_(eq.EQUIPMENT_NAME) + ' ไม่พร้อมให้บริการ (' + str_(eq.STATUS) + ')');
      const used = db.bookingEquipments
        .filter(function (x) { return str_(x.EQUIPMENT_CODE) === code && slotCodes.indexOf(str_(x.BOOKING_CODE)) !== -1; })
        .reduce(function (a, x) { return a + (Number(x.QTY_USED) || 0); }, 0);
      const stock = Number(eq.QTY) || 0;
      if (used + eqReq[code] > stock) {
        return fail(str_(eq.EQUIPMENT_NAME) + ' เหลือว่าง ' + Math.max(0, stock - used) + ' ชิ้นในช่วงเวลานี้');
      }
      eqCost += (Number(eq.PRICE) || 0) * eqReq[code];
    }

    // --- 5) คำนวณราคาฝั่งเซิร์ฟเวอร์ ---
    const hours = (e - s) / 60;
    const roomRate = rooms.reduce(function (a, r) { return a + (Number(r.PRICE_PER_HOUR) || 0); }, 0);
    const total = Math.round((hours * roomRate + eqCost) * 100) / 100;

    // --- 6) INSERT ---
    let isNewMember = false;
    if (!member) {
      const maxNo = db.members.reduce(function (acc, x) {
        const n = /^M(\d+)$/.exec(str_(x.MEMBER_CODE));
        return n ? Math.max(acc, Number(n[1])) : acc;
      }, 0);
      const newCode = 'M' + ('00' + (maxNo + 1)).slice(-3);
      appendText_(SHEET_NAMES.MEMBER, [newCode, fname, lname, phone, email, memberType, todayStr_()]);
      member = { MEMBER_CODE: newCode, FNAME: fname, LNAME: lname, PHONE: phone, EMAIL: email };
      db.members.push(member);
      isNewMember = true;
    }

    const prefix = 'BK' + todayStr_().replace(/-/g, '');
    const seq = db.bookings.reduce(function (acc, b) {
      const c = str_(b.BOOKING_CODE);
      return c.indexOf(prefix) === 0 ? Math.max(acc, Number(c.slice(prefix.length)) || 0) : acc;
    }, 0) + 1;
    const bookingCode = prefix + ('0' + seq).slice(-2);
    const paid = INSTANT_PAY.indexOf(method) !== -1;

    const bookingRow = [
      bookingCode, str_(member.MEMBER_CODE), bookingDate,
      fmtTime_(d.startTime) + ':00', fmtTime_(d.endTime) + ':00',
      'Confirmed', total.toFixed(2), method, paid ? 'Paid' : 'Pending', paid ? nowStamp_() : ''
    ];
    appendText_(SHEET_NAMES.BOOKING, bookingRow);
    roomCodes.forEach(function (c) { appendText_(SHEET_NAMES.BOOKING_ROOM, [bookingCode, c]); });
    eqCodes.forEach(function (c) { appendText_(SHEET_NAMES.BOOKING_EQUIPMENT, [bookingCode, c, eqReq[c]]); });
    SpreadsheetApp.flush();

    const fresh = loadAll_();
    const saved = fresh.bookings.filter(function (b) { return str_(b.BOOKING_CODE) === bookingCode; })[0];

    return {
      success: true,
      bookingCode: bookingCode,
      isNewMember: isNewMember,
      booking: saved ? bookingView_(saved, fresh) : null,
      message: 'จองสำเร็จ ' + roomCodes.length + ' ห้อง • ' + (isNewMember ? 'สมาชิกใหม่ ' : 'สมาชิกเดิม ') + str_(member.MEMBER_CODE)
    };
  } catch (err) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Admin: เปลี่ยน PAYMENT_STATUS (Paid / Pending / Refunded) และ PAYMENT_DATE ในตาราง BOOKING
 */
function updatePaymentStatus(bookingCode, newStatus) {
  try {
    if (PAYMENT_STATUSES.indexOf(newStatus) === -1) return { success: false, message: 'สถานะการชำระเงินไม่ถูกต้อง' };
    const db = loadAll_();
    const b = db.bookings.filter(function (x) { return str_(x.BOOKING_CODE) === str_(bookingCode); })[0];
    if (!b) return { success: false, message: 'ไม่พบรายการจองนี้' };

    const sh = sheet_(SHEET_NAMES.BOOKING);
    sh.getRange(b._row, BK_COL.PAY_STATUS).setValue(newStatus);
    if (newStatus === 'Paid' && !str_(b.PAYMENT_DATE)) {
      sh.getRange(b._row, BK_COL.PAY_DATE).setNumberFormat('@').setValue(nowStamp_());
    } else if (newStatus === 'Pending') {
      sh.getRange(b._row, BK_COL.PAY_DATE).setValue('');
    }
    SpreadsheetApp.flush();

    const fresh = loadAll_();
    const saved = fresh.bookings.filter(function (x) { return str_(x.BOOKING_CODE) === str_(bookingCode); })[0];
    return { success: true, message: bookingCode + ': PAYMENT_STATUS → ' + newStatus, booking: bookingView_(saved, fresh) };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Admin: เปลี่ยน STATUS ของใบจอง (Confirmed / Pending / Cancelled / Completed)
 * การเปิดใบจองที่ยกเลิกแล้วกลับมาใช้ จะตรวจการชนเวลาอีกครั้ง
 */
function updateBookingStatus(bookingCode, newStatus) {
  try {
    if (BOOKING_STATUSES.indexOf(newStatus) === -1) return { success: false, message: 'สถานะการจองไม่ถูกต้อง' };
    const db = loadAll_();
    const code = str_(bookingCode);
    const b = db.bookings.filter(function (x) { return str_(x.BOOKING_CODE) === code; })[0];
    if (!b) return { success: false, message: 'ไม่พบรายการจองนี้' };

    if (str_(b.STATUS) === 'Cancelled' && newStatus !== 'Cancelled') {
      const myRooms = db.bookingRooms.filter(function (x) { return str_(x.BOOKING_CODE) === code; }).map(function (x) { return str_(x.ROOM_CODE); });
      const clash = db.bookings.filter(function (o) {
        const oc = str_(o.BOOKING_CODE);
        return oc !== code && fmtDate_(o.BOOKING_DATE) === fmtDate_(b.BOOKING_DATE) && str_(o.STATUS) !== 'Cancelled' &&
          overlaps_(toMin_(b.START_TIME), toMin_(b.END_TIME), toMin_(o.START_TIME), toMin_(o.END_TIME)) &&
          db.bookingRooms.some(function (x) { return str_(x.BOOKING_CODE) === oc && myRooms.indexOf(str_(x.ROOM_CODE)) !== -1; });
      })[0];
      if (clash) return { success: false, message: 'ไม่สามารถเปิดใช้ได้ ห้องชนกับ ' + str_(clash.BOOKING_CODE) };
    }

    sheet_(SHEET_NAMES.BOOKING).getRange(b._row, BK_COL.STATUS).setValue(newStatus);
    SpreadsheetApp.flush();

    const fresh = loadAll_();
    const saved = fresh.bookings.filter(function (x) { return str_(x.BOOKING_CODE) === code; })[0];
    return { success: true, message: code + ': STATUS → ' + newStatus, booking: bookingView_(saved, fresh) };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
