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
    assignedToName: row.assigned_to_name as string | undefined,
    resolutionNotes: row.resolution_notes as string | undefined,
    createdAt: row.created_at as string | undefined,
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

export async function validateBookingById(id: string): Promise<{ valid: boolean; booking?: Booking }> {
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).eq('status', 'active').limit(1);
  if (error || !data || data.length === 0) return { valid: false };
  return { valid: true, booking: toBooking(data[0]) };
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
  const { data: current } = await supabase.from('violations').select('status').eq('id', id).single();

  const { error } = await supabase.from('violations').update({ status }).eq('id', id);
  if (error) throw error;

  if (current && current.status !== status) {
    await logAudit({
      action: 'violation_status_change',
      entityType: 'violation',
      entityId: id,
      field: 'status',
      before: current.status,
      after: status,
    });
  }
}

export async function likeCommunityPost(id: string) {
  const { data: current } = await supabase.from('community_posts').select('likes').eq('id', id).single();
  if (!current) return;
  const { error } = await supabase.from('community_posts').update({ likes: current.likes + 1 }).eq('id', id);
  if (error) throw error;
}

export async function createReport(report: { category: string; description: string; residentUnit: string; images?: string[] }) {
  const { data: { user } } = await supabase.auth.getUser();
  const id = 'r' + Date.now();
  const { error } = await supabase.from('reports').insert({
    id,
    date: new Date().toISOString().split('T')[0],
    category: report.category,
    description: report.description,
    status: 'Received',
    resident_unit: report.residentUnit,
    user_id: user?.id,
    images: report.images ?? [],
  });
  if (error) throw error;
  return id;
}

// ── Parking slots ────────────────────────────────────────────

export interface ParkingSlot {
  id: string;
  slotNumber: number;
  zone: 'Visitor Parking' | 'Overnight Parking';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

function toParkingSlot(row: Record<string, unknown>): ParkingSlot {
  return {
    id: row.id as string,
    slotNumber: row.slot_number as number,
    zone: row.zone as ParkingSlot['zone'],
    status: row.status as ParkingSlot['status'],
  };
}

export async function fetchParkingSlots(): Promise<ParkingSlot[]> {
  const { data, error } = await supabase.from('parking_slots').select('*').order('slot_number');
  if (error) throw error;
  return (data ?? []).map(toParkingSlot);
}

export async function createParkingBooking(params: {
  slotId: string;
  zone: string;
  date: string;
  startTime: string;
  durationHours: number;
  plateNumber: string;
  unit: string;
  isOvernight: boolean;
}): Promise<{ id: string; qrCode: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const bookingId = Math.random().toString(36).substr(2, 9).toUpperCase();
  const qrPayload = JSON.stringify({
    id: bookingId,
    plate: params.plateNumber.toUpperCase(),
    slot: params.slotId,
    date: params.date,
    time: params.startTime,
    duration: params.durationHours,
    unit: params.unit,
    zone: params.zone,
  });

  const { error: bookingError } = await supabase.from('bookings').insert({
    id: bookingId,
    facility_type: `PARKING:${params.zone}`,
    date: params.date,
    start_time: params.startTime,
    duration_hours: params.durationHours,
    status: 'active',
    resident_unit: params.unit,
    details: `${params.plateNumber.toUpperCase()} • ${params.slotId}`,
    qr_code: qrPayload,
    is_overnight: params.isOvernight,
    user_id: user?.id,
  });
  if (bookingError) throw bookingError;

  // Atomically claim the slot only if it's still available — prevents a race
  // between two residents booking the same spot at the same moment.
  const { data: updated, error: slotError } = await supabase
    .from('parking_slots')
    .update({ status: 'occupied', booked_by: user?.id, booking_id: bookingId })
    .eq('id', params.slotId)
    .eq('status', 'available')
    .select();

  if (slotError || !updated || updated.length === 0) {
    await supabase.from('bookings').delete().eq('id', bookingId);
    throw new Error('This parking spot was just taken by someone else. Please pick another.');
  }

  return { id: bookingId, qrCode: qrPayload };
}

// ── Facilities (Amenities booking) ──────────────────────────

export interface Facility {
  id: string;
  name: string;
  icon: string;
  category: string;
  capacity: number;
  sessionDuration: number;
  status: 'active' | 'maintenance' | 'closed';
  description: string;
}

function toFacility(row: Record<string, unknown>): Facility {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    category: row.category as string,
    capacity: row.capacity as number,
    sessionDuration: row.session_duration as number,
    status: row.status as Facility['status'],
    description: row.description as string,
  };
}

export async function fetchFacilities(): Promise<Facility[]> {
  const { data, error } = await supabase.from('facilities').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(toFacility);
}

