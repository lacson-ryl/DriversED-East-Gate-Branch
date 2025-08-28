USE drivereadydb;

-- Admin account must come first for FK references
CREATE TABLE admin_account (
    account_id INT PRIMARY KEY AUTO_INCREMENT,
    admin_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(100) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    account_role VARCHAR(50) NOT NULL,
    isVerify VARCHAR(20) NOT NULL DEFAULT "No",
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE monthly_applicants (
    currDay DATE PRIMARY KEY,
    currMonth VARCHAR(20),
    currYear INT,
    totalApplicants INT
);

CREATE TABLE instructor (
    instructor_id INT PRIMARY KEY AUTO_INCREMENT,
    instructor_name VARCHAR(100),
    rate_per_hour INT,
    instructor_type VARCHAR(50),
    isTdcOnsite BOOLEAN DEFAULT FALSE,
    isManual BOOLEAN DEFAULT FALSE,
    isAutomatic BOOLEAN DEFAULT FALSE,
    date_started DATE,
    SSS DECIMAL(10, 2),
    Philhealth DECIMAL(10, 2),
    Pag_ibig DECIMAL(10, 2),
    instructor_profile_picture MEDIUMBLOB,
    prn VARCHAR(50),
    accreditation_number VARCHAR(50),
    account_id INT,
    FOREIGN KEY (account_id) REFERENCES admin_account (account_id)
);

CREATE TABLE program_offers (
    program_id INT PRIMARY KEY AUTO_INCREMENT,
    program_name VARCHAR(100),
    program_description TEXT,
    program_duration INT,
    program_fee DECIMAL(10, 2),
    program_cover MEDIUMBLOB,
    program_cover_file_type VARCHAR(50),
    availability VARCHAR(20) DEFAULT "Unavailable"
);

CREATE TABLE instructor_programs (
    instructor_program_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT,
    program_id INT,
    FOREIGN KEY (instructor_id) REFERENCES instructor (instructor_id),
    FOREIGN KEY (program_id) REFERENCES program_offers (program_id)
);

CREATE TABLE certificates_completion (
    certificate_id INT PRIMARY KEY NOT NULL,
    certificate_name VARCHAR(100) NOT NULL,
    certificate_template MEDIUMBLOB,
    template_file_type VARCHAR(255)
);

CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL DEFAULT 'user',
    isVerify VARCHAR(20) DEFAULT 'false',
    date_created DATE DEFAULT (CURRENT_DATE)
);

CREATE TABLE reports_table (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_title VARCHAR(255) NOT NULL,
    report_details VARCHAR(2000) NOT NULL,
    sender_id INT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(25) DEFAULT 'Pending',
    reason VARCHAR(1000),
    FOREIGN KEY (sender_id) REFERENCES user (user_id)
);

CREATE TABLE requests_table (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    request_title VARCHAR(255) NOT NULL,
    request_details VARCHAR(2000) NOT NULL,
    sender_id INT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(25) DEFAULT 'Pending',
    reason VARCHAR(1000),
    FOREIGN KEY (sender_id) REFERENCES user (user_id)
);

CREATE TABLE user_courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    instructor_name VARCHAR(100),
    program_name VARCHAR(100),
    program_duration INT,
    program_fee DECIMAL(10, 2),
    isPaid BOOLEAN DEFAULT FALSE,
    date_started DATE,
    date_completed DATE,
    total_hours INT DEFAULT 0,
    grade DECIMAL(5, 2) DEFAULT 0,
    grading_status VARCHAR(50) DEFAULT 'Pending',
    grade_sheet MEDIUMBLOB,
    certificate_file MEDIUMBLOB,
    certificate_file_type VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES user (user_id)
);

