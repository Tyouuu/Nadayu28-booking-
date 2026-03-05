// Reservation Management Service
// Handles facility/visitor reservation logic with conflict detection

export interface Reservation {
  id: string;
  type: 'facility' | 'visitor';
  residentId: string;
  residentName: string;
  facilityId?: string;
  facilityName?: string;
  visitorName?: string;
  visitorContact?: string;
  licensePlate?: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  sharedWith?: string[]; // Family member IDs
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConflictAlert {
  reservationId: string;
  conflictingReservationId: string;
  type: 'time-overlap' | 'capacity-limit' | 'exclusive-use';
  message: string;
  severity: 'warning' | 'error';
  recommendedSlots?: TimeSlot[];
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  availability: number; // 0-100 percentage
  reason?: string;
}

export interface FamilyPermission {
  memberId: string;
  memberName: string;
  permissions: ('view' | 'reserve' | 'modify' | 'cancel')[];
  expiryDate?: Date;
}

class ReservationService {
  private reservations: Map<string, Reservation> = new Map();
  private conflicts: Map<string, ConflictAlert[]> = new Map();

  // Check for time conflicts
  checkTimeConflicts(
    facilityId: string,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: string
  ): ConflictAlert[] {
    const alerts: ConflictAlert[] = [];
    const facilityReservations = Array.from(this.reservations.values()).filter(
      r => r.facilityId === facilityId && 
           r.status !== 'cancelled' &&
           r.id !== excludeReservationId
    );

    facilityReservations.forEach(existing => {
      if (this.hasTimeOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
        alerts.push({
          reservationId: '',
          conflictingReservationId: existing.id,
          type: 'time-overlap',
          message: `Conflicts with ${existing.residentName}'s reservation (${existing.startTime.toLocaleTimeString()} - ${existing.endTime.toLocaleTimeString()})`,
          severity: 'error',
          recommendedSlots: this.getAvailableSlots(facilityId, startTime, endTime)
        });
      }
    });

    return alerts;
  }

  // Get recommended available time slots
  getAvailableSlots(
    facilityId: string,
    preferredStart: Date,
    preferredEnd: Date
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayReservations = Array.from(this.reservations.values()).filter(
      r => r.facilityId === facilityId && 
           r.status !== 'cancelled' &&
           this.isSameDay(r.startTime, preferredStart)
    );

    // Generate 2-hour slots for the day
    let current = new Date(preferredStart);
    current.setHours(9, 0, 0, 0); // Start from 9 AM

    while (current.getHours() < 21) { // Until 9 PM
      const slotEnd = new Date(current);
      slotEnd.setHours(current.getHours() + 2);

      const isConflicted = dayReservations.some(r =>
        this.hasTimeOverlap(current, slotEnd, r.startTime, r.endTime)
      );

      slots.push({
        startTime: new Date(current),
        endTime: new Date(slotEnd),
        availability: isConflicted ? 0 : 100,
        reason: isConflicted ? 'Already booked' : 'Available'
      });

      current.setHours(current.getHours() + 2);
    }

    return slots;
  }

  // Create or update reservation
  createReservation(reservation: Reservation): { success: boolean; errors?: ConflictAlert[] } {
    const conflicts = this.checkTimeConflicts(
      reservation.facilityId || '',
      reservation.startTime,
      reservation.endTime
    );

    if (conflicts.length > 0) {
      return { success: false, errors: conflicts };
    }

    const id = reservation.id || `res-${Date.now()}`;
    this.reservations.set(id, { ...reservation, id });

    return { success: true };
  }

  // Cancel and reschedule
  rescheduleReservation(
    reservationId: string,
    newStartTime: Date,
    newEndTime: Date
  ): { success: boolean; errors?: ConflictAlert[] } {
    const existing = this.reservations.get(reservationId);
    if (!existing) return { success: false, errors: [{ 
      reservationId,
      conflictingReservationId: '',
      type: 'time-overlap',
      message: 'Reservation not found',
      severity: 'error'
    }]};

    const conflicts = this.checkTimeConflicts(
      existing.facilityId || '',
      newStartTime,
      newEndTime,
      reservationId
    );

    if (conflicts.length > 0) {
      return { success: false, errors: conflicts };
    }

    existing.startTime = newStartTime;
    existing.endTime = newEndTime;
    existing.updatedAt = new Date();

    return { success: true };
  }

  // Share reservation with family members
  addFamilyPermissions(
    reservationId: string,
    permissions: FamilyPermission[]
  ): boolean {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) return false;

    reservation.sharedWith = permissions.map(p => p.memberId);
    reservation.updatedAt = new Date();

    return true;
  }

  // Get user's reservations
  getUserReservations(residentId: string): Reservation[] {
    return Array.from(this.reservations.values()).filter(
      r => r.residentId === residentId || r.sharedWith?.includes(residentId)
    );
  }

  // Helper: Check time overlap
  private hasTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  // Helper: Check same day
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
}

export const reservationService = new ReservationService();
