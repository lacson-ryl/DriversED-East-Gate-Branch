// webhook-server.js
import express from "express";
import dotenv from "dotenv";
import http from "http";
import { createHmac, timingSafeEqual } from "node:crypto";

dotenv.config();

const app = express();
const PORT = process.env.WEBHOOK_PORT || 9000;
const githubSecret = process.env.GITHUB_SECRET;
const execSecret = process.env.EXEC_SECRET;

// Middleware to verify GitHub signature
function verifyGitHubSignature(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return res.status(401).send("No signature");

  const hmac = createHmac("sha256", githubSecret);
  hmac.update(req.body); // req.body is a Buffer
  const digest = `sha256=${hmac.digest("hex")}`;

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return res.status(403).send("Invalid signature");
  }

  next();
}

app.post(
  "/github-webhook",
  express.raw({ type: "application/json" }),
  verifyGitHubSignature,
  (req, res) => {
    const event = req.headers["x-github-event"];

    if (event === "ping") {
      console.log("GitHub webhook ping received");
      return res.status(200).send("pong");
    }

    if (event === "push") {
      const trigger = http.request(
        {
          hostname: "localhost",
          port: 8000,
          path: "/trigger-rebuild",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-exec-secret": execSecret,
          },
        },
        (triggerRes) => {
          console.log(`Rebuild trigger response: ${triggerRes.statusCode}`);
          res.status(200).send("Push received, rebuild triggered");
        }
      );

      trigger.on("error", (err) => {
        console.error("Failed to trigger rebuild:", err);
        res.status(500).send("Trigger failed");
      });

      trigger.end();
    } else {
      console.log("Unhandled GitHub event:", event);
      res.status(400).send("Unhandled event");
    }
  }
);

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
