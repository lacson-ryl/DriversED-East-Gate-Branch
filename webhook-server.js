// webhook-server.js
import express from "express";
import dotenv from "dotenv";
import { exec } from "child_process";

dotenv.config();

const app = express();
const PORT = process.env.WEBHOOK_PORT || 9000;

// Middleware to verify GitHub signature
function verifyGitHubSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return res.status(401).send('No signature');

  const hmac = crypto.createHmac('sha256', githubSecret);
  hmac.update(req.body); // req.body is a Buffer
  const digest = `sha256=${hmac.digest('hex')}`;

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return res.status(403).send('Invalid signature');
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
      console.log("GitHub webhook push received:", req.body);
      exec(
        `
        git pull origin main
        docker-compose --env-file .env.production up -d
        `,
        (err, stdout, stderr) => {
          if (err) {
            console.error("Git pull failed:", stderr);
            return res.status(500).send("Git pull failed");
          }
          console.log("Git pull output:", stdout);
          res.status(200).send("Update fetched");
        }
      );
    } else {
      console.log("Unhandled GitHub event:", event);
      res.status(400).send("Unhandled event");
    }
  }
);

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
