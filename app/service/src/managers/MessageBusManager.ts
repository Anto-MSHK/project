import { WebSocketServer, WebSocket } from "ws";
import { Server, IncomingMessage } from "http";
import { URL } from "url";

/**
 * A connection belonging to a single logical "room" (identified by moduleId).
 */
export interface WizeConnection {
  /** underlying WebSocket */
  ws: WebSocket;
  /** logical room / module identifier */
  moduleId: string;
  /** optional panel id (“left” | “right”) – can be used by the client for UI logic */
  panel: "left" | "right" | string;
  /** timestamp when the socket connected */
  connectedAt: Date;
}

/**
 * MessageBusManager is a tiny wrapper around a WebSocketServer that simply
 * forwards every message it receives from one client to all the other clients
 * that share the same moduleId. No persistence, no business logic – pure
 * transport layer.
 */
export class MessageBusManager {
  private wss: WebSocketServer;
  /** moduleId -> set of active connections */
  private rooms: Map<string, Set<WizeConnection>> = new Map();

  constructor(server: Server, path = "/ws") {
    this.wss = new WebSocketServer({ server, path });
    this.wss.on("connection", (ws, req) => this.handleConnection(ws, req));
    console.log(`WebSocket server initialised on path ${path}`);
  }

  /** handle a freshly opened WebSocket */
  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    try {
      const url = new URL(request.url ?? "", "http://localhost");
      const moduleId = url.searchParams.get("moduleId");
      const panel = (url.searchParams.get("panel") ?? "unknown") as
        | "left"
        | "right"
        | string;

      if (!moduleId) {
        ws.close(1008, "Missing moduleId query parameter");
        return;
      }

      const ctx: WizeConnection = {
        ws,
        moduleId,
        panel,
        connectedAt: new Date(),
      };

      this.addToRoom(ctx);
      console.log(`WS connected: module=${moduleId}, panel=${panel}`);

      ws.on("message", (data) => this.forward(ctx, data));
      ws.on("close", (code, reason) => {
        this.removeFromRoom(ctx);
        console.log(
          `WS closed: module=${moduleId}, panel=${panel}, code=${code}, reason=${reason.toString()}`
        );
      });
      ws.on("error", (err) => {
        console.error(`WS error (${moduleId}/${panel}):`, err);
      });

      // optional welcome message
      this.safeSend(ws, JSON.stringify({ type: "connection_established" }));
    } catch (err) {
      console.error("Failed to establish WS connection:", err);
      ws.close(1011, "Internal error");
    }
  }

  /** register connection in the appropriate room */
  private addToRoom(ctx: WizeConnection) {
    if (!this.rooms.has(ctx.moduleId)) {
      this.rooms.set(ctx.moduleId, new Set());
    }
    this.rooms.get(ctx.moduleId)!.add(ctx);
  }

  /** remove connection, deleting empty rooms */
  private removeFromRoom(ctx: WizeConnection) {
    const room = this.rooms.get(ctx.moduleId);
    if (!room) return;
    room.delete(ctx);
    if (room.size === 0) this.rooms.delete(ctx.moduleId);
  }

  /** forward raw payload to every socket in the room except the sender */
  private forward(sender: WizeConnection, payload: WebSocket.RawData) {
    const room = this.rooms.get(sender.moduleId);
    if (!room) return;
    room.forEach((ctx) => {
      if (ctx === sender) return; // skip echo; remove this line to echo back
      this.safeSend(ctx.ws, payload);
    });
  }

  /** helper to send only when socket is OPEN */
  private safeSend(ws: WebSocket, payload: WebSocket.RawData) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }

  /** public stats endpoint */
  getConnectionStats() {
    const moduleStats: Record<string, { total: number }> = {};
    this.rooms.forEach((set, moduleId) => {
      moduleStats[moduleId] = { total: set.size };
    });

    return {
      totalModules: this.rooms.size,
      totalConnections: Array.from(this.rooms.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
      moduleStats,
    };
  }

  /** close all sockets and the underlying WSS */
  close() {
    console.log("Shutting down WebSocket server...");
    this.rooms.forEach((set) => {
      set.forEach((ctx) => {
        if (ctx.ws.readyState === WebSocket.OPEN) {
          ctx.ws.close(1001, "Server shutting down");
        }
      });
    });
    this.rooms.clear();
    this.wss.close();
  }
}
