import { Booking, FacilityType, Announcement, Violation, Vehicle, Report, User, UserRole, CommunityPost } from './types';

// Set to true to use mock data instead of Supabase.
// In production, set VITE_USE_MOCK_DATA=false in .env
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const FACILITIES = [
  { id: FacilityType.PARKING, name: 'Visitor Parking', icon: 'Car', quota: 'Unlimited' },
  { id: FacilityType.GYM, name: 'Gymnasium', icon: 'Dumbbell', quota: 'Unlimited' },
  { id: FacilityType.SWIMMING_POOL, name: 'Swimming Pool', icon: 'Waves', quota: 'Unlimited' },
  { id: FacilityType.BBQ, name: 'BBQ Pit', icon: 'Flame', quota: 'Unlimited' },
  { id: FacilityType.PARTY_ROOM, name: 'Party Room', icon: 'PartyPopper', quota: 'Unlimited' },
  { id: FacilityType.TENNIS, name: 'Tennis Court', icon: 'Activity', quota: 'Unlimited' },
  { id: FacilityType.SQUASH_COURT, name: 'Squash Court', icon: 'Trophy', quota: 'Unlimited' },
  { id: FacilityType.BASKETBALL_COURT, name: 'Basketball Court', icon: 'Activity', quota: 'Unlimited' },
  { id: FacilityType.MULTI_PURPOSE_COURT, name: '3-in-1 Sport Court', icon: 'LayoutGrid', quota: 'Unlimited' },
];

// ============================================================
// MOCK USERS (20 residents: 12 Resident + 8 Tenant)
// Block A/B/C, Floor 6+, Unit 01-06
// ============================================================
export const MOCK_USERS: User[] = [
  // Block A - Residents
  { id: 'u1', name: 'Ahmad Razali', email: 'ahmad.razali@email.com', phone: '012-3456789', unit: 'A-06-01', role: UserRole.RESIDENT, moveInDate: '2022-03-15' },
  { id: 'u2', name: 'Siti Nurhaliza', email: 'siti.nur@email.com', phone: '013-2345678', unit: 'A-08-03', role: UserRole.RESIDENT, moveInDate: '2022-06-01' },
  { id: 'u3', name: 'Tan Wei Ming', email: 'weiming.tan@email.com', phone: '016-7890123', unit: 'A-10-05', role: UserRole.RESIDENT, moveInDate: '2021-11-20' },
  { id: 'u4', name: 'Priya Devi', email: 'priya.devi@email.com', phone: '017-8901234', unit: 'A-12-02', role: UserRole.RESIDENT, moveInDate: '2023-01-10' },
  // Block A - Tenants
  { id: 'u5', name: 'Lee Jia Xin', email: 'jiaxin.lee@email.com', phone: '018-9012345', unit: 'A-07-04', role: UserRole.TENANT, moveInDate: '2024-02-01' },
  { id: 'u6', name: 'Muhammad Faiz', email: 'faiz.m@email.com', phone: '019-0123456', unit: 'A-11-06', role: UserRole.TENANT, moveInDate: '2024-06-15' },
  { id: 'u7', name: 'Kavitha Rajan', email: 'kavitha.r@email.com', phone: '012-1112233', unit: 'A-09-01', role: UserRole.TENANT, moveInDate: '2025-01-01' },

  // Block B - Residents
  { id: 'u8', name: 'Wong Kar Wai', email: 'karwai.wong@email.com', phone: '013-3344556', unit: 'B-06-02', role: UserRole.RESIDENT, moveInDate: '2022-01-05' },
  { id: 'u9', name: 'Nurul Aisyah', email: 'nurul.aisyah@email.com', phone: '016-4455667', unit: 'B-08-05', role: UserRole.RESIDENT, moveInDate: '2022-09-12' },
  { id: 'u10', name: 'Rajesh Kumar', email: 'rajesh.k@email.com', phone: '017-5566778', unit: 'B-10-01', role: UserRole.RESIDENT, moveInDate: '2023-04-20' },
  { id: 'u11', name: 'Lim Chee Keong', email: 'ck.lim@email.com', phone: '018-6677889', unit: 'B-12-04', role: UserRole.RESIDENT, moveInDate: '2021-08-30' },
  // Block B - Tenants
  { id: 'u12', name: 'Amirah Hanim', email: 'amirah.h@email.com', phone: '019-7788990', unit: 'B-07-03', role: UserRole.TENANT, moveInDate: '2024-03-01' },
  { id: 'u13', name: 'Chen Yu Han', email: 'yuhan.chen@email.com', phone: '012-8899001', unit: 'B-09-06', role: UserRole.TENANT, moveInDate: '2024-08-10' },
  { id: 'u14', name: 'Darren Loh', email: 'darren.loh@email.com', phone: '013-9900112', unit: 'B-11-02', role: UserRole.TENANT, moveInDate: '2025-02-15' },

  // Block C - Residents
  { id: 'u15', name: 'Hafiz Abdullah', email: 'hafiz.a@email.com', phone: '016-1122334', unit: 'C-06-03', role: UserRole.RESIDENT, moveInDate: '2022-05-18' },
  { id: 'u16', name: 'Ng Siew Ling', email: 'siewling.ng@email.com', phone: '017-2233445', unit: 'C-08-01', role: UserRole.RESIDENT, moveInDate: '2023-02-28' },
  { id: 'u17', name: 'Ganesh Muthu', email: 'ganesh.m@email.com', phone: '018-3344556', unit: 'C-10-06', role: UserRole.RESIDENT, moveInDate: '2021-12-01' },
  { id: 'u18', name: 'Zulaikha Ismail', email: 'zulaikha.i@email.com', phone: '019-4455667', unit: 'C-12-04', role: UserRole.RESIDENT, moveInDate: '2022-10-10' },
  // Block C - Tenants
  { id: 'u19', name: 'Ong Jia Yi', email: 'jiayi.ong@email.com', phone: '012-5566778', unit: 'C-07-02', role: UserRole.TENANT, moveInDate: '2024-05-01' },
  { id: 'u20', name: 'Syafiq Azman', email: 'syafiq.a@email.com', phone: '013-6677889', unit: 'C-09-05', role: UserRole.TENANT, moveInDate: '2024-11-20' },
];

