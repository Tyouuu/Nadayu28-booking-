import { supabase } from './supabase';
import type { Booking, Announcement, Violation, Vehicle, Report, User, CommunityPost } from '../types';
import { FacilityType, UserRole } from '../types';

// ── Row → App type mappers ──────────────────────────────────

function toBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    facilityType: row.facility_type as FacilityType,
    date: row.date as string,
    startTime: row.start_time as string,
    durationHours: row.duration_hours as number,
    status: row.status as Booking['status'],
    residentUnit: row.resident_unit as string,
    details: row.details as string | undefined,
    qrCode: row.qr_code as string | undefined,
    isOvernight: row.is_overnight as boolean | undefined,
  };
}

function toAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    date: row.date as string,
    priority: row.priority as Announcement['priority'],
  };
}

function toViolation(row: Record<string, unknown>): Violation {
  return {
    id: row.id as string,
    unit: row.unit as string,
    type: row.type as string,
    date: row.date as string,
    status: row.status as Violation['status'],
    amount: Number(row.amount),
  };
}

function toVehicle(row: Record<string, unknown>): Vehicle {
  const make = (row.make as string) || '';
  const model = (row.model as string) || '';
  return {
    id: row.id as string,
    plateNumber: (row.plate as string) || '',
    model: [make, model].filter(Boolean).join(' ') || model,
    isPrimary: (row.is_default as boolean) ?? false,
  };
}

function toReport(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    date: row.date as string,
    category: row.category as string,
    description: row.description as string,
    status: row.status as Report['status'],
    residentUnit: row.resident_unit as string,
  };
}

function toUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.full_name as string,
    email: (row.email as string) || '',
    phone: (row.phone as string) || '',
    unit: row.unit as string,
    role: row.role as UserRole,
    moveInDate: row.created_at as string,
  };
}

function toCommunityPost(row: Record<string, unknown>): CommunityPost {
  return {
    id: row.id as string,
    authorUnit: row.author_unit as string,
    authorName: row.author_name as string,
    title: row.title as string,
    content: row.content as string,
    date: row.date as string,
    category: row.category as CommunityPost['category'],
    likes: row.likes as number,
    comments: row.comments as number,
  };
}

// ── Data fetching functions ─────────────────────────────────

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toAnnouncement);
}

export async function fetchBookings(unit?: string): Promise<Booking[]> {
  let query = supabase.from('bookings').select('*').order('date', { ascending: false });
  if (unit) query = query.eq('resident_unit', unit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toBooking);
}

export async function fetchViolations(unit?: string): Promise<Violation[]> {
  let query = supabase.from('violations').select('*').order('date', { ascending: false });
  if (unit) query = query.eq('unit', unit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toViolation);
}

export async function fetchVehicles(userId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toVehicle);
}

export async function fetchReports(unit?: string): Promise<Report[]> {
  let query = supabase.from('reports').select('*').order('date', { ascending: false });
  if (unit) query = query.eq('resident_unit', unit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toReport);
}

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('unit', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toUser);
}

export async function fetchCommunityPosts(category?: string): Promise<CommunityPost[]> {
  let query = supabase.from('community_posts').select('*').order('date', { ascending: false });
  if (category && category !== 'all') query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toCommunityPost);
}

// ── Write operations ────────────────────────────────────────

export async function createReport(report: { category: string; description: string; residentUnit: string; userId?: string }) {
  const id = 'r' + Date.now();
  const { error } = await supabase.from('reports').insert({
    id,
    date: new Date().toISOString().split('T')[0],
    category: report.category,
    description: report.description,
    status: 'Received',
    resident_unit: report.residentUnit,
    user_id: report.userId,
  });
  if (error) throw error;
  return id;
}

export async function createCommunityPost(post: { authorUnit: string; authorName: string; title: string; content: string; category: string; userId?: string }) {
  const id = 'p' + Date.now();
  const { error } = await supabase.from('community_posts').insert({
    id,
    author_unit: post.authorUnit,
    author_name: post.authorName,
    title: post.title,
    content: post.content,
    date: new Date().toISOString().split('T')[0],
    category: post.category,
    user_id: post.userId,
  });
  if (error) throw error;
  return id;
}

export async function updateViolationStatus(id: string, status: 'pending' | 'paid') {
  const { error } = await supabase.from('violations').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function likeCommunityPost(id: string) {
  const { data: current } = await supabase.from('community_posts').select('likes').eq('id', id).single();
  if (!current) return;
  const { error } = await supabase.from('community_posts').update({ likes: current.likes + 1 }).eq('id', id);
  if (error) throw error;
}
