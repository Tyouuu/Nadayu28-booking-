export enum UserRole {
  RESIDENT = 'RESIDENT',
  TENANT = 'TENANT',
  SECURITY = 'SECURITY',
  MANAGEMENT = 'MANAGEMENT',
}

export enum FacilityType {
  PARKING = 'PARKING',
  GYM = 'GYM',
  BBQ = 'BBQ',
  PARTY_ROOM = 'PARTY_ROOM',
  TENNIS = 'TENNIS',
  SWIMMING_POOL = 'SWIMMING_POOL',
  SQUASH_COURT = 'SQUASH_COURT',
  BASKETBALL_COURT = 'BASKETBALL_COURT',
  MULTI_PURPOSE_COURT = 'MULTI_PURPOSE_COURT',
}

export interface Booking {
  id: string;
  facilityType: FacilityType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationHours: number;
  status: 'active' | 'completed' | 'cancelled';
  residentUnit: string;
  details?: string; // e.g., License Plate
  qrCode?: string;
  isOvernight?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Violation {
  id: string;
  unit: string;
  type: string;
  date: string;
  status: 'pending' | 'paid';
  amount: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  isPrimary: boolean;
}

export interface Report {
  id: string;
  date: string;
  category: string;
  description: string;
  status: 'Received' | 'In Progress' | 'Resolved';
  residentUnit: string;
  assignedToName?: string;
  resolutionNotes?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  role: UserRole;
  moveInDate: string;
}

export interface CommunityPost {
  id: string;
  authorUnit: string;
  authorName: string;
  title: string;
  content: string;
  date: string;
  category: 'general' | 'event' | 'marketplace' | 'lost-found';
  likes: number;
  comments: number;
}