// ============================================================
// MOCK ANNOUNCEMENTS (10)
// ============================================================
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'a1', title: 'Gym Maintenance', content: 'The Gymnasium will be closed for equipment servicing on 15th Mar from 10 AM to 4 PM.', date: '2026-03-05', priority: 'high' },
  { id: 'a2', title: 'New Parking Regulations', content: 'Please ensure visitor vehicles are registered 1 hour prior to arrival. New system effective from April 1st.', date: '2026-03-01', priority: 'medium' },
  { id: 'a3', title: 'Community BBQ Event', content: 'Join us for the annual community gathering at the poolside BBQ area next Saturday, March 15th from 5 PM.', date: '2026-02-28', priority: 'low' },
  { id: 'a4', title: 'Water Supply Disruption', content: 'Water supply will be temporarily disrupted on March 20th from 9 AM to 3 PM for pipe maintenance in Block B.', date: '2026-03-06', priority: 'high' },
  { id: 'a5', title: 'Swimming Pool Cleaning', content: 'The swimming pool will undergo monthly cleaning on March 12th. Pool access will resume by 6 PM.', date: '2026-03-03', priority: 'medium' },
  { id: 'a6', title: 'AGM Notice', content: 'Annual General Meeting is scheduled for April 5th at the Party Room, 8 PM. All residents are encouraged to attend.', date: '2026-02-25', priority: 'high' },
  { id: 'a7', title: 'Lift Upgrade Schedule', content: 'Lift A in Block C will be upgraded from March 25th to April 2nd. Please use Lift B during this period.', date: '2026-03-04', priority: 'medium' },
  { id: 'a8', title: 'Pest Control Treatment', content: 'Quarterly pest control will be conducted across all blocks on March 18th. Please close all windows.', date: '2026-03-02', priority: 'medium' },
  { id: 'a9', title: 'New Guard Shift Hours', content: 'Security shift hours have been updated. Main gate will now have 24/7 coverage with 3 shifts.', date: '2026-02-20', priority: 'low' },
  { id: 'a10', title: 'Recycling Program Launch', content: 'New recycling bins have been placed at Level 5 of each block. Please separate recyclables accordingly.', date: '2026-02-15', priority: 'low' },
];

