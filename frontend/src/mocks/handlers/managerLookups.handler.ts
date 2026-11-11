import { http, HttpResponse } from 'msw';

// Sprint 3 mock: the lists behind the room and staff pickers on the manager housekeeping and maintenance pages.
// Same endpoints and names as the real API (Manager API Contract v1.2): GET /manager/rooms and GET /manager/staff.
// They answer only the pickers' calls; every other call to these endpoints goes on to the next handler or the server.
const API = '/api/v1';

export interface MockStaff {
  staff_id: string;
  full_name: string;
  staff_type: 'HOUSEKEEPER' | 'TECHNICIAN';
}

export const mockHousekeepers: MockStaff[] = [
  { staff_id: '6719b4a1f2e8c90012ab3601', full_name: 'موظف نظافة أ', staff_type: 'HOUSEKEEPER' },
  { staff_id: '6719b4a1f2e8c90012ab3602', full_name: 'موظف نظافة ب', staff_type: 'HOUSEKEEPER' },
  { staff_id: '6719b4a1f2e8c90012ab3603', full_name: 'موظف نظافة ج', staff_type: 'HOUSEKEEPER' },
];

export const mockTechnicians: MockStaff[] = [
  { staff_id: '6719b4a1f2e8c90012ab3701', full_name: 'فني صيانة أ', staff_type: 'TECHNICIAN' },
  { staff_id: '6719b4a1f2e8c90012ab3702', full_name: 'فني صيانة ب', staff_type: 'TECHNICIAN' },
  { staff_id: '6719b4a1f2e8c90012ab3703', full_name: 'فني صيانة ج', staff_type: 'TECHNICIAN' },
];

export interface MockRoom {
  room_id: string;
  room_number: string;
  floor: number;
  current_guest_name: string | null;
}

// 36 rooms on 3 floors (101-112, 201-212, 301-312); some of them have a guest
const OCCUPIED = new Set(['101', '104', '105', '107', '110', '112', '203', '205', '207', '208', '210', '301', '302', '305', '306', '309', '312']);

export const mockRooms: MockRoom[] = [1, 2, 3].flatMap((floor) => Array.from({ length: 12 }, (_, index) => {
  const roomNumber = `${floor}${String(index + 1).padStart(2, '0')}`;
  return {
    room_id: `6719b4a1f2e8c90012ab${roomNumber.padStart(4, '0')}`,
    room_number: roomNumber,
    floor,
    current_guest_name: OCCUPIED.has(roomNumber) ? `ضيف الغرفة ${roomNumber}` : null,
  };
}));

export const findMockRoom = (roomId: unknown) => mockRooms.find((room) => room.room_id === roomId);

const page = <T,>(data: T[]) => ({ data, meta: { page: 1, limit: data.length, total: data.length, total_pages: 1 } });

export const managerLookupsHandlers = [
  // The pickers ask for one staff type; the employees page asks without it and is not answered here
  http.get(`${API}/manager/staff`, ({ request }) => {
    const staffType = new URL(request.url).searchParams.get('staff_type');
    const list = staffType === 'HOUSEKEEPER' ? mockHousekeepers : staffType === 'TECHNICIAN' ? mockTechnicians : null;
    if (!list) return undefined;
    return HttpResponse.json(page(list.map((staff) => ({ id: staff.staff_id, ...staff, is_active: true }))));
  }),

  // The pickers ask for every room at once (limit=200, no page); the rooms page sends page= and is not answered here
  http.get(`${API}/manager/rooms`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    if (params.has('page') || params.get('limit') !== '200') return undefined;
    return HttpResponse.json(page(mockRooms.map((room) => ({
      id: room.room_id,
      ...room,
      current_guest: room.current_guest_name,
      occupancy_status: room.current_guest_name ? 'OCCUPIED' : 'VACANT',
    }))));
  }),
];
