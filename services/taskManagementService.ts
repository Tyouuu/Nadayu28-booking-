// Task Management & Workflow Service
// Handles repair/violation dispatch workflow with closed-loop tracking

export type TaskType = 'repair' | 'violation' | 'maintenance' | 'inspection' | 'incident';
export type TaskStatus = 'reported' | 'assigned' | 'in-progress' | 'completed' | 'rejected' | 'escalated';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface MaintenanceTask {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  location: string;
  priority: TaskPriority;
  reportedBy: string;
  reportedAt: Date;
  status: TaskStatus;
  assignedTo?: string;
  assignedAt?: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  feedback?: TaskFeedback;
  attachments: string[];
  residentNotified: boolean;
  completionPhotoUrl?: string;
}

export interface TaskFeedback {
  id: string;
  taskId: string;
  submittedBy: string;
  submittedAt: Date;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  resolutionQuality: 'not-resolved' | 'partially-resolved' | 'fully-resolved';
  followUpNeeded: boolean;
}

export interface WorkflowState {
  taskId: string;
  status: TaskStatus;
  timestamp: Date;
  changedBy: string;
  notes?: string;
}

export interface BatchOperation {
  id: string;
  operationType: 'bulk-notification' | 'bulk-approval' | 'bulk-export';
  itemCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  result?: string;
}

export interface CompletionMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgCompletionTime: number; // milliseconds
  avgRating: number;
  resolutionQualityBreakdown: {
    fullyResolved: number;
    partiallyResolved: number;
    notResolved: number;
  };
}

class TaskManagementService {
  private tasks: Map<string, MaintenanceTask> = new Map();
  private feedback: Map<string, TaskFeedback> = new Map();
  private workflowHistory: Map<string, WorkflowState[]> = new Map();
  private batchOperations: Map<string, BatchOperation> = new Map();

  // Report new issue/repair
  reportTask(taskInput: Omit<MaintenanceTask, 'id' | 'reportedAt' | 'status' | 'attachments' | 'residentNotified'>): MaintenanceTask {
    const id = `task-${Date.now()}`;
    const fullTask: MaintenanceTask = {
      ...taskInput,
      id,
      reportedAt: new Date(),
      status: 'reported',
      attachments: [],
      residentNotified: false
    };

    this.tasks.set(id, fullTask);
    this.workflowHistory.set(id, [{
      taskId: id,
      status: 'reported',
      timestamp: new Date(),
      changedBy: taskInput.reportedBy,
      notes: 'Task reported'
    }]);

    return fullTask;
  }

  // Dispatch task to staff (one-click dispatch)
  dispatchTask(taskId: string, assignedTo: string, managementId: string): MaintenanceTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.assignedTo = assignedTo;
    task.assignedAt = new Date();
    task.status = 'assigned';
    task.estimatedCompletion = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours estimate

    // Add to workflow history
    this.addWorkflowState(taskId, 'assigned', managementId, `Task assigned to ${assignedTo}`);

    // Notify resident
    task.residentNotified = true;