// ============================================================
// MOCK BOOKINGS (28)
// ============================================================
export const MOCK_BOOKINGS: Booking[] = [
  // Parking bookings
  { id: 'b1', facilityType: FacilityType.PARKING, date: '2026-03-08', startTime: '14:00', durationHours: 4, status: 'active', residentUnit: 'A-06-01', details: 'WCD 5521' },
  { id: 'b2', facilityType: FacilityType.PARKING, date: '2026-03-08', startTime: '10:00', durationHours: 3, status: 'active', residentUnit: 'B-08-05', details: 'JQR 7788' },
  { id: 'b3', facilityType: FacilityType.PARKING, date: '2026-03-07', startTime: '18:00', durationHours: 12, status: 'completed', residentUnit: 'C-06-03', details: 'VBK 3344', isOvernight: true },
  { id: 'b4', facilityType: FacilityType.PARKING, date: '2026-03-06', startTime: '09:00', durationHours: 2, status: 'completed', residentUnit: 'A-12-02', details: 'WNB 1234' },
  { id: 'b5', facilityType: FacilityType.PARKING, date: '2026-03-09', startTime: '15:00', durationHours: 5, status: 'active', residentUnit: 'B-12-04', details: 'PKR 9012' },

  // Gym bookings
  { id: 'b6', facilityType: FacilityType.GYM, date: '2026-03-08', startTime: '07:00', durationHours: 1, status: 'active', residentUnit: 'A-10-05' },
  { id: 'b7', facilityType: FacilityType.GYM, date: '2026-03-07', startTime: '17:00', durationHours: 1, status: 'completed', residentUnit: 'B-06-02' },
  { id: 'b8', facilityType: FacilityType.GYM, date: '2026-03-06', startTime: '09:00', durationHours: 1, status: 'completed', residentUnit: 'C-10-06' },

  // Swimming Pool
  { id: 'b9', facilityType: FacilityType.SWIMMING_POOL, date: '2026-03-08', startTime: '08:00', durationHours: 2, status: 'active', residentUnit: 'A-07-04' },
  { id: 'b10', facilityType: FacilityType.SWIMMING_POOL, date: '2026-03-05', startTime: '16:00', durationHours: 1, status: 'completed', residentUnit: 'B-07-03' },
  { id: 'b11', facilityType: FacilityType.SWIMMING_POOL, date: '2026-03-09', startTime: '10:00', durationHours: 2, status: 'active', residentUnit: 'C-07-02' },

  // BBQ
  { id: 'b12', facilityType: FacilityType.BBQ, date: '2026-03-08', startTime: '18:00', durationHours: 3, status: 'active', residentUnit: 'A-08-03' },
  { id: 'b13', facilityType: FacilityType.BBQ, date: '2026-03-01', startTime: '17:00', durationHours: 4, status: 'completed', residentUnit: 'C-12-04' },
  { id: 'b14', facilityType: FacilityType.BBQ, date: '2026-03-04', startTime: '18:00', durationHours: 3, status: 'cancelled', residentUnit: 'B-10-01' },

  // Party Room
  { id: 'b15', facilityType: FacilityType.PARTY_ROOM, date: '2026-03-10', startTime: '14:00', durationHours: 4, status: 'active', residentUnit: 'A-09-01' },
  { id: 'b16', facilityType: FacilityType.PARTY_ROOM, date: '2026-02-28', startTime: '19:00', durationHours: 5, status: 'completed', residentUnit: 'B-09-06' },

  // Tennis Court
  { id: 'b17', facilityType: FacilityType.TENNIS, date: '2026-03-08', startTime: '07:00', durationHours: 1, status: 'active', residentUnit: 'C-08-01' },
  { id: 'b18', facilityType: FacilityType.TENNIS, date: '2026-03-06', startTime: '17:00', durationHours: 2, status: 'completed', residentUnit: 'A-11-06' },
  { id: 'b19', facilityType: FacilityType.TENNIS, date: '2026-03-05', startTime: '08:00', durationHours: 1, status: 'cancelled', residentUnit: 'B-11-02' },

  // Squash Court
  { id: 'b20', facilityType: FacilityType.SQUASH_COURT, date: '2026-03-09', startTime: '09:00', durationHours: 1, status: 'active', residentUnit: 'C-09-05' },
  { id: 'b21', facilityType: FacilityType.SQUASH_COURT, date: '2026-03-03', startTime: '18:00', durationHours: 1, status: 'completed', residentUnit: 'A-06-01' },

  // Basketball Court
  { id: 'b22', facilityType: FacilityType.BASKETBALL_COURT, date: '2026-03-08', startTime: '17:00', durationHours: 2, status: 'active', residentUnit: 'B-06-02' },
  { id: 'b23', facilityType: FacilityType.BASKETBALL_COURT, date: '2026-03-02', startTime: '16:00', durationHours: 2, status: 'completed', residentUnit: 'C-06-03' },
  { id: 'b24', facilityType: FacilityType.BASKETBALL_COURT, date: '2026-03-07', startTime: '09:00', durationHours: 1, status: 'cancelled', residentUnit: 'A-07-04' },

  // Multi-Purpose Court
  { id: 'b25', facilityType: FacilityType.MULTI_PURPOSE_COURT, date: '2026-03-09', startTime: '08:00', durationHours: 2, status: 'active', residentUnit: 'B-08-05' },
  { id: 'b26', facilityType: FacilityType.MULTI_PURPOSE_COURT, date: '2026-03-04', startTime: '19:00', durationHours: 2, status: 'completed', residentUnit: 'A-12-02' },
  { id: 'b27', facilityType: FacilityType.MULTI_PURPOSE_COURT, date: '2026-03-01', startTime: '10:00', durationHours: 2, status: 'completed', residentUnit: 'C-10-06' },
  { id: 'b28', facilityType: FacilityType.MULTI_PURPOSE_COURT, date: '2026-03-06', startTime: '15:00', durationHours: 1, status: 'cancelled', residentUnit: 'B-12-04' },
];

