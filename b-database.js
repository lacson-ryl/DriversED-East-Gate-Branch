import mysql from "mysql2";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
dotenv.config();

export const pool = mysql
  .createPool({
    host: process.env.mysql_HOST,
    user: process.env.mysql_USER,
    password: process.env.mysql_PASSWORD,
    database: process.env.mysql_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

// Function to format dates
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function addPrivKeyForUser(
  userId,
  role,
  privKey,
  iv,
  pubKeyWebCrypto
) {
  try {
    const query = `
    INSERT INTO user_keys (user_id, user_role, enc_priv_key, priv_key_iv, pub_key_web_crypto )
    VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      userId,
      role,
      privKey,
      iv,
      pubKeyWebCrypto,
    ]);
    return result[0]; //return the latest one
  } catch (error) {
    console.error("Failed to add private key", error);
    throw error;
  }
}

export async function getPrivKeyWithUserId(userId, role) {
  try {
    const query = `
     SELECT enc_priv_key AS encrypted, priv_key_iv AS iv, pub_key_web_crypto AS pubKeyWebCrypto
     FROM user_keys 
     WHERE user_id = ? AND user_role = ?
     ORDER BY date_created DESC 
     LIMIT 1
    `;
    const [result] = await pool.query(query, [userId, role]);
    return result[0]; //return the latest one
  } catch (error) {
    console.error("Cant get private key right now!", error);
    throw error;
  }
}

export async function clearKeyStorage() {
  try {
    const query = `
    DELETE *
    FROM user_keys
    `;
    const [result] = await pool.query(query);
    return result; //return the latest one
  } catch (error) {
    console.error("Cant get private key right now!", error);
    throw error;
  }
}

// for change email and password
export async function findAccountByEmail(email) {
  try {
    const query = `
      SELECT 
          user_id AS id, 
          user_email AS email, 
          user_password AS password, 
          user_role AS role,
          isVerify AS isVerified 
      FROM 
          user 
      WHERE 
          user_email = ?
      UNION
      SELECT 
          account_id AS id, 
          user_email AS email, 
          user_password AS password, 
          account_role AS role,
          isVerify AS isVerified 
      FROM 
          admin_account 
      WHERE 
          user_email = ?;
    `;

    const [rows] = await pool.query(query, [email, email]);
    return rows; // Return the first matching result
  } catch (error) {
    console.error("Error finding account by email:", error);
    throw error;
  }
}

export async function changeEmailOrPassword(email, password, id, role) {
  try {
    if (!email && !password) {
      throw new Error("Email or password must be provided");
    }

    const columnMap = {
      email: "user_email",
      password: "user_password",
    };

    const tableMap = {
      admin: "admin_account",
      instructor: "admin_account",
      user: "user",
    };

    const column = email ? columnMap["email"] : columnMap["password"];
    const value = email || password;
    const table = tableMap[role];

    if (!table) {
      return "Your Role is not accepted in the database";
    }

    const query = `
      UPDATE ${table}
      SET ${column} = ?
      WHERE ${role === "user" ? "user_id" : "account_id"} = ?
    `;

    const [result] = await pool.query(query, [value, id]);
    return result;
  } catch (error) {
    console.error("Error changing email or password:", error);
    throw error;
  }
}

//user checking email;
export async function checkEmail(email) {
  try {
    const [rows] = await pool.query(
      `
      SELECT * 
      FROM user 
      WHERE user_email = ?
      `,
      [email]
    );

    return rows[0];
  } catch (error) {
    console.error("Error checking email:", error);
    throw error;
  }
}

//admin checking email

export async function adminCheckEmail(email) {
  try {
    const [rows] = await pool.query(
      `
      SELECT * 
      FROM admin_account 
      WHERE user_email = ?
      `,
      [email]
    );
    return rows[0];
  } catch (error) {
    console.error("Error checking email:", error);
    throw error;
  }
}

export async function saveUser(newUser) {
  const { name, email, password, isVerify } = newUser;
  const verify = !isVerify ? false : true;
  try {
    const [result] = await pool.query(
      `
      INSERT INTO user (user_name, user_email, user_password, isVerify)
      VALUES (?, ?, ?, ?)
      `,
      [name, email, password, verify]
    );
    return result.insertId;
  } catch (error) {
    throw error;
  }
}

export async function getAdminAccountById(id) {
  const query = `SELECT * FROM admin_account WHERE account_id = ?`;
  try {
    const [result] = await pool.query(query, [id]);
    return result[0]; // Return the first result
  } catch (error) {
    console.error("Cant get user right now.", error);
    throw error;
  }
}

export async function getUserAccountById(id) {
  const query = `SELECT * FROM user WHERE user_id = ?`;
  try {
    const [result] = await pool.query(query, [id]);
    return result[0]; // Return the first result
  } catch (error) {
    console.error("Cant get user right now.", error);
    throw error;
  }
}

export async function saveAdminAccount(newUser) {
  const { name, email, password, account_role, isVerify } = newUser;
  try {
    const [result] = await pool.query(
      `
      INSERT INTO admin_account ( user_email, user_password, account_role, admin_name, isVerify)
      VALUES (?, ?, ?, ?, ?)
      `,
      [email, password, account_role, name, isVerify]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error saving user: ", error);
    throw error;
  }
}

export async function findAccountForChangingPassOrEmail(email) {
  try {
    const query = `
      SELECT 
          user.user_id AS id,
          user.user_name AS name, 
          user.user_email AS email, 
          user.date_created AS date_created,
          user.user_role AS account_role,
          user_profile.profile_picture AS profile_picture
      FROM 
          user 
      LEFT JOIN 
          user_profile ON user.user_id = user_profile.user_id
      WHERE 
          user.user_email = ?
      UNION
      SELECT 
          admin_account.account_id AS id,
          admin_account.admin_name AS name, 
          admin_account.user_email AS email, 
          admin_account.date_created AS date_created,
          admin_account.account_role AS account_role,
          instructor.instructor_profile_picture AS profile_picture
      FROM 
          admin_account 
      LEFT JOIN 
          instructor ON admin_account.account_id = instructor.account_id
      WHERE 
          admin_account.user_email = ?
    `;

    const [rows] = await pool.query(query, [email, email]);
    return rows[0]; // Return all matching rows
  } catch (error) {
    console.error("Error finding account by email:", error);
    throw error;
  }
}

export async function findAccountByPRN(prn) {
  const query = `
    SELECT 
      user.user_id AS id,
      user.user_name AS name,
      user.user_email AS email,
      user.date_created AS date_created,
      user.user_role AS account_role,
      user_profile.profile_picture AS profile_picture
    FROM 
      user
    LEFT JOIN 
      user_profile ON user.user_id = user_profile.user_id
    WHERE 
      user_profile.prn = ?
    UNION
    SELECT 
      admin_account.account_id AS id,
      admin_account.admin_name AS name,
      admin_account.user_email AS email,
      admin_account.date_created AS date_created,
      admin_account.account_role AS account_role,
      instructor.instructor_profile_picture AS profile_picture
    FROM 
      admin_account
    LEFT JOIN 
      instructor ON admin_account.account_id = instructor.account_id
    WHERE 
      instructor.prn = ?
  `;

  try {
    const [rows] = await pool.query(query, [prn, prn]);
    return rows[0]; // Return the first matching result
  } catch (error) {
    console.error("Error finding account by PRN:", error);
    throw error;
  }
}

export async function updateUserCredential(userId, account_role, value, type) {
  const role =
    account_role === "admin" || account_role === "instructor"
      ? "admin_account"
      : "user";
  const id = role === "user" ? "user_id" : "account_id";
  const column = type === "password" ? "user_password" : "user_email";

  const query = `UPDATE ${role} SET ${column} = ? WHERE ${id} = ?`;

  try {
    await pool.query(query, [value, userId]);
    console.log(
      `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } updated for user ID: ${userId}`
    );
  } catch (error) {
    console.error(`Error updating ${type} in database:`, error);
    throw error;
  }
}

export async function saveChangePasswordRequest(
  userId,
  userType,
  otp,
  resetType
) {
  const query = `
    INSERT INTO change_password_or_email (user_id, user_type, reset_code, reset_type)
    VALUES (?, ?, ?, ?)
  `;

  const values = [userId, userType, otp, resetType];

  try {
    const [result] = await pool.query(query, values);
    return result;
  } catch (error) {
    console.error("Error saving change password/email request:", error);
    throw error;
  }
}

export async function verifyOtp(userId, otp, resetType) {
  const query = `
    SELECT * FROM change_password_or_email
    WHERE user_id = ? AND reset_type = ? AND TIMESTAMPDIFF(MINUTE, date_created, NOW()) <= 20
    ORDER BY date_created DESC
    LIMIT 1
  `;

  const values = [userId, resetType];

  try {
    const [rows] = await pool.query(query, values);
    if (rows.length === 0) {
      return false; // No matching OTP found or OTP expired
    }
    const hashedOtp = rows[0].reset_code;

    // Compare the plain OTP with the hashed OTP
    const isMatch = await bcrypt.compare(otp, hashedOtp);
    return isMatch;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
}

export async function uploadProfile(
  firstName,
  middleName,
  lastName,
  phoneNumber,
  email,
  birthDate,
  nationality,
  gender,
  civilStatus,
  address,
  ltoClientId,
  trainingPurpose,
  profilePicture,
  userId
) {
  const [result] = await pool.query(
    `
    INSERT INTO user_profile (
            first_name, last_name, middle_name, phone_number, lto_client_id, email, birth_date, nationality, gender, address, civil_status, training_purpose,
            profile_picture, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      firstName,
      lastName,
      middleName,
      phoneNumber,
      ltoClientId,
      email,
      birthDate,
      nationality,
      gender,
      address,
      civilStatus,
      trainingPurpose,
      profilePicture,
      userId,
    ]
  );
  return result.insertId;
}

export async function getProfilewithUserId(id) {
  try {
    const [result] = await pool.query(
      `
       SELECT *
       FROM user_profile
       WHERE user_id = ?
      `,
      [id]
    );
    const formattedResult = result.map((row) => ({
      ...row,
      birth_date: formatDate(row.birth_date),
    }));
    return formattedResult[0];
  } catch (error) {
    console.error("Cant access database now!");
    throw error;
  }
}

export async function updateUserProfile(userID, updatedProfile) {
  const setClause = Object.keys(updatedProfile)
    .map((field) => `${field} = ?`)
    .join(", ");
  const values = Object.values(updatedProfile);
  values.push(userID);
  const [result] = await pool.query(
    `UPDATE user_profile 
    SET ${setClause} 
    WHERE user_id = ?`,
    values
  );
  return result;
}

// get the day and the total amount each day
export async function getDayplusTP(month, year) {
  const [result] = await pool.query(
    `
  SELECT currDay, totalApplicants
  FROM monthly_applicants
  WHERE currMonth = ? AND currYear = ?
  `,
    [month, year]
  );
  // Format currDay to extract the day number only
  const formattedResult = result.map((entry) => ({
    ...entry,
    currDay: new Date(entry.currDay).getDate(),
  }));

  return formattedResult;
}

export async function getAllPaymentMethods() {
  const query = `SELECT * FROM payment_methods`;
  try {
    const [result] = await pool.query(query);
    return result;
  } catch (error) {
    console.error("Error adding payment method:", error);
    throw error;
  }
}

// Add Payment Method
export async function addPaymentMethod(
  methodName,
  availability,
  methodFile,
  methodFileType
) {
  const query = `
    INSERT INTO payment_methods (method_name, availablity, method_file, method_file_type)
    VALUES (?, ?, ?, ?)
  `;
  try {
    await pool.query(query, [
      methodName,
      availability,
      methodFile,
      methodFileType,
    ]);
  } catch (error) {
    console.error("Error adding payment method:", error);
    throw error;
  }
}

// Edit Payment Method
export async function editPaymentMethod(methodId, methodName, availability) {
  const query = `
    UPDATE payment_methods
    SET method_name = ?, availablity = ?
    WHERE method_id = ?
  `;
  try {
    await pool.query(query, [methodName, availability, methodId]);
  } catch (error) {
    console.error("Error editing payment method:", error);
    throw error;
  }
}

// Upload Payment Method File
export async function uploadPaymentMethodFile(
  methodId,
  methodFile,
  methodFileType
) {
  const query = `
    UPDATE payment_methods
    SET method_file = ?, method_file_type = ?
    WHERE method_id = ?
  `;
  try {
    await pool.query(query, [methodFile, methodFileType, methodId]);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// Delete Payment Method
export async function deletePaymentMethod(methodId) {
  const query = `
    DELETE FROM payment_methods
    WHERE method_id = ?
  `;
  try {
    await pool.query(query, [methodId]);
  } catch (error) {
    console.error("Error deleting method:", error);
    throw error;
  }
}

// Function to get the schedule of each instructor for the current day
export async function getInstructorScheduleForToday() {
  const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format

  const query = `
    SELECT 
      i.instructor_id,
      i.instructor_name,
      a.date,
      a.am_available,
      a.pm_available,
      a.onsite_slots,
      am_applicant.user_name AS am_applicant_name,
      pm_applicant.user_name AS pm_applicant_name
    FROM 
      instructor i
    LEFT JOIN 
      availability a ON i.instructor_id = a.instructor_id AND a.date = ?
    LEFT JOIN 
      applications am_app ON i.instructor_id = am_app.instructor_id AND am_app.start_date = a.date AND am_app.start_date_am_pm = 'AM'
    LEFT JOIN 
      user am_applicant ON am_app.creator_id = am_applicant.user_id AND am_app.created_by = 'user'
    LEFT JOIN 
      applications pm_app ON i.instructor_id = pm_app.instructor_id AND pm_app.start_date = a.date AND pm_app.start_date_am_pm = 'PM'
    LEFT JOIN 
      user pm_applicant ON pm_app.creator_id = pm_applicant.user_id AND pm_app.created_by = 'user'
  `;

  try {
    const [result] = await pool.query(query, [today]);
    const formattedResult = result.map((row) => ({
      ...row,
      date: row.date ? formatDate(row.date) : null,
    }));
    return formattedResult;
  } catch (error) {
    console.error("Error fetching instructor schedule for today", error);
    throw error;
  }
}

export async function getApplicants() {
  try {
    const [result] = await pool.query(
      `
      SELECT
        applications.application_id,
        instructor.instructor_name,
        CASE
        WHEN applications.created_by = 'user' THEN user.user_name
        WHEN applications.created_by = 'admin' THEN admin_account.admin_name
        ELSE 'Unknown'
        END AS creator_name,
        applications.created_by,
        applications.start_date,
        applications.start_date_am_pm,
        applications.continuation,
        applications.continuation_am_pm,
        applications.transmission,
        applications.created
      FROM
        applications
      JOIN
        instructor ON applications.instructor_id = instructor.instructor_id
      LEFT JOIN
        user ON applications.creator_id = user.user_id AND applications.created_by = 'user'
      LEFT JOIN
        admin_account ON applications.creator_id = admin_account.account_id AND applications.created_by = 'admin';
      `
    );

    const formattedResult = result.map((row) => ({
      ...row,
      start_date: formatDate(row.start_date),
      continuation: formatDate(row.continuation),
      created: formatDate(row.created),
    }));

    return formattedResult;
  } catch (error) {
    console.error("Error fetching applicants list", error);
    throw error;
  }
}

export async function getApplicant(userId) {
  const query = `
    SELECT 
      applications.application_id,
      instructor.instructor_name,
      user.user_name AS creator_name,
      applications.start_date,
      applications.start_date_am_pm,
      applications.continuation,
      applications.continuation_am_pm,
      applications.transmission,
      applications.created
    FROM
      applications
    JOIN
      instructor ON applications.instructor_id = instructor.instructor_id
    LEFT JOIN
      user ON applications.creator_id = user.user_id AND applications.created_by = 'user'
    WHERE
      applications.creator_id = ? AND applications.created_by = 'user'
  `;
  try {
    const [result] = await pool.query(query, [userId]);
    const formattedResult = result.map((row) => ({
      ...row,
      start_date: formatDate(row.start_date),
      continuation: formatDate(row.continuation),
      created: formatDate(row.created),
    }));
    return formattedResult.reverse();
  } catch (error) {
    console.error("Error fetching applicant details", error);
    throw error;
  }
}

async function getApplicantadmin(id) {
  const [result] = await pool.query(
    `
        SELECT *
        FROM applications
        WHERE application_id = ?
        `,
    [id]
  );
  const formattedResult = result.map((row) => ({
    ...row,
    start_date: formatDate(row.start_date),
    continuation: formatDate(row.continuation),
    created: formatDate(row.created),
  }));
  return formattedResult[0];
}

export async function deleteApplication(id) {
  try {
    // Fetch the application details before deleting
    const application = await getApplicantadmin(id);
    if (application.length === 0) {
      throw new Error("Application not found");
    }

    // Start a transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Delete the application
      await connection.query(
        `
        DELETE FROM applications
        WHERE application_id = ?
        `,
        [id]
      );

      // Update availability for startDate and continuation based on AM/PM selection
      await updateAvailability(
        application.instructor_id,
        application.start_date,
        application.start_date_am_pm === "AM" ? false : undefined,
        application.start_date_am_pm === "PM" ? false : undefined,
        undefined
      );

      await updateAvailability(
        application.instructor_id,
        application.continuation,
        application.continuation_am_pm === "AM" ? false : undefined,
        application.continuation_am_pm === "PM" ? false : undefined,
        undefined
      );

      // Delete attendance records
      await connection.query(
        `
        DELETE FROM attendance
        WHERE instructor_id = ? AND date = ? AND date_am_pm = ?
        `,
        [
          application.instructor_id,
          application.start_date,
          application.start_date_am_pm,
        ]
      );
      await connection.query(
        `
        DELETE FROM attendance
        WHERE instructor_id = ? AND date = ? AND date_am_pm = ?
        `,
        [
          application.instructor_id,
          application.continuation,
          application.continuation_am_pm,
        ]
      );

      // Update Monthly Applicants
      await updateMonthlyApplicants(connection, -1);

      // Delete from user_courses table
      await connection.query(
        `
        DELETE FROM user_courses
        WHERE user_id = ? AND date_started = ?
        `,
        [application.creator_id, application.start_date]
      );

      // Commit the transaction
      await connection.commit();
    } catch (error) {
      // Rollback the transaction in case of error
      await connection.rollback();
      console.error("Database transaction error:", error);
      throw error;
    } finally {
      // Release the connection
      connection.release();
    }

    return { message: "Application deleted successfully" };
  } catch (error) {
    console.error("Error deleting application:", error);
    throw error;
  }
}

// Function to update monthly applicants with an optional increment/decrement value
async function updateMonthlyApplicants(connection, increment = 1) {
  try {
    const currDay = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format
    const currMonth = new Date().toLocaleString("default", {
      month: "long",
    });

    await connection.query(
      `INSERT INTO monthly_applicants (currDay, currMonth, totalApplicants)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE totalApplicants = totalApplicants + ?`,
      [currDay, currMonth, increment, increment]
    );
  } catch (error) {
    console.error("Error updating monthly applicants:", error);
    throw error;
  }
}

export async function getPDC() {
  const [result] = await pool.query(
    `
    SELECT COUNT(*) as pdcCount
    FROM new_applicants
    WHERE course = "pdc"
    `
  );
  return result[0].pdcCount;
}

export async function newUserCount() {
  const query = `
    SELECT COUNT(*) as count
    FROM user
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `;
  const [result] = await pool.query(query);
  return result[0].count;
}

export async function getAllPrograms() {
  const result = await pool.query(
    `
    SELECT *
    FROM program_offers
    `
  );
  return result[0];
}

export async function editOneProgram(
  id,
  name,
  availability,
  duration,
  fee,
  description,
  cloneId
) {
  const [result] = await pool.query(
    `
    UPDATE program_offers
    SET program_id = ?,
      program_name = ?,
      program_duration = ?,
      program_description = ?,
      program_fee = ?,
      availability = ?
    WHERE program_id = ?
    `,
    [id, name, duration, description, fee, availability, cloneId]
  );
  return result;
}

export async function addProgram(
  programName,
  status,
  programDuration,
  programFee,
  programDescription
) {
  try {
    const [result] = await pool.query(
      `
      INSERT INTO program_offers (program_name, program_duration, program_Description, program_fee, availability)
      VALUES (?, ?, ?, ?, ?)
      `,
      [programName, programDuration, programDescription, programFee, status]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error adding program", error);
    throw error;
  }
}

export async function uploadProgramCover(id, fileBuffer, fileType) {
  const query = `
    UPDATE program_offers
    SET program_cover = ?, program_cover_file_type = ?
    WHERE program_id = ?
  `;

  try {
    await pool.query(query, [fileBuffer, fileType, id]);
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
}

export async function assignPrograms(instructor_id, program_ids) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const values = program_ids.map((program_id) => [instructor_id, program_id]);
    await connection.query(
      "INSERT INTO instructor_programs (instructor_id, program_id) VALUES ?",
      [values]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getAssignedPrograms() {
  try {
    const [result] = await pool.query(
      `
      SELECT 
        instructor_programs.instructor_id,
        instructor.instructor_name,
        program_offers.program_id,
        program_offers.program_name
      FROM 
        instructor_programs
      JOIN 
        instructor ON instructor_programs.instructor_id = instructor.instructor_id
      JOIN 
        program_offers ON instructor_programs.program_id = program_offers.program_id
      `
    );
    return result;
  } catch (error) {
    console.error("Error fetching assigned programs", error);
    throw error;
  }
}

export async function unassignPrograms(instructor_id, program_ids) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      "DELETE FROM instructor_programs WHERE instructor_id = ? AND program_id IN (?)",
      [instructor_id, program_ids]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getProgramsWithInstructors() {
  const query = `
    SELECT 
      p.program_id,
      p.program_name,
      p.program_description,
      p.program_duration,
      p.program_fee,
      p.program_cover,
      p.program_cover_file_type,
      p.availability,
      i.instructor_id,
      i.instructor_name
    FROM 
      program_offers p
    LEFT JOIN 
      instructor_programs ip ON p.program_id = ip.program_id
    LEFT JOIN 
      instructor i ON ip.instructor_id = i.instructor_id
    ORDER BY 
      p.program_id;
  `;

  try {
    const [rows] = await pool.query(query);
    return rows;
  } catch (error) {
    console.error("Error fetching programs with instructors:", error);
    throw error;
  }
}

export async function deleteProgram(rowID) {
  try {
    const [result] = await pool.query(
      `
      DELETE FROM program_offers
      WHERE program_id = ?
      `,
      [rowID]
    );
    return result;
  } catch (error) {
    console.error("Error Deleting Program", error);
    throw error;
  }
}

export async function getAllCert() {
  const result = await pool.query(
    `
    SELECT *
    FROM certificates_completion
    `
  );
  return result[0];
}

export async function editOneCertificate(id, name) {
  const [result] = await pool.query(
    `
    UPDATE certificates_completion
    SET certificate_id = ?,
      certificate_name = ?
    WHERE certificate_id = ?
    `,
    [id, name, id]
  );
  return result;
}

export async function addCertificate(certificateID, certificateName) {
  try {
    const [result] = await pool.query(
      `
      INSERT INTO certificates_completion (certificate_id, certificate_name)
      VALUES (?, ?)
      `,
      [certificateID, certificateName]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error adding certificate", error);
    throw error;
  }
}

export async function uploadCertificateTemplate(id, fileBuffer, fileType) {
  const query = `
    UPDATE certificates_completion
    SET certificate_template = ?, template_file_type = ?
    WHERE certificate_id = ?
  `;

  try {
    await pool.query(query, [fileBuffer, fileType, id]);
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
}

export async function deleteCertificate(rowID) {
  try {
    const [result] = await pool.query(
      `
      DELETE FROM certificates_completion
      WHERE certificate_id = ?
      `,
      [rowID]
    );
    return result;
  } catch (error) {
    console.error("Error Deleting Certificate", error);
    throw error;
  }
}

export async function getPaymentsLogs() {
  const query = `
    SELECT 
      user_payment_id,
      CASE 
        WHEN user_id IS NULL THEN '0'
        ELSE user_id
      END AS user_id,
      CASE 
        WHEN user_id IS NULL THEN 'Admin'
        ELSE (SELECT user_name FROM user WHERE user_id = user_payments.user_id)
      END AS user_name,
      account_name,
      payment_method,
      amount,
      screenshot_receipt,
      status
    FROM user_payments
  `;
  try {
    const [result] = await pool.query(query);
    return result;
  } catch (error) {
    console.error("Error fetching payments logs", error);
    throw error;
  }
}

// Function to add payment
export async function addPayments(
  userId,
  accountName,
  amount,
  paymentMethod,
  screenshotReceipt,
  courseSelect
) {
  const query = `
    INSERT INTO user_payments (user_id, account_name, amount, payment_method, screenshot_receipt, course_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  try {
    await pool.query(query, [
      userId,
      accountName,
      amount,
      paymentMethod,
      screenshotReceipt,
      courseSelect,
    ]);
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
}

export async function uploadPhotoReceipt(id, fileBuffer) {
  const query = `
    UPDATE user_payments
    SET screenshot_receipt = ?
    WHERE user_payment_id = ?
  `;

  try {
    await pool.query(query, [fileBuffer, id]);
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
}

export async function changePaymentStatus(paymentId, status) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update the status in the user_payments table
    await connection.query(
      `UPDATE user_payments SET status = ? WHERE user_payment_id = ?`,
      [status, paymentId]
    );

    // Determine the value for isPaid based on the status
    const isPaid = status === "Verified" ? 1 : 0;

    // Update the isPaid field in the user_courses table
    await connection.query(
      `UPDATE user_courses 
       SET isPaid = ? 
       WHERE course_id = (SELECT course_id FROM user_payments WHERE user_payment_id = ?)`,
      [isPaid, paymentId]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("Error changing payment status:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function deletePaymentInfo(id) {
  try {
    const [result] = await pool.query(
      `
      DELETE FROM user_payments
      WHERE user_payment_id = ?
      `,
      [id]
    );
    return result;
  } catch (error) {
    console.error("Error Deleting Vehicle", error);
    throw error;
  }
}

//adding report of user to report table database
// user report page only
export async function addUserReport(titleReport, detailsReport, userID) {
  try {
    const [result] = await pool.query(
      `
      INSERT INTO reports_table (report_title, report_details, sender_id)
      VALUES (?, ?, ?)
      `,
      [titleReport, detailsReport, userID]
    );

    // Return the ID of the newly inserted report
    return result.insertId;
  } catch (error) {
    console.error("Error adding user report:", error);
    throw error;
  }
}

export async function getUserReport(userId) {
  try {
    const [result] = await pool.query(
      `
      SELECT
      *
      FROM 
        reports_table
      WHERE 
        reports_table.sender_id = ?
      `,
      [userId]
    );
    const formattedResult = result.map((row) => ({
      ...row,
      date_created: formatDate(row.date_created),
    }));
    return formattedResult; // Return the full result array to get all reports for the user
  } catch (error) {
    console.error("Error fetching user reports:", error);
    throw error; // Throw the error to be handled by the calling function
  }
}

//admin report page only
//retrieving all reports with a sender name
export async function getAllReports() {
  const [result] = await pool.query(
    `
    SELECT 
    reports_table.report_id, 
    reports_table.report_title, 
    reports_table.report_details, 
    user.user_name,
    reports_table.status, 
    reports_table.reason,
    reports_table.date_created   
  FROM 
    reports_table 
  JOIN 
    user 
  ON 
    reports_table.sender_id = user.user_id
    `
  );
  const formattedResult = result.map((row) => ({
    ...row,
    date_created: formatDate(row.date_created),
  }));
  return formattedResult;
}

export async function getUserPaymentsLogs(userId) {
  const query = `
    SELECT 
      user_payments.user_payment_id,
      user_payments.user_id,
      user.user_name,
      user_payments.account_name,
      user_payments.payment_method,
      user_payments.amount,
      user_payments.screenshot_receipt,
      user_payments.status,
      user_payments.date_created
    FROM user_payments
    LEFT JOIN user ON user_payments.user_id = user.user_id
    WHERE user_payments.user_id = ?
  `;
  try {
    const [result] = await pool.query(query, [userId]);
    const formattedResult = result.map((row) => ({
      ...row,
      date_created: formatDate(row.date_created),
    }));
    return formattedResult;
  } catch (error) {
    console.error("Error fetching user payments list:", error);
    throw error;
  }
}

//ADMIN ONLY request

export async function getAllRequests() {
  try {
    const [result] = await pool.query(
      `
      SELECT 
      requests_table.request_id, 
      user.user_name, 
      requests_table.request_title, 
      requests_table.request_details,
      requests_table.status,
      requests_table.reason 
    FROM 
      requests_table 
  JOIN 
      user 
  ON 
      requests_table.sender_id = user.user_id
      `
    );
    return result;
  } catch (error) {
    console.error("Error fetching Requests");
    throw error;
  }
}

export async function getUserDetailReport(userID, reportId) {
  try {
    const [result] = await pool.query(
      `
      SELECT 
        * 
      FROM 
        reports_table 
      WHERE 
        report_id = ? AND sender_id = ?
      `,
      [reportId, userID]
    );
    const formattedResult = result.map((row) => ({
      ...row,
      date_created: formatDate(row.date_created),
    }));
    return formattedResult[0];
  } catch (error) {
    console.error(
      "Error fetching user detail report from the database:",
      error
    );
    throw error;
  }
}

//admin report  function
export async function getOneReport(id) {
  const [result] = await pool.query(
    `
    SELECT 
    reports_table.report_id, 
    reports_table.report_title, 
    reports_table.report_details, 
    user.user_name,
    reports_table.status, 
    reports_table.reason,
    reports_table.date_created
  FROM 
    reports_table 
  JOIN 
    user 
  ON 
    reports_table.sender_id = user.user_id
  WHERE 
    reports_table.report_id = ?
    `,
    [id]
  );
  const formattedResult = result.map((row) => ({
    ...row,
    date_created: formatDate(row.date_created),
  }));
  return formattedResult[0];
}

export async function editUserReport(status, reason, rowId) {
  try {
    const [result] = await pool.query(
      `
      UPDATE reports_table
    SET status = ?,
      reason = ?
    WHERE report_id = ?
      `,
      [status, reason, rowId]
    );
    return result;
  } catch (error) {
    console.error("Error changing Request Status from the Server!", error);
    throw error;
  }
}

export async function getOneRequest(id) {
  const [result] = await pool.query(
    `
    SELECT 
    requests_table.request_id, 
    requests_table.request_title, 
    requests_table.request_details, 
    user.user_name,
    requests_table.status,
    requests_table.reason  
  FROM 
    requests_table 
  JOIN 
    user 
  ON 
    requests_table.sender_id = user.user_id
  WHERE 
    requests_table.request_id = ?
    `,
    [id]
  );
  return result[0];
}

//user request functions
export async function addUserRequest(titleRequest, detailsRequest, userID) {
  try {
    const [result] = await pool.query(
      `
      INSERT INTO requests_table (request_title, request_details, sender_id)
      VALUES (?, ?, ?)
      `,
      [titleRequest, detailsRequest, userID]
    );

    // Return the ID of the newly inserted request
    return result.insertId;
  } catch (error) {
    console.error("Error adding user request:", error);
    throw error;
  }
}

export async function getUserRequest(userId) {
  try {
    const [result] = await pool.query(
      `
      SELECT
      *
      FROM 
        requests_table
      WHERE 
        requests_table.sender_id = ?
      `,
      [userId]
    );
    return result; // Return the full result array to get all requests for the user
  } catch (error) {
    console.error("Error fetching user requests:", error);
    throw error; // Throw the error to be handled by the calling function
  }
}

export async function getUserDetailRequest(userID, requestId) {
  try {
    const [result] = await pool.query(
      `
      SELECT 
        * 
      FROM 
        requests_table 
      WHERE 
        request_id = ? AND sender_id = ?
      `,
      [requestId, userID]
    );
    return result[0];
  } catch (error) {
    console.error(
      "Error fetching user detail request from the database:",
      error
    );
    throw error;
  }
}

export async function editUserRequest(status, reason, rowId) {
  try {
    const [result] = await pool.query(
      `
      UPDATE requests_table
    SET status = ?,
      reason = ?
    WHERE request_id = ?
      `,
      [status, reason, rowId]
    );
    return result;
  } catch (error) {
    console.error("Error changing Request Status from the Server!", error);
    throw error;
  }
}

// Check instructor availability
export async function checkInstructorAvailability(instructorId) {
  try {
    const [result] = await pool.query(
      "SELECT date, am_available, pm_available, onsite_slots FROM availability WHERE instructor_id = ?",
      [instructorId]
    );

    // Format the dates in the result
    const formattedResult = result.map((row) => ({
      ...row,
      date: formatDate(row.date),
    }));
    return formattedResult;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Update availability
export async function updateAvailability(instructorId, date, am, pm, onsite) {
  try {
    const [existing] = await pool.query(
      "SELECT * FROM availability WHERE instructor_id = ? AND date = ?",
      [instructorId, date]
    );

    if (existing.length > 0) {
      // Update only the slots that are provided
      const current = existing[0];
      await pool.query(
        "UPDATE availability SET am_available = ?, pm_available = ?, onsite_slots = ? WHERE instructor_id = ? AND date = ?",
        [
          am !== undefined ? am : current.am_available,
          pm !== undefined ? pm : current.pm_available,
          onsite !== undefined ? onsite : current.onsite_slots,
          instructorId,
          date,
        ]
      );
    } else {
      await pool.query(
        "INSERT INTO availability (instructor_id, date, am_available, pm_available, onsite_slots) VALUES (?, ?, ?, ?, ?)",
        [instructorId, date, am, pm, onsite]
      );
    }
  } catch (error) {
    console.error("Database update error:", error);
    throw error;
  }
}

export async function updateOnsiteAvailability(instructorId, date, onsite) {
  try {
    const [existing] = await pool.query(
      "SELECT * FROM availability WHERE instructor_id = ? AND date = ? AND onsite_slots > 0",
      [instructorId, date]
    );

    if (existing.length > 0) {
      // Update only the slots that are provided
      const current = existing[0];
      await pool.query(
        "UPDATE availability SET onsite_slots = ? WHERE instructor_id = ? AND date = ?",
        [
          onsite !== undefined
            ? current.onsite_slots - onsite
            : current.onsite_slots,
          instructorId,
          date,
        ]
      );
    } else {
      await pool.query(
        "INSERT INTO availability (instructor_id, date, am_available, pm_available, onsite_slots) VALUES (?, ?, ?)",
        [instructorId, date, onsite]
      );
    }
  } catch (error) {
    console.error("Database update error:", error);
    throw error;
  }
}

// Function to check if a slot is already taken
async function isSlotTaken(instructorId, date, am, pm) {
  try {
    const [result] = await pool.query(
      "SELECT * FROM availability WHERE instructor_id = ? AND date = ? AND (am_available = ? OR pm_available = ?)",
      [instructorId, date, am, pm]
    );
    return result.length > 0;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

async function isOnsiteSlotFull(instructorId, date) {
  try {
    const [result] = await pool.query(
      "SELECT onsite_slots FROM availability WHERE instructor_id = ? AND date = ?",
      [instructorId, date]
    );

    // Check if a record exists
    if (!result[0]) {
      throw new Error("Selected date is not available for this program.");
    }

    // Check if slots are full
    if (result[0].onsite_slots <= 0) {
      throw new Error("Selected date is full.");
    }

    return false; // Slots are available
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// Apply TDC
export async function applyTDC(
  instructor,
  startDate,
  startDateAMPM,
  continuation,
  continuationAMPM,
  userid,
  role,
  transmissionType,
  program_id
) {
  if (transmissionType !== "Onsite") {
    // Check if startDate slot is already taken
    const startDateSlotTaken = await isSlotTaken(
      instructor,
      startDate,
      startDateAMPM === "AM",
      startDateAMPM === "PM"
    );
    if (startDateSlotTaken) {
      throw new Error("Start date slot is already taken.");
    }

    // Check if continuation slot is already taken
    const continuationSlotTaken = await isSlotTaken(
      instructor,
      continuation,
      continuationAMPM === "AM",
      continuationAMPM === "PM"
    );
    if (continuationSlotTaken) {
      throw new Error("Continuation date slot is already taken.");
    }
  } else {
    try {
      await isOnsiteSlotFull(instructor, startDate);
    } catch (error) {
      if (
        error.message === "Selected date is not available for this program."
      ) {
        throw new Error(
          "Selected start date is not available for this program."
        );
      } else if (error.message === "Selected date is full.") {
        throw new Error("Selected start date is full.");
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Check availability for the continuation date
    try {
      await isOnsiteSlotFull(instructor, continuation);
    } catch (error) {
      if (
        error.message === "Selected date is not available for this program."
      ) {
        throw new Error(
          "Selected continuation date is not available for this program."
        );
      } else if (error.message === "Selected date is full.") {
        throw new Error("Selected continuation date is full.");
      } else {
        throw error; // Re-throw other errors
      }
    }
  }

  // If both slots are available, proceed with the transaction
  try {
    const connection = await pool.getConnection();
    const instructorName = await getInstructorwithId(instructor);
    const programs = await getAllPrograms();
    const selectedProgramDetails = programs.find(
      (program) => program.program_id == program_id
    );

    try {
      await connection.beginTransaction();

      // Insert the application
      const [result] = await connection.query(
        `INSERT INTO applications (instructor_id, start_date, start_date_am_pm, continuation, continuation_am_pm, creator_id, created_by, transmission) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          instructor,
          startDate,
          startDateAMPM,
          continuation,
          continuationAMPM,
          userid,
          role,
          transmissionType,
        ]
      );

      // Update availability for the starting date
      if (transmissionType !== "Onsite") {
        await updateAvailability(
          instructor,
          startDate,
          startDateAMPM === "AM" ? true : undefined,
          startDateAMPM === "PM" ? true : undefined,
          undefined
        );

        // Update availability for the continuation date
        await updateAvailability(
          instructor,
          continuation,
          continuationAMPM === "AM" ? true : undefined,
          continuationAMPM === "PM" ? true : undefined,
          undefined
        );
      } else {
        await updateOnsiteAvailability(instructor, startDate, 1);
        await updateOnsiteAvailability(instructor, continuation, 1);
      }

      // Update Monthly Applicants
      await updateMonthlyApplicants(connection, 1);

      //Update for the user course table
      const user_course_id = await updateUserCoursesTable(
        connection,
        userid,
        instructorName.instructor_name,
        selectedProgramDetails.program_name,
        selectedProgramDetails.program_duration,
        selectedProgramDetails.program_fee,
        startDate
      );

      // Update attendance for startDate and continuation
      await updateAttendance(
        connection,
        instructor,
        startDate,
        startDateAMPM,
        userid,
        role,
        transmissionType,
        user_course_id
      );
      await updateAttendance(
        connection,
        instructor,
        continuation,
        continuationAMPM,
        userid,
        role,
        transmissionType,
        user_course_id
      );

      // Commit the transaction
      await connection.commit();
      return result;
    } catch (error) {
      // Rollback the transaction in case of error
      await connection.rollback();
      console.error("Database transaction error:", error);
      throw error;
    } finally {
      // Release the connection
      connection.release();
    }
  } catch (error) {
    console.error("Error applying TDC:", error);
    throw error;
  }
}

// Function to update attendance
async function updateAttendance(
  connection,
  instructor,
  date,
  ampm,
  userid,
  role,
  transmission,
  user_course_id
) {
  try {
    await connection.query(
      `INSERT INTO attendance (instructor_id, date, date_am_pm, creator_id, created_by, transmission, user_course_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [instructor, date, ampm, userid, role, transmission, user_course_id]
    );
  } catch (error) {
    console.error("Error updating attendance:", error);
    throw error;
  }
}

// Function to to write for user courses table
async function updateUserCoursesTable(
  connection,
  userid,
  instructor_name,
  program_name,
  program_duration,
  program_fee,
  startDate
) {
  try {
    const [result] = await connection.query(
      `INSERT INTO user_courses (user_id, instructor_name, program_name, program_duration, program_fee, date_started)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userid,
        instructor_name,
        program_name,
        program_duration,
        program_fee,
        startDate,
      ]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error inserting applicant courses details:", error);
    throw error;
  }
}

export async function getAllPdcTdcTakers(type) {
  let query = `
  SELECT a.*, 
  CASE 
  WHEN a.created_by = 'user' THEN u.user_name 
  WHEN a.created_by = 'admin' THEN ad.admin_name 
  ELSE 'Unknown' 
  END AS creator_name,
  i.instructor_name
  FROM attendance a
  LEFT JOIN user u ON a.creator_id = u.user_id AND a.created_by = 'user'
  LEFT JOIN admin_account ad ON a.creator_id = ad.account_id AND a.created_by = 'admin'
  LEFT JOIN instructor i ON a.instructor_id = i.instructor_id
  `;

  switch (type) {
    case "pdc":
      query += ` WHERE a.transmission = 'Manual' OR a.transmission = 'Automatic'`;
      break;
    case "tdc":
      query += ` WHERE a.transmission = 'onsite'`;
      break;
    default:
      break;
  }

  try {
    const [result] = await pool.query(query);
    const formattedResult = result.map((row) => ({
      ...row,
      date: formatDate(row.date),
      created: formatDate(row.created),
    }));
    return formattedResult;
  } catch (error) {
    console.error("Error fetching PDC and TDC takers", error);
    throw error;
  }
}

export async function changeAttendanceStatus(id, status, hours) {
  try {
    const [result] = await pool.query(
      `UPDATE attendance SET status = ?, hours_attended = ? WHERE attendance_id = ?`,
      [status, hours, id]
    );
    return result;
  } catch (error) {
    console.error("Error changing attendance status", error);
    throw error;
  }
}

export async function getUserAttendanceSchedule(userId) {
  try {
    const [result] = await pool.query(
      `SELECT *
      FROM attendance
      WHERE creator_id = ?`,
      [userId]
    );

    const formattedResult = result.map((row) => ({
      date: formatDate(row.date),
      slot: row.date_am_pm,
      status: row.status,
      user_course_id: row.user_course_id,
    }));
    return formattedResult;
  } catch (error) {
    console.error("Failed fetching instructors!", error);
    throw error;
  }
}

export async function getAttendanceByInstructorId(id) {
  const query = `
  SELECT A.*, U.user_name
  FROM attendance A
  JOIN user U ON A.creator_id = U.user_id
  WHERE A.instructor_id = ?
  `;
  const [result] = await pool.query(query, [id]);
  const formattedResult = result.map((row) => ({
    ...row,
    date: formatDate(row.date),
  }));
  return formattedResult;
}

export async function getInstructors() {
  try {
    const [result] = await pool.query(
      `SELECT *
      FROM instructor`
    );

    const formattedResult = result.map((row) => ({
      ...row,
      date_started: formatDate(row.date_started),
    }));
    return formattedResult;
  } catch (error) {
    console.error("Failed fetching instructors!", error);
    throw error;
  }
}

export async function getInstructorwithId(id) {
  try {
    const [result] = await pool.query(
      `SELECT *
      FROM instructor
      WHERE instructor_id = ?`,
      [id]
    );

    const formattedResult = result.map((row) => ({
      ...row,
      date_started: formatDate(row.date_started),
    }));
    return formattedResult[0];
  } catch (error) {
    console.error("Failed fetching instructors!", error);
    throw error;
  }
}

export async function getInstructorWithAccountId(id) {
  try {
    const [result] = await pool.query(
      `SELECT *
      FROM instructor
      WHERE account_id = ?`,
      [id]
    );

    const formattedResult = result.map((row) => ({
      ...row,
      date_started: formatDate(row.date_started),
    }));
    return formattedResult[0];
  } catch (error) {
    console.error("Failed fetching instructors!", error);
    throw error;
  }
}

export async function addInstructor(
  name,
  rate,
  type,
  onsite,
  manual,
  automatic,
  accreditaionNumber,
  dateStarted
) {
  try {
    const [result] = await pool.query(
      `
  INSERT INTO instructor (instructor_name, rate_per_hour, instructor_type, isTdcOnsite, isManual, isAutomatic, date_started, accreditation_number)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
      [
        name,
        rate,
        type,
        onsite,
        manual,
        automatic,
        dateStarted,
        accreditaionNumber,
      ]
    );
    return result.insertId;
  } catch (error) {
    console.error("Failed adding Instructor in the database.", error);
    throw error;
  }
}

export async function updateInstructorInfo(userID, updatedProfile) {
  const setClause = Object.keys(updatedProfile)
    .map((field) => `${field} = ?`)
    .join(", ");
  const values = Object.values(updatedProfile);
  values.push(+userID);
  const [result] = await pool.query(
    `UPDATE instructor 
    SET ${setClause} 
    WHERE instructor_id = ?`,
    values
  );
  return result;
}

export async function assignAccountToInstructor(instructorID, accountID) {
  try {
    const [result] = await pool.query(
      `UPDATE instructor SET account_id = ? WHERE instructor_id = ?`,
      [accountID, instructorID]
    );
    return result;
  } catch (error) {
    console.error("Error assigning account to instructor", error);
    throw error;
  }
}

export async function getInstructorPayroll(id) {
  try {
    const [result] = await pool.query(
      `SELECT iph.*, i.instructor_name
       FROM instructor_payroll_history iph
       JOIN instructor i ON iph.instructor_id = i.instructor_id
       WHERE iph.instructor_id = ?`,
      [id]
    );
    const formattedResult = result.map((row) => ({
      ...row,
      date_start: formatDate(row.date_start),
      date_end: formatDate(row.date_end),
    }));

    return formattedResult;
  } catch (error) {
    console.error("Error fetching instructor payroll", error);
    throw error;
  }
}

export async function getCurrentPayroll(id) {
  try {
    const [result] = await pool.query(
      `SELECT cwp.*, i.instructor_name
      FROM current_week_payroll cwp
      JOIN 
      instructor i ON cwp.instructor_id = i.instructor_id
      WHERE cwp.instructor_id = ?
      `,
      [id]
    );
    const formattedResult = result.map((row) => ({
      ...row,
      date_start: formatDate(row.date_start),
      date_end: formatDate(row.date_end),
    }));

    return formattedResult;
  } catch (error) {
    console.error("Error fetching instructor payroll", error);
    throw error;
  }
}

export async function getWeeklyPayroll(instructorId) {
  try {
    const [result] = await pool.query(
      `
      SELECT 
        i.instructor_name, 
        COALESCE(i.rate_per_hour, 0) AS rate_per_hour,
        COALESCE(SUM(a.hours_attended), 0) AS attended_hours
      FROM 
        instructor i
      LEFT JOIN 
        attendance a ON i.instructor_id = a.instructor_id
        AND a.date BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                        AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 5 DAY)
      WHERE 
        i.instructor_id = ?
      GROUP BY i.instructor_id
      `,
      [instructorId]
    );

    if (result.length === 0) {
      // Instructor not found
      return {
        instructor_name: null,
        rate_per_hour: 0,
        attended_hours: 0,
      };
    }

    return result[0];
  } catch (error) {
    console.error("Error fetching weekly payroll:", error);
    throw error;
  }
}

export async function getMonthlyPayroll(monthYear) {
  try {
    const [result] = await pool.query(
      `SELECT iph.*, i.instructor_name
      FROM instructor_payroll_history iph
      JOIN instructor i ON iph.instructor_id = i.instructor_id
      WHERE iph.month_year = ?`,
      [monthYear]
    );
    const formattedResult = result.map((row) => ({
      ...row,
      date_start: formatDate(row.date_start),
      date_end: formatDate(row.date_end),
    }));

    return formattedResult;
  } catch (error) {
    console.error("Error fetching monthly payroll", error);
    throw error;
  }
}

//every monday it will be exucuted by the cron.schedule in b-cronJob.js
export async function updateCurrentWeekPayroll(
  instructorId,
  attendedHours,
  benefits,
  ratePerHour
) {
  try {
    // Get the current date
    const now = new Date();

    // Calculate the Monday of the current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1); // Monday

    // Calculate the Saturday of the current week
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5); // Saturday

    // Format the dates to YYYY-MM-DD
    const dateStart = monday.toISOString().split("T")[0];
    const dateEnd = saturday.toISOString().split("T")[0];

    await pool.query(
      `INSERT INTO current_week_payroll (instructor_id, rate_per_hour, date_start, date_end, attended_hours, benefits)
      VALUES (?, ?, ?, ?, ?)`,
      [instructorId, ratePerHour, dateStart, dateEnd, attendedHours, benefits]
    );
  } catch (error) {
    console.error("Error updating current week payroll:", error);
    throw error;
  }
}

export async function calculateAndInsertWeeklyPayroll() {
  try {
    const [result] = await pool.query(
      `
      INSERT INTO current_week_payroll (instructor_id, rate_per_hour, date_start, date_end, attended_hours, benefits, isPaid)
      SELECT 
          a.instructor_id,
          i.rate_per_hour,
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 1 DAY) AS date_start, -- Past Monday
          DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) - 5 DAY) AS date_end, -- Past Saturday
          SUM(a.hours_attended) AS attended_hours,
          (IFNULL(i.SSS, 0) + IFNULL(i.Philhealth, 0) + IFNULL(i.Pag_ibig, 0)) AS benefits,
          FALSE AS isPaid
      FROM 
          attendance a
      JOIN 
          instructor i ON a.instructor_id = i.instructor_id
      WHERE 
          a.date BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 1 DAY) 
                    AND DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) - 5 DAY)
      GROUP BY 
          a.instructor_id;
      `
    );
    return result;
  } catch (error) {
    console.error("Error calculating and inserting weekly payroll:", error);
    throw error;
  }
}

export async function calculateAndInsertMonthlyPayroll() {
  try {
    const [result] = await pool.query(
      `
      INSERT INTO instructor_payroll_history (instructor_id, rate_per_hour, date_start, date_end, month_year, attended_hours, gross_income, benefits, net_income, isPaid)
      SELECT
          a.instructor_id,
          i.rate_per_hour,
          DATE_FORMAT(LAST_DAY(CURDATE() - INTERVAL 1 MONTH), '%Y-%m-01') AS date_start, -- First day of the month
          LAST_DAY(CURDATE() - INTERVAL 1 MONTH) AS date_end, -- Last day of the month
          DATE_FORMAT(LAST_DAY(CURDATE() - INTERVAL 1 MONTH), '%M %Y') AS month_year, -- Month-Year format
          SUM(a.hours_attended) AS attended_hours,
          SUM(a.hours_attended) * i.rate_per_hour AS gross_income,
          (IFNULL(i.SSS, 0) + IFNULL(i.Philhealth, 0) + IFNULL(i.Pag_ibig, 0)) AS benefits,
          (SUM(a.hours_attended) * i.rate_per_hour) - (IFNULL(i.SSS, 0) + IFNULL(i.Philhealth, 0) + IFNULL(i.Pag_ibig, 0)) AS net_income,
          FALSE AS isPaid
      FROM 
          attendance a
      JOIN 
          instructor i ON a.instructor_id = i.instructor_id
      WHERE 
          a.date BETWEEN DATE_FORMAT(LAST_DAY(CURDATE() - INTERVAL 1 MONTH), '%Y-%m-01') 
               AND LAST_DAY(CURDATE() - INTERVAL 1 MONTH)
      GROUP BY 
          a.instructor_id;
      `
    );
    return result;
  } catch (error) {
    console.error("Error calculating and inserting monthly payroll:", error);
    throw error;
  }
}

export async function deleteInstructor(id) {
  try {
    const [result] = await pool.query(
      `
      DELETE FROM instructor
      WHERE instructor_id = ?
      `,
      [id]
    );
    return result;
  } catch (error) {
    console.error("Error Deleting Instructor", error);
    throw error;
  }
}

export async function getInstructorDetailsForApplicants() {
  try {
    const [result] = await pool.query(
      `SELECT instructor_id, instructor_name, instructor_type, isTdcOnsite, isManual, isAutomatic
      FROM instructor`
    );
    return result;
  } catch (error) {
    console.error("Failed fetching instructors!", error);
    throw error;
  }
}

// Functions for Completed Courses list
export async function getCompletedCourseList() {
  try {
    const [result] = await pool.query(`
      SELECT *,
      instructor.instructor_id AS instructor_id,
      program_offers.program_id AS program_id,
      user.user_name AS user_name
      FROM user_courses
      LEFT JOIN instructor ON user_courses.instructor_name = instructor.instructor_name
      LEFT JOIN user ON user_courses.user_id = user.user_id
      LEFT JOIN program_offers ON user_courses.program_name = program_offers.program_name
      `);
    // WHERE user_courses.grading_status = 'Completed' --- add later

    const formattedResult = result.map((row) => ({
      ...row,
      date_started: row.date_started ? formatDate(row.date_started) : null,
      date_completed: row.date_completed
        ? formatDate(row.date_completed)
        : null,
    }));
    return formattedResult;
  } catch (error) {
    console.error("Error fetching completed courses", error);
    throw error;
  }
}

export async function getTraineeCourseList(userId) {
  const query = `
    SELECT 
      user_courses.course_id,
      user_courses.user_id,
      user.user_name,
      user_courses.instructor_name,
      user_courses.program_name,
      user_courses.isPaid,
      user_courses.program_fee,
      user_courses.program_duration,
      user_courses.date_started,
      user_courses.date_completed,
      user_courses.grade,
      user_courses.grading_status,
      user_courses.grade_sheet,
      user_courses.total_hours,
      user_courses.certificate_file,
      user_courses.certificate_file_type
    FROM user_courses
    LEFT JOIN user ON user_courses.user_id = user.user_id
    WHERE user_courses.user_id = ?
  `;
  try {
    const [result] = await pool.query(query, [userId]);
    const formattedResult = result.map((row) => ({
      ...row,
      date_started: !row.date_started ? null : formatDate(row.date_started),
      date_completed: !row.date_completed
        ? null
        : formatDate(row.date_completed),
    }));
    return formattedResult;
  } catch (error) {
    console.error("Error fetching user course list", error);
    throw error;
  }
}

export async function getTraineeCourseInfo(courseId) {
  const query = `
    SELECT 
      user_courses.course_id,
      user_courses.user_id,
      user.user_name,
      user_courses.instructor_name,
      user_courses.program_name,
      user_courses.isPaid,
      user_courses.program_fee,
      user_courses.program_duration,
      user_courses.date_started,
      user_courses.date_completed,
      user_courses.grade,
      user_courses.grading_status,
      user_courses.grade_sheet,
      user_courses.total_hours,
      user_courses.certificate_file,
      user_courses.certificate_file_type
    FROM user_courses
    LEFT JOIN user ON user_courses.user_id = user.user_id
    WHERE user_courses.course_id = ?
  `;
  try {
    const [result] = await pool.query(query, [courseId]);
    const formattedResult = result.map((row) => ({
      ...row,
      date_started: !row.date_started ? null : formatDate(row.date_started),
      date_completed: !row.date_completed
        ? null
        : formatDate(row.date_completed),
    }));
    return formattedResult;
  } catch (error) {
    console.error("Error fetching user course list", error);
    throw error;
  }
}

export async function editTraineeCompletedCourseInfo(id, totalHours) {
  try {
    const [result] = await pool.query(
      `UPDATE user_courses SET total_hours = ? WHERE course_id = ?`,
      [totalHours, id]
    );
    return result;
  } catch (error) {
    console.error("Error changing details", error);
    throw error;
  }
}

export async function uploadTraineeCompletionCertificate(
  id,
  fileBuffer,
  fileType
) {
  const query = `
    UPDATE user_courses
    SET certificate_file = ?, certificate_file_type = ?
    WHERE course_id = ?
  `;

  try {
    await pool.query(query, [fileBuffer, fileType, id]);
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
}

export async function deleteTraineeCourseInfo(
  userId,
  dateStarted,
  continuation
) {
  const [applicationID] = await pool.query(
    `SELECT application_id FROM applications WHERE user_id = ? AND start_date = ? AND continuation = ?`,
    [userId, dateStarted, continuation]
  );
  try {
    await deleteApplication(applicationID[0].application_id);
    return { message: "Course deleted successfully" };
  } catch (error) {
    console.error("Error Deleting Vehicle", error);
    throw error;
  }
}

// Function for vehicle list

export async function getAllVehicle() {
  const result = await pool.query(
    `
    SELECT *
    FROM vehicle_list
    `
  );
  return result[0];
}

export async function updateVehicleStatus(id, status) {
  try {
    const [result] = await pool.query(
      `UPDATE vehicle_list SET isRegistered = ? WHERE vehicle_id = ?`,
      [status, id]
    );
    return result;
  } catch (error) {
    console.error("Error changing vehicle status", error);
    throw error;
  }
}

export async function editOneVehicle(
  plateNumber,
  vehicleModel,
  year,
  vehicleType,
  vehicleID
) {
  const [result] = await pool.query(
    `
    UPDATE vehicle_list
    SET
    plate_number = ?,
    vehicle_model = ?,
    year = ?,
    vehicle_type = ?
    WHERE vehicle_id = ?
    `,
    [plateNumber, vehicleModel, year, vehicleType, vehicleID]
  );
  return result;
}

export async function addVehicle(plateNumber, vehicleModel, year, vehicleType) {
  try {
    const [result] = await pool.query(
      `
      INSERT INTO vehicle_list (plate_number, vehicle_model, year, vehicle_type)
      VALUES (?, ?, ?, ?)
      `,
      [plateNumber, vehicleModel, year, vehicleType]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error adding vehicle", error);
    throw error;
  }
}

export async function storeLtoDocument(vehicleId, fileBuffer, fileType) {
  const query = `
    UPDATE vehicle_list
    SET lto_document = ?, lto_document_type = ?
    WHERE vehicle_id = ?
  `;

  try {
    await pool.query(query, [fileBuffer, fileType, vehicleId]);
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
}

export async function uploadVehiclePhoto(vehicleId, fileBuffer, fileType) {
  const query = `
    UPDATE vehicle_list
    SET car_picture = ?, car_picture_type = ?
    WHERE vehicle_id = ?
  `;

  try {
    await pool.query(query, [fileBuffer, fileType, vehicleId]);
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
}

export async function deleteVehicle(rowID) {
  try {
    const [result] = await pool.query(
      `
      DELETE FROM vehicle_list
      WHERE vehicle_id = ?
      `,
      [rowID]
    );
    return result;
  } catch (error) {
    console.error("Error Deleting Vehicle", error);
    throw error;
  }
}

export async function addNotification(userId, role, type, message) {
  try {
    const query = `
    INSERT INTO notifications (user_role, user_id, notif_type, message)
    VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [role, userId, type, message]);
    return result;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
}

export async function getNotifications(userId, role) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `SELECT notif_type, message, DATE_FORMAT(date_created, '%Y-%m-%d') AS date_created, isRead
       FROM notifications
       WHERE user_id = ? AND user_role = ?
       ORDER BY date_created DESC`,
      [userId, role]
    );

    // Pass the connection to the helper!
    await markReadNotifications(userId, role, connection);

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Helper function that uses the same connection
export async function markReadNotifications(userId, role, connection) {
  const [result] = await connection.query(
    `UPDATE notifications SET isRead = 1 WHERE user_id = ? AND user_role = ? AND isRead = 0`,
    [userId, role]
  );
  return result;
}