export async function fetchFacilitySlots(facilityId: string, date: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('facility_slots')
    .select('start_time')
    .eq('facility_id', facilityId)
    .eq('date', date)
    .eq('status', 'booked');
  if (error) throw error;
  return (data ?? []).map((r) => r.start_time as string);
}

export async function createFacilityBooking(params: {
  facilityId: string;
  date: string;
  startTime: string;
  durationHours: number;
  unit: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to book a facility.');

  const bookingId = 'fb' + Date.now();
  const { error: bookingError } = await supabase.from('bookings').insert({
    id: bookingId,
    facility_type: params.facilityId,
    date: params.date,
    start_time: params.startTime,
    duration_hours: params.durationHours,
    status: 'active',
    resident_unit: params.unit,
    user_id: user.id,
  });
  if (bookingError) throw bookingError;

  const [h, m] = params.startTime.split(':').map(Number);
  const endMinutes = h * 60 + m + params.durationHours * 60;
  const endTime = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

  const { error: slotError } = await supabase.from('facility_slots').insert({
    facility_id: params.facilityId,
    booking_id: bookingId,
    date: params.date,
    start_time: params.startTime,
    end_time: endTime,
    status: 'booked',
    booked_by: user.id,
  });
  if (slotError) {
    // Facility bookings must not exist without a reserved slot — roll back.
    await supabase.from('bookings').delete().eq('id', bookingId);
    if (slotError.code === '23505') {
      throw new Error('This time slot was just taken by someone else. Please pick another slot.');
    }
    throw slotError;
  }
}

// ── Visitors ──────────────────────────────────────────────────

export interface Visitor {
  id: string;
  residentId: string | null;
  residentUnit: string;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  expectedArrival: string;
  expectedDeparture?: string;
  status: 'scheduled' | 'arrived' | 'departed' | 'flagged';
  actualArrival?: string;
  idPhotoPath?: string;
  qrCode?: string;
}

function toVisitor(row: Record<string, unknown>): Visitor {
  return {
    id: row.id as string,
    residentId: (row.resident_id as string) ?? null,
    residentUnit: row.resident_unit as string,
    visitorName: row.visitor_name as string,
    visitorPhone: row.visitor_phone as string | undefined,
    purpose: row.purpose as string | undefined,
    expectedArrival: row.expected_arrival as string,
    expectedDeparture: row.expected_departure as string | undefined,
    status: row.status as Visitor['status'],
    actualArrival: row.actual_arrival as string | undefined,
    idPhotoPath: row.id_photo_path as string | undefined,
    qrCode: row.qr_code as string | undefined,
  };
}

export async function createVisitor(params: {
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  expectedArrival: string;
  expectedDeparture?: string;
  unit: string;
}): Promise<{ id: string; qrCode: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const id = 'v' + Date.now();
  const qrPayload = JSON.stringify({ type: 'visitor', id });

  const { error } = await supabase.from('visitors').insert({
    id,
    resident_id: user?.id,
    resident_unit: params.unit,
    visitor_name: params.visitorName,
    visitor_phone: params.visitorPhone,
    purpose: params.purpose,
    expected_arrival: params.expectedArrival,
    expected_departure: params.expectedDeparture,
    qr_code: qrPayload,
  });
  if (error) throw error;

  return { id, qrCode: qrPayload };
}

export async function fetchVisitors(unit?: string): Promise<Visitor[]> {
  let query = supabase.from('visitors').select('*').order('expected_arrival', { ascending: false });
  if (unit) query = query.eq('resident_unit', unit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toVisitor);
}

export async function fetchVisitorById(id: string): Promise<Visitor | null> {
  const { data, error } = await supabase.from('visitors').select('*').eq('id', id).limit(1);
  if (error || !data || data.length === 0) return null;
  return toVisitor(data[0]);
}

export async function uploadVisitorIdPhoto(visitorId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${visitorId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('visitor-ids').upload(path, file);
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase.from('visitors').update({ id_photo_path: path }).eq('id', visitorId);
  if (updateError) throw updateError;

  return path;
}

export async function checkInVisitor(visitorId: string): Promise<{ flagged: boolean }> {
  const { data, error: fetchError } = await supabase
    .from('visitors')
    .select('expected_arrival')
    .eq('id', visitorId)
    .single();
  if (fetchError || !data) throw fetchError ?? new Error('Visitor not found');

  const now = new Date();
  const expected = new Date(data.expected_arrival as string);
  const diffMinutes = Math.abs(now.getTime() - expected.getTime()) / 60000;
  const flagged = diffMinutes > 30;

  const { error } = await supabase.from('visitors').update({
    status: flagged ? 'flagged' : 'arrived',
    actual_arrival: now.toISOString(),
  }).eq('id', visitorId);
  if (error) throw error;

  return { flagged };
}

export async function markVisitorDeparted(visitorId: string): Promise<void> {
  const { error } = await supabase.from('visitors').update({ status: 'departed' }).eq('id', visitorId);
  if (error) throw error;
}

// ── Maintenance ───────────────────────────────────────────────

export async function updateReport(id: string, fields: {
  status?: Report['status'];
  assignedToName?: string;
  resolutionNotes?: string;
}): Promise<void> {
  const { data: current } = await supabase
    .from('reports')
    .select('status, assigned_to_name, resolution_notes')
    .eq('id', id)
    .single();

  const update: Record<string, unknown> = {};
  if (fields.status !== undefined) update.status = fields.status;
  if (fields.assignedToName !== undefined) update.assigned_to_name = fields.assignedToName;
  if (fields.resolutionNotes !== undefined) update.resolution_notes = fields.resolutionNotes;

  const { error } = await supabase.from('reports').update(update).eq('id', id);
  if (error) throw error;

  if (!current) return;

  if (fields.status !== undefined && fields.status !== current.status) {
    await logAudit({
      action: 'report_update', entityType: 'report', entityId: id,
      field: 'status', before: current.status, after: fields.status,
    });
  }
  if (fields.assignedToName !== undefined && fields.assignedToName !== current.assigned_to_name) {
    await logAudit({
      action: 'report_update', entityType: 'report', entityId: id,
      field: 'assigned_to_name', before: current.assigned_to_name ?? null, after: fields.assignedToName,
    });
  }
  if (fields.resolutionNotes !== undefined && fields.resolutionNotes !== current.resolution_notes) {
    await logAudit({
      action: 'report_update', entityType: 'report', entityId: id,
      field: 'resolution_notes', before: current.resolution_notes ?? null, after: fields.resolutionNotes,
    });
  }
}

// ── Audit log ─────────────────────────────────────────────────

async function logAudit(entry: {
  action: string;
  entityType: string;
  entityId: string;
  field: string;
  before: string | null;
  after: string | null;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();

  const { error } = await supabase.from('audit_log').insert({
    id: 'al' + Date.now(),
    actor_id: user?.id,
    actor_name: profile?.full_name ?? 'Unknown',
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    field: entry.field,
    before_value: entry.before,
    after_value: entry.after,
  });
  if (error) throw error;
}

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  field: string;
  beforeValue: string | null;
  afterValue: string | null;
  createdAt: string;
}

function toAuditLogEntry(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: row.id as string,
    actorId: (row.actor_id as string) ?? null,
    actorName: row.actor_name as string,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    field: row.field as string,
    beforeValue: (row.before_value as string) ?? null,
    afterValue: (row.after_value as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function fetchAuditLog(action?: string): Promise<AuditLogEntry[]> {
  let query = supabase.from('audit_log').select('*').order('created_at', { ascending: false });
  if (action) query = query.eq('action', action);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toAuditLogEntry);
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const { data: current } = await supabase.from('profiles').select('role').eq('id', userId).single();

  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) throw error;

  if (current && current.role !== newRole) {
    await logAudit({
      action: 'role_change',
      entityType: 'profile',
      entityId: userId,
      field: 'role',
      before: current.role,
      after: newRole,
    });
  }
}

// ── Documents ─────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  category: string;
  filePath: string;
  fileName: string;
  uploadedBy: string | null;
  uploadedByName: string;
  createdAt: string;
}

function toDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as string,
    filePath: row.file_path as string,
    fileName: row.file_name as string,
    uploadedBy: (row.uploaded_by as string) ?? null,
    uploadedByName: row.uploaded_by_name as string,
    createdAt: row.created_at as string,
  };
}

export async function fetchDocuments(category?: string): Promise<Document[]> {
  let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toDocument);
}

export async function uploadDocument(params: { title: string; category: string; file: File }): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();

  const id = 'd' + Date.now();
  const path = `${id}/${params.file.name}`;

  const { error: uploadError } = await supabase.storage.from('documents').upload(path, params.file);
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('documents').insert({
    id,
    title: params.title,
    category: params.category,
    file_path: path,
    file_name: params.file.name,
    uploaded_by: user?.id,
    uploaded_by_name: profile?.full_name ?? 'Unknown',
  });
  if (insertError) {
    // Metadata row must not be missing while the file exists — roll back.
    await supabase.storage.from('documents').remove([path]);
    throw insertError;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const { data: doc, error: fetchError } = await supabase.from('documents').select('file_path').eq('id', id).single();
  if (fetchError) throw fetchError;

  const { error: deleteError } = await supabase.from('documents').delete().eq('id', id);
  if (deleteError) throw deleteError;

  if (doc) {
    await supabase.storage.from('documents').remove([doc.file_path]).catch(() => {});
  }
}

export async function getDocumentDownloadUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 300);
  if (error) throw error;
  return data.signedUrl;
}
