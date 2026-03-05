// Security & Access Management Service
// Handles visitor verification, access permissions, and whitelist management

export interface VisitorRecord {
  id: string;
  visitorName: string;
  visitorContact: string;
  licensePlate?: string;
  residentId: string;
  residentName: string;
  expectedArrivalTime: Date;
  expectedDepartureTime: Date;
  actualArrivalTime?: Date;
  actualDepartureTime?: Date;
  qrCode: string;
  status: 'scheduled' | 'arrived' | 'left' | 'no-show';
  flags: 'normal' | 'abnormal' | 'suspicious';
  reportedAt?: Date;
  reportedBy?: string;
  reportReason?: string;
}

export interface AccessPermission {
  id: string;
  type: 'resident' | 'visitor' | 'vehicle';
  entityId: string;
  entityName: string;
  residentId: string;
  validFrom: Date;
  validUntil: Date;
  validityDuration?: number; // in hours (e.g., 2 hours for temporary pass)
  accessLevel: 'entry' | 'entry-and-facilities' | 'full';
  isWhitelisted: boolean;
  automaticExpiry: boolean;
  status: 'active' | 'expired' | 'revoked';
}

export interface AbnormalRecord {
  id: string;
  visitorId: string;
  visitorName: string;
  incidentType: 'unannounced-visitor' | 'unauthorized-access' | 'overstay' | 'suspicious-behavior';
  timestamp: Date;
  location: string;
  description: string;
  reportedBy: string;
  status: 'reported' | 'investigating' | 'resolved';
  actionTaken?: string;
  resolvedAt?: Date;
}

export interface TaskNotification {
  id: string;
  securityStaffId: string;
  managementId: string;
  taskType: 'patrol' | 'inspection' | 'incident-response' | 'facility-check';
  location: string;
  description: string;
  deadline?: Date;
  status: 'assigned' | 'in-progress' | 'completed' | 'escalated';
  assignedAt: Date;
  completedAt?: Date;
  completionNotes?: string;
  attachments?: string[];
}

export interface FacilityInspectionLog {
  id: string;
  facilityName: string;
  inspectionType: string; // e.g., "Pool disinfected", "Gym equipment checked"
  inspectedBy: string;
  timestamp: Date;
  status: 'confirmed' | 'pending-confirmation';
  qrCodeScanned: boolean;
  photoEvidence?: string[];
  notes?: string;
}

class SecurityAccessService {
  private visitorRecords: Map<string, VisitorRecord> = new Map();
  private accessPermissions: Map<string, AccessPermission> = new Map();
  private abnormalRecords: Map<string, AbnormalRecord> = new Map();
  private taskNotifications: Map<string, TaskNotification> = new Map();
  private inspectionLogs: Map<string, FacilityInspectionLog> = new Map();
  private whitelist: Map<string, AccessPermission[]> = new Map();

  // Register visitor with QR code
  registerVisitor(visitor: Omit<VisitorRecord, 'id' | 'qrCode'>): VisitorRecord {
    const id = `visitor-${Date.now()}`;
    const qrCode = this.generateQRCode(id);

    const record: VisitorRecord = {
      ...visitor,
      id,
      qrCode,
      status: 'scheduled',
      flags: 'normal'
    };

    this.visitorRecords.set(id, record);
    return record;
  }

  // Scan QR code and auto-display visitor details
  scanVisitorQRCode(qrCode: string): VisitorRecord | null {
    for (const [_, record] of this.visitorRecords) {
      if (record.qrCode === qrCode) {
        record.actualArrivalTime = new Date();
        record.status = 'arrived';

        // Auto-check for timing anomalies
        const expectedTime = new Date(record.expectedArrivalTime);
        const arrival = new Date(record.actualArrivalTime);
        const diffMinutes = Math.abs(arrival.getTime() - expectedTime.getTime()) / (1000 * 60);

        if (diffMinutes > 30) {
          record.flags = 'abnormal';
        }

        return record;
      }
    }
    return null;
  }

  // Report abnormal visitor
  reportAbnormalVisitor(
    visitorId: string,
    incidentType: AbnormalRecord['incidentType'],
    description: string,
    reportedBy: string
  ): AbnormalRecord {
    const id = `abnormal-${Date.now()}`;
    const visitorRecord = this.visitorRecords.get(visitorId);

    const record: AbnormalRecord = {
      id,
      visitorId,
      visitorName: visitorRecord?.visitorName || 'Unknown',
      incidentType,
      timestamp: new Date(),
      location: 'Main Entrance', // Should get from system
      description,
      reportedBy,
      status: 'reported'
    };

    this.abnormalRecords.set(id, record);

    // Auto-flag visitor record
    if (visitorRecord) {
      visitorRecord.flags = 'suspicious';
      visitorRecord.reportedAt = new Date();
      visitorRecord.reportedBy = reportedBy;
      visitorRecord.reportReason = description;
    }

    return record;
  }

