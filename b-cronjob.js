import cron from "node-cron";
import {
  calculateAndInsertWeeklyPayroll,
  calculateAndInsertMonthlyPayroll,
} from "./b-database";

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

cron.schedule("0 0 1 * *", async () => {
  console.log("Running Monthly Payroll Cron Job...");
  try {
    await calculateAndInsertMonthlyPayroll();
    console.log("Monthly Payroll Data Inserted Successfully");
  } catch (error) {
    console.error("Error Running Monthly Payroll Cron Job:", error.message);
  }
});