// ============================================================
// MOCK VIOLATIONS (10)
// ============================================================
export const MOCK_VIOLATIONS: Violation[] = [
  { id: 'v1', unit: 'B-07-03', type: 'Late Cancellation', date: '2026-03-05', status: 'pending', amount: 10 },
  { id: 'v2', unit: 'A-06-01', type: 'Overstay Parking', date: '2026-02-20', status: 'paid', amount: 50 },
  { id: 'v3', unit: 'C-10-06', type: 'Noise Complaint', date: '2026-03-01', status: 'pending', amount: 100 },
  { id: 'v4', unit: 'A-11-06', type: 'Unauthorized Parking', date: '2026-02-15', status: 'paid', amount: 50 },
  { id: 'v5', unit: 'B-09-06', type: 'Late Cancellation', date: '2026-03-03', status: 'pending', amount: 10 },
  { id: 'v6', unit: 'C-07-02', type: 'Facility Damage', date: '2026-02-10', status: 'paid', amount: 200 },
  { id: 'v7', unit: 'A-08-03', type: 'Overstay Parking', date: '2026-03-06', status: 'pending', amount: 50 },
  { id: 'v8', unit: 'B-12-04', type: 'No Show Booking', date: '2026-02-25', status: 'paid', amount: 20 },
  { id: 'v9', unit: 'C-12-04', type: 'Noise Complaint', date: '2026-03-07', status: 'pending', amount: 100 },
  { id: 'v10', unit: 'A-10-05', type: 'Unauthorized Parking', date: '2026-01-30', status: 'paid', amount: 50 },
];

