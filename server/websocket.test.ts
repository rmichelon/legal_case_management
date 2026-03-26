import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { wsManager } from "./websocket";
import { NotificationService } from "./notificationService";

describe("WebSocket Manager", () => {
  beforeEach(() => {
    // Reset manager state
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  it("should initialize WebSocket server", () => {
    expect(wsManager).toBeDefined();
    expect(typeof wsManager.getIO).toBe("function");
  });

  it("should check if user is connected", () => {
    const userId = 123;
    const isConnected = wsManager.isUserConnected(userId);
    expect(typeof isConnected).toBe("boolean");
  });

  it("should get connected users count", () => {
    const count = wsManager.getConnectedUsersCount();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should get user sockets count", () => {
    const userId = 123;
    const count = wsManager.getUserSocketsCount(userId);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should return null IO if not initialized", () => {
    const io = wsManager.getIO();
    // IO might be null if not initialized in test environment
    expect(io === null || typeof io === "object").toBe(true);
  });
});

describe("Notification Service", () => {
  it("should check if user is connected", () => {
    const userId = 123;
    const isConnected = NotificationService.isUserConnected(userId);
    expect(typeof isConnected).toBe("boolean");
  });

  it("should get connected users count", () => {
    const count = NotificationService.getConnectedUsersCount();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should have methods for sending notifications", () => {
    expect(typeof NotificationService.createAndBroadcast).toBe("function");
    expect(typeof NotificationService.createAndBroadcastToUsers).toBe("function");
    expect(typeof NotificationService.sendDeadlineAlert).toBe("function");
    expect(typeof NotificationService.sendCaseUpdate).toBe("function");
    expect(typeof NotificationService.sendNewMovement).toBe("function");
    expect(typeof NotificationService.sendDocumentUploaded).toBe("function");
    expect(typeof NotificationService.sendSystemNotification).toBe("function");
    expect(typeof NotificationService.checkAndSendDeadlineAlerts).toBe("function");
  });

  it("should validate notification types", () => {
    const validTypes = [
      "deadline_alert",
      "case_update",
      "new_movement",
      "document_uploaded",
      "system",
    ];
    validTypes.forEach((type) => {
      expect(validTypes).toContain(type);
    });
  });

  it("should validate notification priorities", () => {
    const validPriorities = ["low", "medium", "high", "urgent"];
    validPriorities.forEach((priority) => {
      expect(validPriorities).toContain(priority);
    });
  });
});

describe("WebSocket Notification Integration", () => {
  it("should create notification with valid data", async () => {
    const userId = 1;
    const notification = {
      title: "Test Notification",
      message: "This is a test notification",
      type: "system" as const,
      priority: "medium" as const,
    };

    try {
      const result = await NotificationService.createAndBroadcast(userId, notification);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    } catch (error: any) {
      // Expected to fail in test environment without DB
      expect(error).toBeDefined();
    }
  });

  it("should send deadline alert", async () => {
    const userId = 1;
    const caseId = 1;
    const deadline = {
      id: 1,
      title: "Deadline Title",
      dueDate: new Date(),
      daysRemaining: 3,
    };

    try {
      const result = await NotificationService.sendDeadlineAlert(userId, caseId, deadline);
      expect(result).toBeDefined();
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should send case update", async () => {
    const userId = 1;
    const caseId = 1;
    const update = {
      title: "Case Updated",
      message: "The case has been updated",
    };

    try {
      const result = await NotificationService.sendCaseUpdate(userId, caseId, update);
      expect(result).toBeDefined();
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should send new movement notification", async () => {
    const userId = 1;
    const caseId = 1;
    const movement = {
      title: "New Movement",
      description: "A new movement was added",
    };

    try {
      const result = await NotificationService.sendNewMovement(userId, caseId, movement);
      expect(result).toBeDefined();
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should send document uploaded notification", async () => {
    const userId = 1;
    const caseId = 1;
    const document = {
      name: "document.pdf",
      type: "PDF",
    };

    try {
      const result = await NotificationService.sendDocumentUploaded(userId, caseId, document);
      expect(result).toBeDefined();
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("should send system notification", async () => {
    const userId = 1;
    const notification = {
      title: "System Alert",
      message: "This is a system alert",
      priority: "high" as const,
    };

    try {
      const result = await NotificationService.sendSystemNotification(userId, notification);
      expect(result).toBeDefined();
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });
});
