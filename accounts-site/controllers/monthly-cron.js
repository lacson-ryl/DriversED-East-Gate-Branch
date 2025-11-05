import cron from "node-cron";
import { calculateAndInsertMonthlyPayroll } from "../config/b-database";

console.log("Running monthly cron at", new Date().toISOString());

cron.schedule("0 0 1 * *", async () => {
  console.log("Running Monthly Payroll Cron Job...");
  try {
    await calculateAndInsertMonthlyPayroll();
    console.log("Monthly Payroll Data Inserted Successfully");
  } catch (error) {
    console.error("Error Running Monthly Payroll Cron Job:", error.message);
  }
});
