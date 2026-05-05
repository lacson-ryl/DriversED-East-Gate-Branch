import ExcelJS from "exceljs";

export async function generateAuditExcel(paymentSummary, instructorSummary, expenseSummary, auditSummary) {
  const workbook = new ExcelJS.Workbook();

  // === Sheet 1: User Payments ===
  const paymentsSheet = workbook.addWorksheet("User Payments");
  paymentsSheet.columns = [
    { header: "Payment ID", key: "user_payment_id", width: 10 },
    { header: "User ID", key: "user_id", width: 10 },
    { header: "Account Name", key: "account_name", width: 20 },
    { header: "Course ID", key: "course_id", width: 10 },
    { header: "Payment Method", key: "payment_method", width: 15 },
    { header: "Amount", key: "amount", width: 10 },
    { header: "Status", key: "status", width: 15 },
    { header: "Date Created", key: "date_created", width: 15 },
  ];
  paymentSummary.forEach(row => paymentsSheet.addRow(row));

  // === Sheet 2: Vehicle Expenses ===
  const expensesSheet = workbook.addWorksheet("Vehicle Expenses");
  expensesSheet.columns = [
    { header: "Repair ID", key: "repair_id", width: 10 },
    { header: "Vehicle ID", key: "vehicle_id", width: 10 },
    { header: "Repair Date", key: "repair_date", width: 15 },
    { header: "Mechanic Name", key: "mechanic_name", width: 20 },
    { header: "Cost", key: "cost", width: 15 },
    { header: "Status", key: "status", width: 15 },
  ];
  expenseSummary.forEach(row => expensesSheet.addRow(row));

  // === Sheet 3: Instructor Payroll ===
  const instructorSheet = workbook.addWorksheet("Instructor Payroll");
  instructorSheet.columns = [
    { header: "Payroll ID", key: "payroll_id", width: 10 },
    { header: "Instructor ID", key: "instructor_id", width: 10 },
    { header: "Rate/Hour", key: "rate_per_hour", width: 10 },
    { header: "Month-Year", key: "month_year", width: 15 },
    { header: "Hours", key: "attended_hours", width: 10 },
    { header: "Gross Income", key: "gross_income", width: 15 },
    { header: "Benefits", key: "benefits", width: 15 },
    { header: "Net Income", key: "net_income", width: 15 },
    { header: "Paid?", key: "isPaid", width: 10 },
  ];
  instructorSummary.forEach(row => instructorSheet.addRow(row));

  // === Sheet 4: Audit Summary ===
  const auditSheet = workbook.addWorksheet("Audit Summary");
  auditSheet.columns = [
    { header: "Month-Year", key: "month_year", width: 15 },
    { header: "Total User Payments", key: "total_user_payments", width: 20 },
    { header: "Total Payroll", key: "total_payroll", width: 20 },
    { header: "Vehicle Expenses", key: "vehicle_expenses", width: 20 },
    { header: "Net Profit", key: "net_profit", width: 20 },
  ];
  auditSummary.forEach(row => auditSheet.addRow(row));

  return workbook;
}
