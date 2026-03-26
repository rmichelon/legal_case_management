import { useEffect, useState, useCallback } from "react";
import { wsClient } from "@/lib/websocket";
import { useAuth } from "@/_core/hooks/useAuth";

interface WebSocketNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  actionUrl?: string;
  receivedAt: Date;
}

interface WebSocketStatus {
  connected: boolean;
  reconnectAttempts: number;
}

/**
 * Hook to use WebSocket in React components
 */
export function useWebSocket() {
  const { user, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    reconnectAttempts: 0,
  });
  const [lastNotification, setLastNotification] = useState<WebSocketNotification | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user || isInitialized) {
      return;
    }

    const initializeWebSocket = async () => {
      try {
        // Get JWT token from localStorage or cookie
        const token = localStorage.getItem("auth_token") || "";

        await wsClient.connect(user.id, token);
        setIsInitialized(true);

        // Setup event listeners
        wsClient.on("authenticated", () => {
          console.log("[useWebSocket] Authenticated");
          updateStatus();
        });

        wsClient.on("notification", (notification: WebSocketNotification) => {
          console.log("[useWebSocket] Received notification:", notification);
          setLastNotification(notification);
          updateStatus();
        });

        wsClient.on("disconnected", (reason: string) => {
          console.log("[useWebSocket] Disconnected:", reason);
          updateStatus();
        });

        wsClient.on("reconnecting", (attempts: number) => {
          console.log("[useWebSocket] Reconnecting attempt:", attempts);
          updateStatus();
        });

        wsClient.on("reconnected", () => {
          console.log("[useWebSocket] Reconnected");
          updateStatus();
        });

        updateStatus();
      } catch (error) {
        console.error("[useWebSocket] Failed to initialize:", error);
      }
    };

    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount, keep connection alive
      // wsClient.disconnect();
    };
  }, [isAuthenticated, user, isInitialized]);

  // Update status
  const updateStatus = useCallback(() => {
    const wsStatus = wsClient.getStatus();
    setStatus({
      connected: wsStatus.connected,
      reconnectAttempts: wsStatus.reconnectAttempts,
    });
  }, []);

  // Register event listener
  const on = useCallback((event: string, callback: Function) => {
    wsClient.on(event, callback);
  }, []);

  // Unregister event listener
  const off = useCallback((event: string, callback: Function) => {
    wsClient.off(event, callback);
  }, []);

  // Manually reconnect
  const reconnect = useCallback(() => {
    wsClient.reconnect();
  }, []);

  return {
    status,
    lastNotification,
    on,
    off,
    reconnect,
    isInitialized,
  };
}
