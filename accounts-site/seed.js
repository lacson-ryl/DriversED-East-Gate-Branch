// seed.js
import mysql from "mysql2";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config({ path: ".env.production" });

async function seedAdmin() {
  const connection = mysql
    .createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    })
    .promise();

  const name = "rainiel lacson";
  const email = "lacsonryl@gmail.com";
  const password =
    "$2b$10$jOATnTHfIpwDxp/K4h/6EuqXuGLMkt54US.5y7VQik3DzAR9QWioi";
  const role = "admin";

  try {
    const [rows] = await connection.execute(
      "INSERT INTO admin_account (admin_name, user_email, user_password, account_role, isVerify) VALUES (?, ?, ?, ?, ?)",
      [name, email, password, role, 1]
    );
    console.log("✅ Admin user seeded:", rows);
  } catch (err) {
    console.error("❌ Error seeding admin user:", err.message);
  } finally {
    await connection.end();
  }
}

seedAdmin();