  // Create temporary access pass with auto-expiry
  createTemporaryPass(
    residentId: string,
    entityId: string,
    entityName: string,
    validityHours: number
  ): AccessPermission {
    const id = `pass-${Date.now()}`;
    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + validityHours * 60 * 60 * 1000);

    const permission: AccessPermission = {
      id,
      type: 'visitor',
      entityId,
      entityName,
      residentId,
      validFrom,
      validUntil,
      validityDuration: validityHours,
      accessLevel: 'entry',
      isWhitelisted: false,
      automaticExpiry: true,
      status: 'active'
    };

    this.accessPermissions.set(id, permission);

    // Set auto-expiry timer
    setTimeout(() => {
      const perm = this.accessPermissions.get(id);
      if (perm) {
        perm.status = 'expired';
      }
    }, validityHours * 60 * 60 * 1000);

    return permission;
  }

  // Add to resident/vehicle whitelist
  addToWhitelist(
    residentId: string,
    entityId: string,
    entityName: string,
    type: 'resident' | 'vehicle'
  ): AccessPermission {
    const id = `whitelist-${Date.now()}`;
    const permission: AccessPermission = {
      id,
      type,
      entityId,
      entityName,
      residentId,
      validFrom: new Date(),
      validUntil: new Date('2099-12-31'), // Effectively no expiry
      accessLevel: 'entry-and-facilities',
      isWhitelisted: true,
      automaticExpiry: false,
      status: 'active'
    };

    this.accessPermissions.set(id, permission);

    // Add to whitelist map for instant lookup
    if (!this.whitelist.has(residentId)) {
      this.whitelist.set(residentId, []);
    }
    this.whitelist.get(residentId)!.push(permission);

    return permission;
  }

  // Check whitelist for instant access
  isWhitelisted(entityId: string, residentId?: string): boolean {
    const permissions = Array.from(this.accessPermissions.values()).filter(
      p => p.isWhitelisted && p.entityId === entityId && p.status === 'active'
    );

    return permissions.length > 0;
  }

  // Assign security task
  assignTask(task: Omit<TaskNotification, 'id' | 'assignedAt'>): TaskNotification {
    const id = `task-${Date.now()}`;
    const notification: TaskNotification = {
      ...task,
      id,
      assignedAt: new Date()
    };

    this.taskNotifications.set(id, notification);
    return notification;
  }

  // Update task status
  updateTaskStatus(
    taskId: string,
    status: TaskNotification['status'],
    completionNotes?: string
  ): TaskNotification | null {
    const task = this.taskNotifications.get(taskId);
    if (!task) return null;

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
      task.completionNotes = completionNotes;
    }

    return task;
  }

  // Log facility inspection
  logInspection(inspection: Omit<FacilityInspectionLog, 'id' | 'timestamp'>): FacilityInspectionLog {
    const id = `inspection-${Date.now()}`;
    const log: FacilityInspectionLog = {
      ...inspection,
      id,
      timestamp: new Date()
    };

    this.inspectionLogs.set(id, log);
    return log;
  }

  // Get visitor verification details after QR scan
  getVisitorDetails(visitorId: string): VisitorRecord | null {
    return this.visitorRecords.get(visitorId) || null;
  }

  // Get abnormal records for management review
  getAbnormalRecords(status?: AbnormalRecord['status']): AbnormalRecord[] {
    let records = Array.from(this.abnormalRecords.values());
    
    if (status) {
      records = records.filter(r => r.status === status);
    }

    return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get security tasks for staff
  getTasksForStaff(staffId: string): TaskNotification[] {
    return Array.from(this.taskNotifications.values())
      .filter(t => t.securityStaffId === staffId)
      .sort((a, b) => (b.deadline?.getTime() || 0) - (a.deadline?.getTime() || 0));
  }

  // Helper: Generate QR code
  private generateQRCode(visitorId: string): string {
    return `QR-${btoa(visitorId)}-${Date.now()}`;
  }
}

export const securityAccessService = new SecurityAccessService();
