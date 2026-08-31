import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { notifCount } from "../config/b-database.js";

const clients = new Map();

export function initNotifSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws, req) => {
    try {
      const cookieHeader = req.headers.cookie || "";

      const tokenCookie = cookieHeader
        .split(";")
        .find((c) => c.trim().startsWith("jwtToken="));

      if (!tokenCookie) {
        console.log("WS rejected: no jwtToken cookie");
        ws.close(1008, "Unauthorized");
        return;
      }

      const token = tokenCookie.split("=")[1];
      const user = jwt.verify(token, process.env.secret_key);

      const key = `${user.userId}:${user.role}`;
      ws.chatTickets = new Set();
      ws.chatUser = user;
      clients.set(key, ws);

      const count = await notifCount(user.userId, user.role);
      console.log('count', count);

      ws.send(
        JSON.stringify({
          type: "notif",
          unread_count: count,
        }),
      );

      ws.on("message", (raw) => {
        let event;
        try {
          event = JSON.parse(raw.toString());
        } catch {
          return;
        }
        if (
          event.type === "subscribe_chat" &&
          Number.isInteger(Number(event.ticketId)) &&
          Number(event.ticketId) > 0
        ) {
          ws.chatTickets.add(Number(event.ticketId));
        }
      });
      ws.on("close", () => clients.delete(key));
    } catch (err) {
      console.error("WS auth failed:", err.message);
      ws.close(1008, "Unauthorized");
    }
  });
}

export function pushUnreadCount(userId, role, count) {
  const key = `${userId}:${role}`;
  const clientWs = clients.get(key);
  if (clientWs && clientWs.readyState === clientWs.OPEN) {
    clientWs.send(JSON.stringify({ type: "notif", unread_count: count }));
  }
}

export function pushChatMessage(ticket, message) {
  for (const clientWs of clients.values()) {
    const isAdmin = clientWs.chatUser.role === "admin";
    const ownsTicket = Number(clientWs.chatUser.userId) === Number(ticket.createdBy);
    if (
      clientWs.chatTickets.has(Number(ticket.id)) &&
      (isAdmin || ownsTicket) &&
      clientWs.readyState === clientWs.OPEN
    ) {
      clientWs.send(
        JSON.stringify({ type: "chat", ticketId: ticket.id, message }),
      );
    }
  }
}
