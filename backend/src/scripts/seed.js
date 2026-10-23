require('dotenv').config();
const argon2 = require('argon2');
const connectDB = require('../db/connect');
const env = require('../config/env');
const {
  Room,
  Staff,
  Shift,
  ShiftException,
  Attendance,
  CleaningTask,
  MaintenanceIssue,
  RoomStatusHistory,
  Guest,
  Reservation,
  RoomNight,
  Payment,
  IdempotencyKey,
  Session,
} = require('../db/models');
const { toPiastres } = require('../utils/money');

async function seed() {
  if (env.nodeEnv === 'production') {
    console.error('Safety check triggered: Refusing to seed in production environment!');
    process.exit(1);
  }

  console.log('Connecting to database for seeding...');
  await connectDB();
  console.log('Connected.');

  console.log('Clearing old development collections...');
  await Promise.all([
    Room.deleteMany({}),
    Staff.deleteMany({}),
    Shift.deleteMany({}),
    ShiftException.deleteMany({}),
    Attendance.deleteMany({}),
    CleaningTask.deleteMany({}),
    MaintenanceIssue.deleteMany({}),
    RoomStatusHistory.deleteMany({}),
    Guest.deleteMany({}),
    Reservation.deleteMany({}),
    RoomNight.deleteMany({}),
    Payment.collection.deleteMany({}),
    IdempotencyKey.deleteMany({}),
    Session.deleteMany({}),
  ]);

    console.log('1. Seeding 36 Rooms with Piastre pricing & Arabic descriptions...');
  const VIEWS = ['garden', 'city', 'nile'];
  const NORMAL_DESC = [
    'غرفة مزدوجة هادئة مع شرفة واسعة',
    'غرفة مفردة مناسبة لرجال الأعمال',
    'غرفة عائلية صغيرة مطلة على الحديقة',
    'غرفة ديلوكس بسريرين منفصلين وإطلالة مميزة',
    'غرفة أنيقة قريبة من المصعد الهادئ',
    'غرفة مزدوجة عصرية مع ركن عمل مريح',
  ];
  const VIP_DESC = [
    'جناح ملكي مطل على الحديقة ومجهز بأحدث وسائل الراحة',
    'جناح تنفيذي مع جاكوزي خاص وتراس فسيح',
    'جناح رئاسي فاخر بإطلالة بانورامية وسرير كينج',
    'بنتهاوس فاخر في الطابق الأخير مع إطلالة ساحرة',
  ];
  const STATUS_OVERRIDES = {
    102: 'occupied', 103: 'occupied', 107: 'occupied', 108: 'occupied',
    202: 'occupied', 203: 'occupied', 206: 'occupied', 210: 'occupied',
    303: 'occupied', 305: 'occupied', 309: 'occupied',
    104: 'cleaning', 204: 'cleaning', 306: 'cleaning',
    109: 'maintenance', 205: 'maintenance', 307: 'maintenance',
  };
  const roomsData = [];
  for (let floor = 1; floor <= 3; floor += 1) {
    for (let n = 1; n <= 12; n += 1) {
      const roomNumber = String(floor * 100 + n);
      const isVip = n >= 8;
      const price = isVip ? 2500 + (floor - 1) * 500 + (n - 8) * 100 : 1000 + (floor - 1) * 100 + (n % 4) * 100;
      roomsData.push({
        room_number: roomNumber,
        room_type: isVip ? 'VIP' : 'Normal',
        floor,
        view: VIEWS[(floor + n) % 3],
        price_per_night: toPiastres(price),
        half_day_price: toPiastres(price / 2),
        status: STATUS_OVERRIDES[roomNumber] || 'available',
        description: isVip ? VIP_DESC[n % VIP_DESC.length] : NORMAL_DESC[n % NORMAL_DESC.length],
      });
    }
  }

  await Room.insertMany(roomsData);
  console.log('Seeded 36 rooms successfully.');

  console.log('2. Seeding Staff accounts with Argon2id passwords...');
  const devPassword = 'Password123';
  const devPasswordHash = await argon2.hash(devPassword);

  const staffData = [
    {
      username: 'ahmed_morning',
      name: 'أحمد محمود',
      password_hash: devPasswordHash,
      default_shift_type: 'morning',
      role: 'receptionist',
      active: true,
    },
    {
      username: 'sarah_evening',
      name: 'سارة إبراهيم',
      password_hash: devPasswordHash,
      default_shift_type: 'evening',
      role: 'receptionist',
      active: true,
    },
    {
      username: 'omar_night',
      name: 'عمر مصطفى',
      password_hash: devPasswordHash,
      default_shift_type: 'night',
      role: 'receptionist',
      active: true,
    },
    {
      username: 'ali_manager',
      name: 'علي عبد الله',
      password_hash: devPasswordHash,
      default_shift_type: 'morning',
      role: 'manager',
      active: true,
    },
  ];

  await Staff.insertMany(staffData);
  console.log(`Seeded ${staffData.length} staff accounts (default password: "${devPassword}").`);

  console.log('Database seeding completed successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