    return task;
  }

  // Update task progress
  updateTaskProgress(
    taskId: string,
    status: TaskStatus,
    staffId: string,
    notes?: string
  ): MaintenanceTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = status;

    if (status === 'in-progress') {
      // Already assigned, just update status
    } else if (status === 'completed') {
      task.actualCompletion = new Date();
    }

    this.addWorkflowState(taskId, status, staffId, notes);
    return task;
  }

  // Submit completion with photo evidence
  completeTask(
    taskId: string,
    staffId: string,
    completionNotes: string,
    photoUrl?: string
  ): MaintenanceTask | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    task.status = 'completed';
    task.actualCompletion = new Date();
    task.completionPhotoUrl = photoUrl;

    this.addWorkflowState(taskId, 'completed', staffId, completionNotes);

    // Send auto-feedback request to resident
    this.sendFeedbackRequest(taskId);

    return task;
  }

  // Submit feedback and rating
  submitFeedback(
    taskId: string,
    residentId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    comment: string,
    resolutionQuality: TaskFeedback['resolutionQuality']
  ): TaskFeedback | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    const id = `feedback-${Date.now()}`;
    const feedback: TaskFeedback = {
      id,
      taskId,
      submittedBy: residentId,
      submittedAt: new Date(),
      rating,
      comment,
      resolutionQuality,
      followUpNeeded: rating <= 2 || resolutionQuality !== 'fully-resolved'
    };

    this.feedback.set(id, feedback);
    task.feedback = feedback;

    // If follow-up needed, escalate
    if (feedback.followUpNeeded) {
      task.status = 'escalated';
      this.addWorkflowState(taskId, 'escalated', residentId, `Follow-up needed. Rating: ${rating}/5. Comment: ${comment}`);
    }

    return feedback;
  }

  // Get resident's submitted tasks
  getResidentTasks(residentId: string): MaintenanceTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.reportedBy === residentId)
      .sort((a, b) => b.reportedAt.getTime() - a.reportedAt.getTime());
  }

  // Get staff assigned tasks
  getStaffTasks(staffId: string): MaintenanceTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.assignedTo === staffId)
      .sort((a, b) => (b.estimatedCompletion?.getTime() || 0) - (a.estimatedCompletion?.getTime() || 0));
  }

  // Get pending tasks for management
  getPendingTasks(): MaintenanceTask[] {
    return Array.from(this.tasks.values())
      .filter(t => ['reported', 'assigned', 'in-progress'].includes(t.status))
      .sort((a, b) => {
        // Sort by priority then by date
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return pDiff !== 0 ? pDiff : b.reportedAt.getTime() - a.reportedAt.getTime();
      });
  }

  // Batch operation: bulk send notifications
  bulkNotifyResidents(
    taskIds: string[],
    createdBy: string
  ): BatchOperation {
    const id = `batch-${Date.now()}`;
    const operation: BatchOperation = {
      id,
      operationType: 'bulk-notification',
      itemCount: taskIds.length,
      status: 'processing',
      createdBy,
      createdAt: new Date()
    };

    this.batchOperations.set(id, operation);

    // Simulate processing
    setTimeout(() => {
      operation.status = 'completed';
      operation.completedAt = new Date();
      operation.result = `Notified ${taskIds.length} residents`;
    }, 1000);

    return operation;
  }

  // Batch operation: bulk approval
  bulkApproveReservations(
    reservationIds: string[],
    createdBy: string
  ): BatchOperation {
    const id = `batch-${Date.now()}`;
    const operation: BatchOperation = {
      id,
      operationType: 'bulk-approval',
      itemCount: reservationIds.length,
      status: 'processing',
      createdBy,
      createdAt: new Date()
    };

    this.batchOperations.set(id, operation);

    setTimeout(() => {
      operation.status = 'completed';
      operation.completedAt = new Date();
      operation.result = `Approved ${reservationIds.length} reservations`;
    }, 1000);

    return operation;
  }

  // Get completion metrics
  getCompletionMetrics(): CompletionMetrics {
    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const completedWithFeedback = completedTasks.filter(t => t.feedback);

    const avgCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          const time = (t.actualCompletion!.getTime() - t.reportedAt.getTime());
          return sum + time;
        }, 0) / completedTasks.length
      : 0;

    const avgRating = completedWithFeedback.length > 0
      ? completedWithFeedback.reduce((sum, t) => sum + (t.feedback?.rating || 0), 0) / completedWithFeedback.length
      : 0;

    const qualityBreakdown = {
      fullyResolved: completedWithFeedback.filter(t => t.feedback?.resolutionQuality === 'fully-resolved').length,
      partiallyResolved: completedWithFeedback.filter(t => t.feedback?.resolutionQuality === 'partially-resolved').length,
      notResolved: completedWithFeedback.filter(t => t.feedback?.resolutionQuality === 'not-resolved').length
    };

    return {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      completionRate: allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0,
      avgCompletionTime,
      avgRating,
      resolutionQualityBreakdown: qualityBreakdown
    };
  }

  // Helper: Add workflow state
  private addWorkflowState(taskId: string, status: TaskStatus, changedBy: string, notes?: string): void {
    if (!this.workflowHistory.has(taskId)) {
      this.workflowHistory.set(taskId, []);
    }

    this.workflowHistory.get(taskId)!.push({
      taskId,
      status,
      timestamp: new Date(),
      changedBy,
      notes
    });
  }

  // Helper: Send feedback request
  private sendFeedbackRequest(_taskId: string): void {
    // TODO: In real implementation, send notification to resident
  }
}

export const taskManagementService = new TaskManagementService();
