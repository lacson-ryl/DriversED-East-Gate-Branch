// notifStream.js
const clients = new Map(); // key: `${userId}:${role}` -> res

export function registerStream(userId, role, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const key = `${userId}:${role}`;
  clients.set(key, res);

  // Heartbeat every 15 seconds
  const interval = setInterval(() => {
    res.write(`: keep-alive\n\n`);
  }, 15000);

  res.on("close", () => {
    clearInterval(interval);
    clients.delete(key);
  });
}


export function pushUnreadCount(userId, role, count) {
  const key = `${userId}:${role}`;
  const clientRes = clients.get(key);
  if (clientRes) {
    clientRes.write(`data: ${JSON.stringify({ unread_count: count })}\n\n`);
  }
}

