import cron from "node-cron";
import { calculateAndInsertWeeklyPayroll } from "../config/b-database";

console.log("Running weekly cron at", new Date().toISOString());

// Weekly Payroll Cron Job (Runs every Sunday at midnight)
cron.schedule("0 0 * * 0", async () => {
  console.log("Running Weekly Payroll Cron Job...");
  try {
    await calculateAndInsertWeeklyPayroll();
    console.log("Weekly Payroll Data Inserted Successfully");
  } catch (error) {
    console.error("Error Running Weekly Payroll Cron Job:", error.message);
  }
});
