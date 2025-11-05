import cron from "node-cron";
import { clearKeyStorage } from "../config/b-database";

console.log("Running daily cron at", new Date().toISOString());

console.log("Running Clearing key storage Cron Job...");
cron.schedule("0 0 * * *", async () => {
  try {
      console.log("Key Storage cleared successfully");
      await clearKeyStorage();
  } catch (error) {
    console.error("Error Running Monthly Payroll Cron Job:", error.message);
  }
});