CREATE TABLE applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT,
    start_date DATE,
    start_date_am_pm ENUM ('AM', 'PM'),
    continuation DATE,
    continuation_am_pm ENUM ('AM', 'PM'),
    creator_id INT,
    created_by ENUM ('user', 'admin'),
    transmission ENUM ("Manual", "Automatic", "onsite"),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_course_id INT NOT NULL,
    FOREIGN KEY (instructor_id) REFERENCES instructor (instructor_id)
);

CREATE TABLE IF NOT EXISTS availability (
    availability_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT,
    date DATE,
    am_available BOOLEAN DEFAULT TRUE,
    pm_available BOOLEAN DEFAULT TRUE,
    onsite_slots INT DEFAULT 0,
    FOREIGN KEY (instructor_id) REFERENCES instructor (instructor_id)
);

CREATE TABLE user_profile (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(75),
    last_name VARCHAR(50),
    middle_name VARCHAR(25),
    phone_number VARCHAR(15),
    lto_client_id VARCHAR(100),
    email VARCHAR(50),
    birth_date DATE,
    nationality VARCHAR(20),
    gender VARCHAR(10),
    address TEXT,
    civil_status VARCHAR(25),
    training_purpose VARCHAR(50),
    profile_picture MEDIUMBLOB,
    user_id INT,
    identification_card VARCHAR(50),
    identification_card_picture MEDIUMBLOB,
    prn VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES user (user_id)
);

CREATE TABLE payment_methods (
    method_id INT PRIMARY KEY AUTO_INCREMENT,
    method_name VARCHAR(100) NOT NULL,
    availablity VARCHAR(30) DEFAULT "Unavailable",
    method_file MEDIUMBLOB,
    method_file_type VARCHAR(30)
);

CREATE TABLE user_payments (
    user_payment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    account_name VARCHAR(100),
    course_id INT,
    payment_method VARCHAR(50),
    amount INT,
    screenshot_receipt MEDIUMBLOB,
    status VARCHAR(50) DEFAULT 'verifying',
    date_created DATE DEFAULT (CURRENT_DATE)
);

CREATE TABLE instructor_payroll_history (
    payroll_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT,
    rate_per_hour INT,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    month_year VARCHAR(20),
    attended_hours DECIMAL(5, 2) NOT NULL,
    gross_income DECIMAL(10, 2) NOT NULL,
    benefits DECIMAL(10, 2) NOT NULL,
    net_income DECIMAL(10, 2) NOT NULL,
    isPaid BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (instructor_id) REFERENCES instructor (instructor_id)
);

CREATE TABLE current_week_payroll (
    payroll_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT,
    rate_per_hour INT,
    date_start DATE NOT NULL,
    date_end DATE NOT NULL,
    attended_hours DECIMAL(5, 2) NOT NULL,
    benefits DECIMAL(10, 2) NOT NULL,
    isPaid BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (instructor_id) REFERENCES instructor (instructor_id)
);

CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT,
    date DATE,
    date_am_pm ENUM ('AM', 'PM'),
    creator_id INT,
    created_by ENUM ('user', 'admin'),
    transmission ENUM ("Manual", "Automatic", "onsite"),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT "Pending",
    user_course_id INT NOT NULL,
    hours_attended INT DEFAULT 0,
    FOREIGN KEY (instructor_id) REFERENCES instructor (instructor_id),
    FOREIGN KEY (user_course_id) REFERENCES user_courses (course_id)
);

CREATE TABLE vehicle_list (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    isRegistered VARCHAR(20) DEFAULT "Pending",
    lto_document MEDIUMBLOB,
    lto_document_type VARCHAR(255),
    car_picture MEDIUMBLOB
);

CREATE TABLE change_password_or_email (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    user_type VARCHAR(50),
    reset_code VARCHAR(255),
    reset_type VARCHAR(50),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_role VARCHAR(20) NOT NULL,
    user_id INT NOT NULL,
    notif_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT false,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_keys (
    key_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    enc_priv_key TEXT NOT NULL,
    priv_key_iv VARCHAR(32) NOT NULL,
    pub_key_web_crypto TEXT NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
