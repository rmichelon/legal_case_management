import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import * as db from "./db";

interface UserSocket {
  userId: number;
  socketId: string;
  connectedAt: Date;
}

class WebSocketManager {
  private io: SocketIOServer | null = null;
  private userSockets: Map<number, UserSocket[]> = new Map();
  private socketToUser: Map<string, number> = new Map();

  /**
   * Initialize WebSocket server
   */
  public initialize(httpServer: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.VITE_FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      pingInterval: 25000,
      pingTimeout: 60000,
      maxHttpBufferSize: 1e6,
    });
    console.log("[WebSocket] Server initialized with CORS origin:", process.env.VITE_FRONTEND_URL || "*");

    this.setupEventHandlers();
    console.log("[WebSocket] Initialized");

    return this.io;
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // Auto-authenticate from auth header
      const auth = socket.handshake.auth;
      if (auth?.userId) {
        try {
          this.handleAuthenticate(socket, { userId: auth.userId, token: auth.token || "" });
        } catch (error) {
          console.error(`[WebSocket] Auto-authentication error:`, error);
        }
      }

      // Handle user authentication
      socket.on("authenticate", (data: { userId: number; token: string }) => {
        try {
          this.handleAuthenticate(socket, data);
        } catch (error) {
          console.error(`[WebSocket] Authentication error:`, error);
          socket.emit("authentication_error", { message: "Authentication failed" });
        }
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on("error", (error: any) => {
        console.error(`[WebSocket] Socket error (${socket.id}):`, error);
      });
    });
  }

  /**
   * Handle user authentication
   */
  private handleAuthenticate(socket: Socket, data: { userId: number; token: string }): void {
    const { userId } = data;

    // Store socket-to-user mapping
    this.socketToUser.set(socket.id, userId);

    // Add socket to user's socket list
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }

    const userSocket: UserSocket = {
      userId,
      socketId: socket.id,
      connectedAt: new Date(),
    };

    this.userSockets.get(userId)!.push(userSocket);

    // Join user-specific room
    socket.join(`user:${userId}`);

    console.log(`[WebSocket] User ${userId} authenticated with socket ${socket.id}`);

    // Send welcome message
    socket.emit("authenticated", {
      success: true,
      userId,
      socketId: socket.id,
    });
  }

  /**
   * Handle user disconnect
   */
  private handleDisconnect(socket: Socket): void {
    const userId = this.socketToUser.get(socket.id);

    if (userId) {
      // Remove from socket mapping
      this.socketToUser.delete(socket.id);

      // Remove from user sockets list
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        const index = userSockets.findIndex((s) => s.socketId === socket.id);
        if (index !== -1) {
          userSockets.splice(index, 1);
        }

        // Clean up if no more sockets for this user
        if (userSockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }

      console.log(`[WebSocket] User ${userId} disconnected (socket ${socket.id})`);
    }
  }

  /**
   * Send notification to a specific user
   */
  public async sendNotificationToUser(
    userId: number,
    notification: {
      id: number;
      title: string;
      message: string;
      type: string;
      priority: string;
      actionUrl?: string;
    }
  ): Promise<void> {
    if (!this.io) return;

    console.log(`[WebSocket] Sending notification to user ${userId}:`, notification.title);

    this.io.to(`user:${userId}`).emit("notification", {
      ...notification,
      receivedAt: new Date(),
    });
  }

  /**
   * Send notification to multiple users
   */
  public async sendNotificationToUsers(
    userIds: number[],
    notification: {
      id: number;
      title: string;
      message: string;
      type: string;
      priority: string;
      actionUrl?: string;
    }
  ): Promise<void> {
    if (!this.io) return;

    console.log(`[WebSocket] Sending notification to ${userIds.length} users:`, notification.title);

    for (const userId of userIds) {
      this.io.to(`user:${userId}`).emit("notification", {
        ...notification,
        receivedAt: new Date(),
      });
    }
  }

  /**
   * Broadcast notification to all connected users
   */
  public async broadcastNotification(notification: {
    id: number;
    title: string;
    message: string;
    type: string;
    priority: string;
  }): Promise<void> {
    if (!this.io) return;

    console.log("[WebSocket] Broadcasting notification to all users:", notification.title);

    this.io.emit("notification", {
      ...notification,
      receivedAt: new Date(),
    });
  }

  /**
   * Send real-time update about a case
   */
  public async sendCaseUpdate(
    userId: number,
    caseId: number,
    update: {
      type: string;
      title: string;
      message: string;
    }
  ): Promise<void> {
    if (!this.io) return;

    console.log(`[WebSocket] Sending case update to user ${userId} for case ${caseId}`);

    this.io.to(`user:${userId}`).emit("case_update", {
      caseId,
      ...update,
      updatedAt: new Date(),
    });
  }

  /**
   * Send deadline alert
   */
  public async sendDeadlineAlert(
    userId: number,
    deadlineId: number,
    deadline: {
      caseId: number;
      title: string;
      dueDate: Date;
      daysRemaining: number;
    }
  ): Promise<void> {
    if (!this.io) return;

    console.log(`[WebSocket] Sending deadline alert to user ${userId} for deadline ${deadlineId}`);

    this.io.to(`user:${userId}`).emit("deadline_alert", {
      deadlineId,
      ...deadline,
      alertedAt: new Date(),
    });
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get user's connected sockets count
   */
  public getUserSocketsCount(userId: number): number {
    return this.userSockets.get(userId)?.length ?? 0;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: number): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.length > 0;
  }

  /**
   * Get Socket.io instance
   */
  public getIO(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
