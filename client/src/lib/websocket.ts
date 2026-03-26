import { io, Socket } from "socket.io-client";

interface WebSocketNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl?: string;
  receivedAt: Date;
}

interface WebSocketCaseUpdate {
  caseId: number;
  type: string;
  title: string;
  message: string;
  updatedAt: Date;
}

interface WebSocketDeadlineAlert {
  deadlineId: number;
  caseId: number;
  title: string;
  dueDate: Date;
  daysRemaining: number;
  alertedAt: Date;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;

  /**
   * Initialize WebSocket connection
   */
  public connect(userId: number, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        return;
      }

      this.isConnecting = true;
      this.userId = userId;

      // Determine socket URL
      const socketUrl = process.env.NODE_ENV === "development" 
        ? "http://localhost:3000"
        : window.location.origin;

      this.socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        auth: {
          token,
        },
      });

      this.setupEventHandlers();

      this.socket.on("connect", () => {
        console.log("[WebSocket] Connected");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        // Authenticate with server
        this.socket!.emit("authenticate", { userId, token });
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("[WebSocket] Connection error:", error);
        this.isConnecting = false;
        reject(error);
      });

      this.socket.on("error", (error) => {
        console.error("[WebSocket] Socket error:", error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.isConnecting) {
          this.isConnecting = false;
          reject(new Error("WebSocket connection timeout"));
        }
      }, 10000);
    });
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Handle authentication
    this.socket.on("authenticated", (data) => {
      console.log("[WebSocket] Authenticated:", data);
      this.emit("authenticated", data);
    });

    // Handle notifications
    this.socket.on("notification", (notification: WebSocketNotification) => {
      console.log("[WebSocket] Received notification:", notification);
      this.emit("notification", notification);
    });

    // Handle case updates
    this.socket.on("case_update", (update: WebSocketCaseUpdate) => {
      console.log("[WebSocket] Received case update:", update);
      this.emit("case_update", update);
    });

    // Handle deadline alerts
    this.socket.on("deadline_alert", (alert: WebSocketDeadlineAlert) => {
      console.log("[WebSocket] Received deadline alert:", alert);
      this.emit("deadline_alert", alert);
    });

    // Handle disconnection
    this.socket.on("disconnect", (reason) => {
      console.log("[WebSocket] Disconnected:", reason);
      this.emit("disconnected", reason);
    });

    // Handle reconnection attempts
    this.socket.on("reconnect_attempt", () => {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnection attempt ${this.reconnectAttempts}`);
      this.emit("reconnecting", this.reconnectAttempts);
    });

    // Handle reconnection
    this.socket.on("reconnect", () => {
      console.log("[WebSocket] Reconnected");
      this.reconnectAttempts = 0;
      this.emit("reconnected", null);
    });
  }

  /**
   * Register event listener
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unregister event listener
   */
  public off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in listener for event ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    userId: number | null;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
    };
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
      this.listeners.clear();
      console.log("[WebSocket] Disconnected");
    }
  }

  /**
   * Manually reconnect
   */
  public reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
