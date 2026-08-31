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
      clients.set(key, ws);

      const count = await notifCount(user.userId, user.role);
      console.log('count', count);

      ws.send(
        JSON.stringify({
          type: "init",
          unread_count: count,
        }),
      );

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
    clientWs.send(JSON.stringify({ unread_count: count }));
  }
}
