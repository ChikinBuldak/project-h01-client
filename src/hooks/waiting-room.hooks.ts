import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ServerMessageSchema } from "@/types/room-manager.types";

const WS_URL = import.meta.env.VITE_WAITING_ROOM_URL || "ws://127.0.0.1:3001/.proxy/api/activity/ws";

export function useWaitingRoomSocket(auth: any, roomId: string) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify(auth));
    };

    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      const message = ServerMessageSchema.safeParse(parsed);
      if (!message.success) {
        console.error("Invalid WS message", message.error);
        return;
      }

      const data = message.data;

      switch (data.type) {
        case "room_state":
          queryClient.setQueryData(["waiting-room", roomId], data);
          break;
        case "error":
          queryClient.setQueryData(["waiting-room-error", roomId], data.message);
          break;
      }
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [auth, roomId, queryClient]);

  // React Query will manage the cache
  return useQuery({
    queryKey: ["waiting-room", roomId],
    queryFn: async () => null, // no fetch; this is live data
    initialData: null,
  });
}