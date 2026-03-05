// Management Analytics & Permissions Service
// Handles advanced analytics, reports, and permission management

export interface AnalyticsMetrics {
  periodStart: Date;
  periodEnd: Date;
  facilityUsage: {
    facilityId: string;
    facilityName: string;
    bookingCount: number;
    peakHours: { hour: number; bookingCount: number }[];
    utilizationRate: number; // percentage
    averageOccupancy: number;
  }[];
  notificationStats: {
    totalSent: number;
    byCategory: { [key: string]: number };
    readRate: number;
    engagementRate: number; // likes + comments
  };
  visitorTraffic: {
    totalVisitors: number;
    uniqueResidents: number;
    averageVisitDuration: number; // minutes
    peakVisitTimes: string[]; // HH:mm format
  };
  violationMetrics: {
    totalViolations: number;
    byType: { [key: string]: number };
    resolvedCount: number;
    avgResolutionTime: number; // hours
  };
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  reportType: 'facility-usage' | 'violation-log' | 'visitor-summary' | 'notification-performance';
  filters: {
    dateRange: { start: Date; end: Date };
    categories?: string[];
    facilities?: string[];
  };
  createdBy: string;
  createdAt: Date;
  isScheduled: boolean;
  schedule?: 'daily' | 'weekly' | 'monthly';
  lastGeneratedAt?: Date;
  format: 'pdf' | 'csv' | 'excel';
}

