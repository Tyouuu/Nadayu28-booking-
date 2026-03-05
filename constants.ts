import { Booking, FacilityType, Announcement, Violation, Vehicle, Report } from './types';

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

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Gym Maintenance',
    content: 'The Gymnasium will be closed for equipment servicing on 15th Oct from 10 AM to 4 PM.',
    date: '2023-10-10',
    priority: 'high',
  },
  {
    id: '2',
    title: 'New Parking Regulations',
    content: 'Please ensure visitor vehicles are registered 1 hour prior to arrival.',
    date: '2023-10-01',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Community BBQ Event',
    content: 'Join us for the annual community gathering at the poolside BBQ area next Saturday.',
    date: '2023-09-28',
    priority: 'low',
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: '101',
    facilityType: FacilityType.PARKING,
    date: '2023-10-25',
    startTime: '14:00',
    durationHours: 4,
    status: 'active',
    residentUnit: 'A-12-05',
    details: 'WNB 1234',
  },
  {
    id: '102',
    facilityType: FacilityType.GYM,
    date: '2023-10-24',
    startTime: '09:00',
    durationHours: 1,
    status: 'completed',
    residentUnit: 'A-12-05',
  },
  {
    id: '103',
    facilityType: FacilityType.BBQ,
    date: '2023-10-20',
    startTime: '18:00',
    durationHours: 3,
    status: 'completed',
    residentUnit: 'A-12-05',
  },
];

export const MOCK_VIOLATIONS: Violation[] = [
  { id: 'v1', unit: 'B-05-01', type: 'Late Cancellation', date: '2023-10-15', status: 'pending', amount: 10 },
  { id: 'v2', unit: 'A-12-05', type: 'Overstay Parking', date: '2023-09-20', status: 'paid', amount: 50 },
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'c1', plateNumber: 'WNB 1234', model: 'Honda City', isPrimary: true },
  { id: 'c2', plateNumber: 'VAB 8888', model: 'Toyota Veloz', isPrimary: false },
];

export const MOCK_REPORTS: Report[] = [
  { id: 'r1', date: '2023-10-12', category: 'Gymnasium', description: 'Treadmill #2 belt is slipping.', status: 'In Progress' },
  { id: 'r2', date: '2023-09-28', category: 'Lifts', description: 'Lift B button panel dirty.', status: 'Resolved' },
];