// ============================================================
// MOCK VEHICLES (26 - approx 1-2 per household)
// ============================================================
export const MOCK_VEHICLES: Vehicle[] = [
  // Block A
  { id: 'c1', plateNumber: 'WNB 1234', model: 'Honda City', isPrimary: true },
  { id: 'c2', plateNumber: 'VAB 8888', model: 'Toyota Veloz', isPrimary: false },
  { id: 'c3', plateNumber: 'BPC 5678', model: 'Perodua Myvi', isPrimary: true },
  { id: 'c4', plateNumber: 'WCD 5521', model: 'Proton X50', isPrimary: true },
  { id: 'c5', plateNumber: 'JMR 9900', model: 'Honda HR-V', isPrimary: true },
  { id: 'c6', plateNumber: 'WA 3456 T', model: 'Perodua Ativa', isPrimary: true },
  { id: 'c7', plateNumber: 'VDN 7712', model: 'Toyota Vios', isPrimary: true },
  { id: 'c8', plateNumber: 'BKJ 2201', model: 'Mazda CX-5', isPrimary: false },
  { id: 'c9', plateNumber: 'WHN 4433', model: 'Proton Saga', isPrimary: true },

  // Block B
  { id: 'c10', plateNumber: 'WKD 6677', model: 'Perodua Axia', isPrimary: true },
  { id: 'c11', plateNumber: 'JQR 7788', model: 'Honda Civic', isPrimary: true },
  { id: 'c12', plateNumber: 'BNT 1122', model: 'Toyota Camry', isPrimary: true },
  { id: 'c13', plateNumber: 'WA 9988 S', model: 'Proton X70', isPrimary: false },
  { id: 'c14', plateNumber: 'PKR 9012', model: 'Perodua Bezza', isPrimary: true },
  { id: 'c15', plateNumber: 'VCH 3344', model: 'Nissan Almera', isPrimary: true },
  { id: 'c16', plateNumber: 'WRF 5566', model: 'Mazda 3', isPrimary: true },
  { id: 'c17', plateNumber: 'BJK 8800', model: 'Honda City', isPrimary: false },
  { id: 'c18', plateNumber: 'WMN 2211', model: 'Toyota Yaris', isPrimary: true },

  // Block C
  { id: 'c19', plateNumber: 'VBK 3344', model: 'Proton Persona', isPrimary: true },
  { id: 'c20', plateNumber: 'WA 7766 R', model: 'Perodua Aruz', isPrimary: true },
  { id: 'c21', plateNumber: 'JHS 4455', model: 'Honda BR-V', isPrimary: true },
  { id: 'c22', plateNumber: 'BGL 9988', model: 'Toyota Rush', isPrimary: false },
  { id: 'c23', plateNumber: 'WPN 6600', model: 'Perodua Myvi', isPrimary: true },
  { id: 'c24', plateNumber: 'VDR 1177', model: 'Proton Iriz', isPrimary: true },
  { id: 'c25', plateNumber: 'WKS 8822', model: 'Mazda CX-3', isPrimary: true },
  { id: 'c26', plateNumber: 'BNR 3399', model: 'Honda Jazz', isPrimary: false },
];

// ============================================================
// MOCK REPORTS (12)
// ============================================================
export const MOCK_REPORTS: Report[] = [
  { id: 'r1', date: '2026-03-06', category: 'Gymnasium', description: 'Treadmill #2 belt is slipping and making loud noises.', status: 'In Progress', residentUnit: 'A-10-05' },
  { id: 'r2', date: '2026-02-28', category: 'Lifts', description: 'Lift B button panel in Block A is dirty and unresponsive on floor 8.', status: 'Resolved', residentUnit: 'A-08-03' },
  { id: 'r3', date: '2026-03-07', category: 'Parking', description: 'Parking bay P-23 has oil stain that has not been cleaned for a week.', status: 'Received', residentUnit: 'B-06-02' },
  { id: 'r4', date: '2026-03-04', category: 'Swimming Pool', description: 'Pool shower head in male changing room is broken.', status: 'In Progress', residentUnit: 'C-06-03' },
  { id: 'r5', date: '2026-03-01', category: 'Corridor', description: 'Corridor light on Level 9, Block B is flickering.', status: 'Resolved', residentUnit: 'B-09-06' },
  { id: 'r6', date: '2026-03-05', category: 'Plumbing', description: 'Water leaking from ceiling in unit corridor, Level 7 Block A.', status: 'In Progress', residentUnit: 'A-07-04' },
  { id: 'r7', date: '2026-03-08', category: 'Security', description: 'CCTV at Block C ground floor lobby seems to be offline.', status: 'Received', residentUnit: 'C-08-01' },
  { id: 'r8', date: '2026-02-25', category: 'Playground', description: 'Swing set has a loose bolt, potential safety hazard for children.', status: 'Resolved', residentUnit: 'B-10-01' },
  { id: 'r9', date: '2026-03-03', category: 'BBQ Area', description: 'BBQ pit #2 grill grate is rusted and needs replacement.', status: 'In Progress', residentUnit: 'C-12-04' },
  { id: 'r10', date: '2026-03-07', category: 'Lifts', description: 'Lift A in Block C makes grinding sound between floor 10-12.', status: 'Received', residentUnit: 'C-10-06' },
  { id: 'r11', date: '2026-02-20', category: 'Landscaping', description: 'Tree near Block B entrance has overgrown branches blocking walkway.', status: 'Resolved', residentUnit: 'B-12-04' },
  { id: 'r12', date: '2026-03-06', category: 'Tennis Court', description: 'Tennis court net is sagging in the middle, needs tightening.', status: 'Received', residentUnit: 'A-12-02' },
];

