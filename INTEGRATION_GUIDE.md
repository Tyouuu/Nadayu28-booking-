// Integration Guide: Three-Perspective Smart Community System
// This document outlines how to integrate the new services into your components

/*
================================================================================
I. RESIDENT VIEW ENHANCEMENTS
================================================================================

1. Facility Reservations with Conflict Detection
   File: services/reservationService.ts
   
   Usage in Component:
   ```typescript
   import { reservationService, Reservation } from '@/services/reservationService';
   
   // Create reservation with conflict checking
   const result = reservationService.createReservation({
     id: '',
     type: 'facility',
     residentId: 'res-123',
     residentName: 'John Tan',
     facilityId: 'pool-001',
     facilityName: 'Swimming Pool',
     startTime: new Date('2024-12-15T14:00'),
     endTime: new Date('2024-12-15T16:00'),
     status: 'confirmed',
     notes: 'Family gathering',
     createdAt: new Date(),
     updatedAt: new Date()
   });
   
   if (!result.success) {
     // Show conflict alerts
     result.errors?.forEach(alert => {
       console.log(alert.message);
       alert.recommendedSlots?.forEach(slot => {
         // Display available time slots to user
       });
     });
   }
   ```

2. Family Member Permissions
   Share reservations with family members to avoid duplicate actions:
   ```typescript
   const permissions: FamilyPermission[] = [
     {
       memberId: 'mem-456',
       memberName: 'Sarah Tan',
       permissions: ['view', 'modify', 'cancel'],
       expiryDate: new Date('2025-12-31')
     }
   ];
   
   reservationService.addFamilyPermissions('res-123', permissions);
   
   // Family members can view shared reservations
   const familyReservations = reservationService.getUserReservations('mem-456');
   ```

3. Reschedule with Conflict Checking
   ```typescript
   const rescheduleResult = reservationService.rescheduleReservation(
     'res-123',
     new Date('2024-12-15T16:00'),
     new Date('2024-12-15T18:00')
   );
   ```

================================================================================
II. NOTIFICATION SYSTEM WITH CATEGORIES
================================================================================

File: services/notificationService.ts

1. Send Categorized Notifications
   ```typescript
   import { notificationService, NotificationCategory } from '@/services/notificationService';
   
   notificationService.sendNotification({
     recipientId: 'res-123',
     category: 'building-notice',
     priority: 'high',
     title: 'Water Maintenance Schedule',
     content: 'Water will be shut off on Dec 20, 9 AM - 1 PM',
     targetAudience: 'all'
   });
   ```

2. User Subscriptions & Preferences
   ```typescript
   // Get user's notification settings
   const subscription = notificationService.getSubscription('res-123');
   
   // User disables certain categories
   notificationService.toggleCategorySubscription('res-123', 'facility-booking');
   
   // Update notification frequency
   notificationService.updateSubscription('res-123', {
     frequency: 'daily-digest',
     quietHours: {
       enabled: true,
       startTime: '22:00',
       endTime: '08:00'
     }
   });
   ```

3. Notification Interactions (Likes, Comments)
   ```typescript
   // User likes notification
   notificationService.likeNotification('notif-123', 'user-456');
   
   // User comments on notification (community discussion)
   notificationService.addComment(
     'notif-123',
     'user-456',
     'John Tan',
     'Should we reschedule to evening?'
   );
   
   // Mark as read
   notificationService.markAsRead('notif-123', 'res-123');
   ```

4. Read Receipts & Analytics
   ```typescript
   // Admin can view read statistics
   const stats = notificationService.getReadStatistics('notif-123');
   // { total: 340, read: 267, readRate: 78.5, avgReadTime: 3600000 }
   ```

================================================================================
III. SECURITY VIEW ENHANCEMENTS
================================================================================

File: services/securityAccessService.ts

1. Visitor Registration & QR Code Generation
   ```typescript
   import { securityAccessService } from '@/services/securityAccessService';
   
   // Resident schedules visitor (from Dashboard)
   const visitor = securityAccessService.registerVisitor({
     visitorName: 'Mike Chen',
     visitorContact: '0123456789',
     licensePlate: 'ABC1234',
     residentId: 'res-123',
     residentName: 'John Tan',
     expectedArrivalTime: new Date('2024-12-15T14:00'),
     expectedDepartureTime: new Date('2024-12-15T16:00'),
     status: 'scheduled',
     flags: 'normal'
   });
   
   // System generates QR code (displayed to resident & sent to visitor)
   console.log(visitor.qrCode); // Can be displayed as QR image
   ```

2. Automated Visitor Verification (Security Scanner)
   ```typescript
   // Security staff scans QR code
   const visitorRecord = securityAccessService.scanVisitorQRCode(qrCodeData);
   
   // System automatically displays:
   // - Resident name & unit
   // - Expected arrival/departure time
   // - License plate
   // - Visitor contact info
   
   if (visitorRecord) {
     // Shows anomaly if timing doesn't match (>30 min difference)
     if (visitorRecord.flags === 'abnormal') {
       // Highlight for verification
     }
   }
   ```

3. Report Abnormal Visitor
   ```typescript
   // One-click report to management
   securityAccessService.reportAbnormalVisitor(
     'visitor-123',
     'unannounced-visitor',
     'Visitor arrived without prior notification',
     'sec-staff-001'
   );
   ```

4. Access Permissions & Whitelisting
   ```typescript
   // Create temporary access (2-hour validity, auto-expiry)
   const tempPass = securityAccessService.createTemporaryPass(
     'res-123',
     'visit-456',
     'Guest',
     2 // hours
   );
   
   // Add resident/vehicle to whitelist (instant access)
   securityAccessService.addToWhitelist(
     'res-123',
     'ABC1234',
     'Family Vehicle',
     'vehicle'
   );
   
   // Check whitelist (instant scan verification)
   const isAllowed = securityAccessService.isWhitelisted('ABC1234');
   ```

5. Facility Inspection Logging
   ```typescript
   // Scan to confirm facility inspection (e.g., "Pool disinfected")
   const inspection = securityAccessService.logInspection({
     facilityName: 'Swimming Pool',
     inspectionType: 'Chlorine level verified',
     inspectedBy: 'sec-staff-001',
     status: 'confirmed',
     qrCodeScanned: true,
     photoEvidence: ['photo-url-1', 'photo-url-2']
   });
   ```

6. Security Task Management
   ```typescript
   // Management assigns task to security staff
   const task = securityAccessService.assignTask({
     securityStaffId: 'sec-staff-001',
     managementId: 'mgmt-001',
     taskType: 'patrol',
     location: 'Block A - Ground Floor',
     description: 'Routine patrol check',
     deadline: new Date('2024-12-15T20:00'),
     status: 'assigned'
   });
   
   // Staff updates status
   securityAccessService.updateTaskStatus(
     'task-123',
     'completed',
     'Patrol completed, all clear'
   );
   ```

================================================================================
IV. MANAGEMENT VIEW ENHANCEMENTS
================================================================================

File: services/taskManagementService.ts & managementAnalyticsService.ts

1. Closed-Loop Task Management (Repair Workflow)
   ```typescript
   import { taskManagementService } from '@/services/taskManagementService';
   
   // Resident reports repair
   const task = taskManagementService.reportTask({
     type: 'repair',
     title: 'Leaking tap in bathroom',
     description: 'Main bathroom tap leaks water',
     location: 'Unit A-12-05',
     priority: 'high',
     reportedBy: 'res-123'
   });
   
   // One-click dispatch to maintenance staff
   taskManagementService.dispatchTask(
     task.id,
     'maint-staff-001',
     'mgmt-001'
   );
   
   // Staff receives notification with task details
   
   // Staff updates progress
   taskManagementService.updateTaskProgress(
     task.id,
     'in-progress',
     'maint-staff-001',
     'Arrived at unit, inspecting issue'
   );
   
   // Staff completes with photo evidence
   taskManagementService.completeTask(
     task.id,
     'maint-staff-001',
     'Replaced tap cartridge, tested water flow',
     'completion-photo-url'
   );
   
   // System sends auto-feedback request to resident
   // Resident rates quality of work
   taskManagementService.submitFeedback(
     task.id,
     'res-123',
     5,
     'Great job! Fixed immediately and cleaned up',
     'fully-resolved'
   );
   
   // Management tracks completion metrics
   const metrics = taskManagementService.getCompletionMetrics();
   // {
   //   totalTasks: 125,
   //   completedTasks: 118,
   //   completionRate: 94.4,
   //   avgCompletionTime: 86400000,
   //   avgRating: 4.6,
   //   resolutionQualityBreakdown: { fullyResolved: 115, ... }
   // }
   ```

2. Batch Operations
   ```typescript
   // Bulk send notifications
   const batchOp = taskManagementService.bulkNotifyResidents(
     ['res-001', 'res-002', 'res-003'],
     'mgmt-001'
   );
   
   // Bulk approve reservations
   taskManagementService.bulkApproveReservations(
     ['booking-001', 'booking-002'],
     'mgmt-001'
   );
   ```

3. Advanced Analytics
   ```typescript
   import { managementAnalyticsService } from '@/services/managementAnalyticsService';
   
   // Generate analytics for period
   const analytics = managementAnalyticsService.generateAnalytics(
     new Date('2024-12-01'),
     new Date('2024-12-31')
   );
   
   // Shows:
   // - Peak booking times for each facility
   // - Notification read rates by category
   // - Visitor traffic patterns
   // - Violation resolution times
   
   console.log(analytics.facilityUsage);
   console.log(analytics.notificationStats);
   console.log(analytics.visitorTraffic);
   console.log(analytics.violationMetrics);
   ```

4. Custom Report Generation & Export
   ```typescript
   // Create monthly facility usage report
   const report = managementAnalyticsService.createCustomReport({
     name: 'December Facility Usage',
     description: 'Monthly pool and gym usage statistics',
     reportType: 'facility-usage',
     filters: {
       dateRange: {
         start: new Date('2024-12-01'),
         end: new Date('2024-12-31')
       },
       facilities: ['pool-001', 'gym-001']
     },
     createdBy: 'mgmt-001',
     isScheduled: true,
     schedule: 'monthly',
     format: 'pdf'
   });
   
   // Generate and export
   const result = managementAnalyticsService.generateReport(report.id);
   // Download result.data as PDF
   ```

5. Facility Rules Configuration
   ```typescript
   // Set pool usage rules
   managementAnalyticsService.createFacilityRule({
     facilityId: 'pool-001',
     facilityName: 'Swimming Pool',
     ruleName: 'Peak Hours Restriction',
     description: 'Max 2-hour bookings during peak hours',
     maxDuration: 2,
     maxBookingsPerWeek: 4,
     requiresDeposit: false,
     status: 'active'
   });
   
   // Validate reservation against rules
   const rule = managementAnalyticsService.getFacilityRule('pool-001');
   ```

6. User Tag Management (Differentiated Privileges)
   ```typescript
   // Create VIP members group
   const vipTag = managementAnalyticsService.createUserTag({
     name: 'VIP Members',
     description: 'Premium facility access members',
     members: ['res-001', 'res-002'],
     privileges: ['early-booking', 'vip-facilities', 'extended-hours'],
     color: '#FFD700'
   });
   
   // Add member to group
   managementAnalyticsService.addMemberToTag(vipTag.id, 'res-003');
   
   // Get member's tags (for permission checks)
   const memberTags = managementAnalyticsService.getUserTags('res-001');
   ```

7. Notification Rules for Automation
   ```typescript
   // Create rule: notify premium members first about new bookings
   managementAnalyticsService.createNotificationRule({
     name: 'Premium Facility Opening',
     triggerEvent: 'facility-available-slot',
     targetAudience: 'tag:vip',
     message: 'New time slot available at {facility}',
     priority: 'high',
     sendImmediately: true,
     isActive: true
   });
   ```

8. Permission Management
   ```typescript
   // Get role permissions
   const ownerPermissions = managementAnalyticsService.getPermissions('owner');
   
   // Check specific permission
   const canManageFacilities = managementAnalyticsService.hasPermission(
     'owner',
     'facilities.manage'
   );
   ```

================================================================================
V. CROSS-SYSTEM INTEGRATION (Information Loop)
================================================================================

Example: Complete Visitor Flow
```
1. RESIDENT schedules visitor via Dashboard:
   reservationService.registerVisitor(visitorDetails)
   -> Generates QR code
   -> Sends notification to visitor

2. SECURITY staff scans QR code at entrance:
   securityAccessService.scanVisitorQRCode(qrCode)
   -> Automatically displays resident details
   -> Shows expected arrival/departure
   -> Flags abnormal timing

3. MANAGEMENT views analytics:
   managementAnalyticsService.generateAnalytics(dates)
   -> Shows visitor traffic patterns
   -> Tracks security incidents
   -> Identifies peak times

4. SYSTEM closes the loop:
   - Visitor departure logged
   - Resident receives thank-you notification
   - Analytics updated
   - Management informed of any incidents
```

Example: Complete Repair Workflow
```
1. RESIDENT reports issue:
   taskManagementService.reportTask(repairDetails)
   -> Creates task with priority

2. MANAGEMENT dispatches immediately:
   taskManagementService.dispatchTask(taskId, staffId)
   -> Resident notified of assignment
   -> Staff receives assignment

3. STAFF updates progress in real-time:
   taskManagementService.updateTaskProgress(...)
   -> Resident sees updates
   -> Management tracks status

4. STAFF completes with photo evidence:
   taskManagementService.completeTask(...)
   -> Automatic resident feedback request
   -> Task closure

5. RESIDENT provides feedback:
   taskManagementService.submitFeedback(...)
   -> Satisfaction tracked
   -> Auto-escalation if needed

6. MANAGEMENT analyzes metrics:
   taskManagementService.getCompletionMetrics()
   -> Identifies efficiency trends
   -> Recognizes top performers
   -> Plans improvements
```

================================================================================
VI. COMPONENT INTEGRATION CHECKLIST
================================================================================

UI Components to Update:
- [x] Dashboard.tsx - Add analytics widgets, bulk operations
- [ ] Profile.tsx - Add family permissions, reservations
- [ ] Amenities.tsx - Add conflict detection, recommended slots
- [ ] SecurityScanner.tsx - Auto-display visitor details, abnormal flagging
- [ ] Reporting.tsx - Task workflow, feedback collection
- [ ] AdminPanel.tsx - Analytics, custom reports, rules management
- [ ] Navigation.tsx - Quick access to new features
- [ ] New Component: LifestyleServices.tsx - Neighborhood swap, emergency contacts

Services Integration Order:
1. Start with reservationService (foundational for facility booking)
2. Add notificationService (multi-component feature)
3. Integrate securityAccessService (SecurityScanner enhancement)
4. Add taskManagementService (Reporting workflow)
5. Finally integrate managementAnalyticsService (Dashboard enhancement)

================================================================================
*/

export const INTEGRATION_GUIDE = 'See comments above for detailed usage examples';
