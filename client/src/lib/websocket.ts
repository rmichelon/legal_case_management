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
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;
  private connectionTimeout: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket connection
   */
  public connect(userId: number, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        console.log("[WebSocket] Already connected");
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log("[WebSocket] Connection already in progress");
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

      try {
        // Use current origin for WebSocket connection
        const socketUrl = window.location.origin;
        console.log("[WebSocket] Attempting connection to:", socketUrl);

        this.socket = io(socketUrl, {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: this.maxReconnectAttempts,
          auth: {
            token,
            userId,
          },
          autoConnect: true,
          forceNew: false,
        });

        this.setupEventHandlers();

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (!this.socket?.connected) {
            console.error("[WebSocket] Connection timeout");
            this.isConnecting = false;
            this.socket?.disconnect();
            reject(new Error("WebSocket connection timeout"));
          }
        }, 15000);

        this.socket.on("connect", () => {
          console.log("[WebSocket] Connected successfully");
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 2000;

          // Authenticate with server
          this.socket!.emit("authenticate", { userId, token });
          resolve();
        });

        this.socket.on("connect_error", (error: any) => {
          console.error("[WebSocket] Connection error:", error);
          if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
          this.isConnecting = false;
          reject(error);
        });

        this.socket.on("error", (error: any) => {
          console.error("[WebSocket] Socket error:", error);
        });
      } catch (error) {
        console.error("[WebSocket] Failed to initialize:", error);
        this.isConnecting = false;
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        reject(error);
      }
    });
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("authenticated", (data) => {
      console.log("[WebSocket] Authenticated:", data);
      this.emit("authenticated", data);
    });

    this.socket.on("notification", (notification: WebSocketNotification) => {
      console.log("[WebSocket] Received notification:", notification);
      this.emit("notification", notification);
    });

    this.socket.on("case_update", (update: WebSocketCaseUpdate) => {
      console.log("[WebSocket] Received case update:", update);
      this.emit("case_update", update);
    });

    this.socket.on("deadline_alert", (alert: WebSocketDeadlineAlert) => {
      console.log("[WebSocket] Received deadline alert:", alert);
      this.emit("deadline_alert", alert);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("[WebSocket] Disconnected:", reason);
      this.emit("disconnected", reason);
    });

    this.socket.on("reconnect_attempt", () => {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnection attempt ${this.reconnectAttempts}`);
      this.emit("reconnecting", this.reconnectAttempts);
    });

    this.socket.on("reconnect", () => {
      console.log("[WebSocket] Reconnected");
      this.reconnectAttempts = 0;
      this.emit("reconnected", null);
    });

    this.socket.on("connect_error", (error: any) => {
      console.error("[WebSocket] Connect error:", error);
      this.emit("error", error);
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
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
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
      console.log("[WebSocket] Manually reconnecting");
      this.socket.connect();
    }
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