// ============================================================
// MOCK COMMUNITY POSTS (10)
// ============================================================
export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  { id: 'p1', authorUnit: 'A-06-01', authorName: 'Ahmad Razali', title: 'Weekend Badminton Group', content: 'Looking for residents interested in a Saturday morning badminton group at the sport court. All skill levels welcome!', date: '2026-03-07', category: 'event', likes: 12, comments: 5 },
  { id: 'p2', authorUnit: 'B-08-05', authorName: 'Nurul Aisyah', title: 'Selling IKEA Bookshelf', content: 'Moving out sale - BILLY bookshelf in white, good condition. RM80 negotiable. Self-collect from Block B.', date: '2026-03-06', category: 'marketplace', likes: 3, comments: 2 },
  { id: 'p3', authorUnit: 'C-08-01', authorName: 'Ng Siew Ling', title: 'Lost Cat - Orange Tabby', content: 'Our orange tabby cat "Mochi" escaped from our unit yesterday evening. Please contact us if spotted around the compound.', date: '2026-03-08', category: 'lost-found', likes: 18, comments: 7 },
  { id: 'p4', authorUnit: 'A-10-05', authorName: 'Tan Wei Ming', title: 'Recommendation for Plumber', content: 'Can anyone recommend a reliable plumber? Need to fix kitchen sink issue. Thanks in advance!', date: '2026-03-05', category: 'general', likes: 5, comments: 8 },
  { id: 'p5', authorUnit: 'B-07-03', authorName: 'Amirah Hanim', title: 'Yoga Session at Pool Deck', content: 'Free yoga session every Sunday 7 AM at the pool deck. Bring your own mat. All are welcome to join!', date: '2026-03-04', category: 'event', likes: 22, comments: 6 },
  { id: 'p6', authorUnit: 'C-10-06', authorName: 'Ganesh Muthu', title: 'Free Study Table', content: 'Giving away a study table in decent condition. First come first serve. WhatsApp me to arrange pickup.', date: '2026-03-03', category: 'marketplace', likes: 7, comments: 4 },
  { id: 'p7', authorUnit: 'A-09-01', authorName: 'Kavitha Rajan', title: 'Found Keys Near Playground', content: 'Found a set of car keys (Perodua) near the playground area this morning. Please claim at guard house.', date: '2026-03-07', category: 'lost-found', likes: 9, comments: 3 },
  { id: 'p8', authorUnit: 'B-12-04', authorName: 'Lim Chee Keong', title: 'Internet Service Provider Survey', content: 'Thinking of switching ISP. Which provider has the best coverage in our area? Currently using Unifi.', date: '2026-03-02', category: 'general', likes: 14, comments: 11 },
  { id: 'p9', authorUnit: 'C-07-02', authorName: 'Ong Jia Yi', title: 'Hari Raya Open House', content: 'All neighbours are invited to our Hari Raya open house on April 1st from 10 AM. Food and drinks provided!', date: '2026-03-01', category: 'event', likes: 30, comments: 9 },
  { id: 'p10', authorUnit: 'A-11-06', authorName: 'Muhammad Faiz', title: 'Noise After 10 PM', content: 'Friendly reminder to keep noise levels down after 10 PM especially on weekdays. Some of us have early shifts. Thank you for understanding.', date: '2026-02-28', category: 'general', likes: 25, comments: 13 },
];