export interface FacilityRule {
  id: string;
  facilityId: string;
  facilityName: string;
  ruleName: string;
  description: string;
  maxDuration: number; // hours (e.g., 2 for pool)
  maxBookingsPerWeek: number;
  requiresDeposit: boolean;
  depositAmount?: number;
  allowedAgeGroup?: { min: number; max: number };
  blackoutDates?: Date[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTag {
  id: string;
  name: string;
  description: string;
  members: string[]; // resident IDs
  privileges: string[]; // e.g., ["early-booking", "vip-facilities", "extended-hours"]
  color?: string;
  createdAt: Date;
}

export interface NotificationRule {
  id: string;
  name: string;
  triggerEvent: string; // e.g., "facility-booking", "violation-reported"
  targetAudience: string; // "all" | "tag:vip" | "unit:block-a"
  message: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  sendImmediately: boolean;
  scheduledTime?: string; // HH:mm format
  isActive: boolean;
}

export interface PermissionSet {
  id: string;
  roleName: string; // "owner", "tenant", "security", "admin"
  permissions: {
    facilities: { view: boolean; book: boolean; manage: boolean };
    notifications: { view: boolean; manage: boolean };
    residents: { view: boolean; manage: boolean };
    security: { view: boolean; manage: boolean };
    reports: { view: boolean; export: boolean };
  };
}

class ManagementAnalyticsService {
  private analyticsData: Map<string, AnalyticsMetrics> = new Map();
  private customReports: Map<string, CustomReport> = new Map();
  private facilityRules: Map<string, FacilityRule> = new Map();
  private userTags: Map<string, UserTag> = new Map();
  private notificationRules: Map<string, NotificationRule> = new Map();
  private permissionSets: Map<string, PermissionSet> = new Map();

  constructor() {
    this.initializeDefaultPermissions();
  }

  // Generate analytics for a period
  generateAnalytics(startDate: Date, endDate: Date): AnalyticsMetrics {
    const id = `analytics-${Date.now()}`;
    const metrics: AnalyticsMetrics = {
      periodStart: startDate,
      periodEnd: endDate,
      facilityUsage: this.calculateFacilityUsage(startDate, endDate),
      notificationStats: this.calculateNotificationStats(startDate, endDate),
      visitorTraffic: this.calculateVisitorTraffic(startDate, endDate),
      violationMetrics: this.calculateViolationMetrics(startDate, endDate)
    };

    this.analyticsData.set(id, metrics);
    return metrics;
  }

  // Create custom report
  createCustomReport(report: Omit<CustomReport, 'id' | 'createdAt'>): CustomReport {
    const id = `report-${Date.now()}`;
    const fullReport: CustomReport = {
      ...report,
      id,
      createdAt: new Date()
    };

    this.customReports.set(id, fullReport);
    return fullReport;
  }

  // Generate report (export)
  generateReport(reportId: string): { success: boolean; data?: string; error?: string } {
    const report = this.customReports.get(reportId);
    if (!report) return { success: false, error: 'Report not found' };

    let data = '';
    switch (report.reportType) {
      case 'facility-usage':
        data = this.generateFacilityUsageReport(report);
        break;
      case 'violation-log':
        data = this.generateViolationReport(report);
        break;
      case 'visitor-summary':
        data = this.generateVisitorReport(report);
        break;
      case 'notification-performance':
        data = this.generateNotificationReport(report);
        break;
    }

    const fullReport = this.customReports.get(reportId)!;
    fullReport.lastGeneratedAt = new Date();

    return { success: true, data };
  }

  // Create facility usage rule
  createFacilityRule(rule: Omit<FacilityRule, 'id' | 'createdAt' | 'updatedAt'>): FacilityRule {
    const id = `rule-${Date.now()}`;
    const fullRule: FacilityRule = {
      ...rule,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.facilityRules.set(id, fullRule);
    return fullRule;
  }

  // Update facility rule
  updateFacilityRule(ruleId: string, updates: Partial<FacilityRule>): FacilityRule | null {
    const rule = this.facilityRules.get(ruleId);
    if (!rule) return null;

    Object.assign(rule, updates);
    rule.updatedAt = new Date();

    return rule;
  }

  // Get facility rule
  getFacilityRule(facilityId: string): FacilityRule | null {
    for (const [_, rule] of this.facilityRules) {
      if (rule.facilityId === facilityId && rule.status === 'active') {
        return rule;
      }
    }
    return null;
  }

  // Create user tag
  createUserTag(tag: Omit<UserTag, 'id' | 'createdAt'>): UserTag {
    const id = `tag-${Date.now()}`;
    const fullTag: UserTag = {
      ...tag,
      id,
      createdAt: new Date()
    };

    this.userTags.set(id, fullTag);
    return fullTag;
  }

  // Add member to tag
  addMemberToTag(tagId: string, memberId: string): boolean {
    const tag = this.userTags.get(tagId);
    if (!tag || tag.members.includes(memberId)) return false;

    tag.members.push(memberId);
    return true;
  }

  // Remove member from tag
  removeMemberFromTag(tagId: string, memberId: string): boolean {
    const tag = this.userTags.get(tagId);
    if (!tag) return false;

    const index = tag.members.indexOf(memberId);
    if (index === -1) return false;

    tag.members.splice(index, 1);
    return true;
  }

  // Get user tags for member
  getUserTags(memberId: string): UserTag[] {
    return Array.from(this.userTags.values()).filter(
      tag => tag.members.includes(memberId)
    );
  }

  // Create notification rule
  createNotificationRule(rule: Omit<NotificationRule, 'id'>): NotificationRule {
    const id = `notif-rule-${Date.now()}`;
    const fullRule: NotificationRule = {
      ...rule,
      id
    };

    this.notificationRules.set(id, fullRule);
    return fullRule;
  }

  // Get applicable notification rules
  getApplicableRules(triggerEvent: string): NotificationRule[] {
    return Array.from(this.notificationRules.values()).filter(
      rule => rule.triggerEvent === triggerEvent && rule.isActive
    );
  }

  // Get permission set for role
  getPermissions(roleName: string): PermissionSet | null {
    for (const [_, perm] of this.permissionSets) {
      if (perm.roleName === roleName) {
        return perm;
      }
    }
    return null;
  }

  // Check if user has permission
  hasPermission(roleName: string, permission: string): boolean {
    const permSet = this.getPermissions(roleName);
    if (!permSet) return false;

    // Flatten permissions for checking
    const allPermissions = Object.entries(permSet.permissions)
      .flatMap(([section, perms]) =>
        Object.entries(perms as Record<string, boolean>)
          .map(([perm, allowed]) => `${section}.${perm}` as const)
          .filter(p => (perms as Record<string, boolean>)[p.split('.')[1]])
      );

    return allPermissions.includes(permission as any);
  }

  // Helper methods
  private calculateFacilityUsage(startDate: Date, endDate: Date): AnalyticsMetrics['facilityUsage'] {
    // Simplified - in real app, query actual reservations
    return [
      {
        facilityId: 'pool-001',
        facilityName: 'Swimming Pool',
        bookingCount: 45,
        peakHours: [{ hour: 18, bookingCount: 12 }, { hour: 19, bookingCount: 10 }],
        utilizationRate: 72,
        averageOccupancy: 8
      },
      {
        facilityId: 'gym-001',
        facilityName: 'Fitness Center',
        bookingCount: 52,
        peakHours: [{ hour: 7, bookingCount: 14 }, { hour: 18, bookingCount: 16 }],
        utilizationRate: 68,
        averageOccupancy: 6
      }
    ];
  }

  private calculateNotificationStats(startDate: Date, endDate: Date): AnalyticsMetrics['notificationStats'] {
    return {
      totalSent: 342,
      byCategory: {
        'building-notice': 120,
        'facility-booking': 89,
        'security-alert': 45,
        'maintenance': 88
      },
      readRate: 78.5,
      engagementRate: 42.3
    };
  }

  private calculateVisitorTraffic(startDate: Date, endDate: Date): AnalyticsMetrics['visitorTraffic'] {
    return {
      totalVisitors: 287,
      uniqueResidents: 142,
      averageVisitDuration: 85,
      peakVisitTimes: ['18:00', '19:00', '10:00']
    };
  }

  private calculateViolationMetrics(startDate: Date, endDate: Date): AnalyticsMetrics['violationMetrics'] {
    return {
      totalViolations: 23,
      byType: { 'noise-complaint': 8, 'parking': 7, 'cleanliness': 5, 'other': 3 },
      resolvedCount: 19,
      avgResolutionTime: 36
    };
  }

  private generateFacilityUsageReport(report: CustomReport): string {
    return `Facility Usage Report\n${JSON.stringify(report, null, 2)}`;
  }

  private generateViolationReport(report: CustomReport): string {
    return `Violation Log Report\n${JSON.stringify(report, null, 2)}`;
  }

  private generateVisitorReport(report: CustomReport): string {
    return `Visitor Summary Report\n${JSON.stringify(report, null, 2)}`;
  }

  private generateNotificationReport(report: CustomReport): string {
    return `Notification Performance Report\n${JSON.stringify(report, null, 2)}`;
  }

  private initializeDefaultPermissions(): void {
    const defaultPermissions: PermissionSet[] = [
      {
        id: 'perm-owner',
        roleName: 'owner',
        permissions: {
          facilities: { view: true, book: true, manage: true },
          notifications: { view: true, manage: true },
          residents: { view: true, manage: false },
          security: { view: true, manage: false },
          reports: { view: true, export: true }
        }
      },
      {
        id: 'perm-tenant',
        roleName: 'tenant',
        permissions: {
          facilities: { view: true, book: true, manage: false },
          notifications: { view: true, manage: false },
          residents: { view: false, manage: false },
          security: { view: false, manage: false },
          reports: { view: false, export: false }
        }
      },
      {
        id: 'perm-security',
        roleName: 'security',
        permissions: {
          facilities: { view: true, book: false, manage: false },
          notifications: { view: true, manage: false },
          residents: { view: true, manage: false },
          security: { view: true, manage: true },
          reports: { view: true, export: true }
        }
      },
      {
        id: 'perm-admin',
        roleName: 'admin',
        permissions: {
          facilities: { view: true, book: true, manage: true },
          notifications: { view: true, manage: true },
          residents: { view: true, manage: true },
          security: { view: true, manage: true },
          reports: { view: true, export: true }
        }
      }
    ];

    defaultPermissions.forEach(perm => {
      this.permissionSets.set(perm.id, perm);
    });
  }
}

export const managementAnalyticsService = new ManagementAnalyticsService();
