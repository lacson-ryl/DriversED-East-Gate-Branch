
use drivingschooldb;

DROP TABLE admin_accounts;
CREATE TABLE
    admin_accounts (
        admin_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    instructors (
        instructor_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        hire_date DATE,
        profile TEXT
    );

CREATE TABLE
    reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        applicant_id INT,
        FOREIGN KEY (applicant_id) REFERENCES applicants (applicant_id)
    );

CREATE TABLE
    requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        request_type VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        applicant_id INT,
        FOREIGN KEY (applicant_id) REFERENCES applicants (applicant_id)
    );
 DROP TABLE applicants;
CREATE TABLE
    applicants (
        applicant_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(75) NOT NULL,
        last_name VARCHAR(25) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        gender VARCHAR(10),
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        isPDC ENUM ('not enrolled', 'enrolled', 'completed') DEFAULT 'not enrolled',
        isTDC ENUM ('not enrolled', 'enrolled', 'completed') DEFAULT 'not enrolled',
        tdc_mode ENUM ('online', 'onsite', 'not enrolled') DEFAULT 'not enrolled' -- Added column for TDC mode
    );

CREATE TABLE
    programs (
        program_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration INT, -- Duration in hours
        price DECIMAL(10, 2),
        availability VARCHAR(50) DEFAULT 'Available'
    );

CREATE TABLE
    certificates (
        certificate_id INT AUTO_INCREMENT PRIMARY KEY,
        certificate_name VARCHAR(255) NOT NULL,
        issued_date DATE NOT NULL,
        expiry_date DATE,
        program_id INT,
        FOREIGN KEY (program_id) REFERENCES programs (program_id)
    );

CREATE TABLE
    branches (
        branch_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        payment_methods TEXT,
        contact_info TEXT
    );

CREATE TABLE
    payroll (
        payroll_id INT AUTO_INCREMENT PRIMARY KEY,
        instructor_id INT,
        salary DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method VARCHAR(50),
        FOREIGN KEY (instructor_id) REFERENCES instructors (instructor_id)
    );

CREATE TABLE
    attendance (
        attendance_id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT,
        instructor_id INT,
        date DATE NOT NULL,
        time_slot TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'Present',
        FOREIGN KEY (client_id) REFERENCES applicants (applicant_id),
        FOREIGN KEY (instructor_id) REFERENCES instructors (instructor_id)
    );

CREATE TABLE
    instructor_schedule (
        schedule_id INT AUTO_INCREMENT PRIMARY KEY,
        instructor_id INT,
        date DATE NOT NULL,
        time_slot TIME NOT NULL,
        program_id INT,
        FOREIGN KEY (instructor_id) REFERENCES instructors (instructor_id),
        FOREIGN KEY (program_id) REFERENCES programs (program_id)
    );
DROP TABLE user_accounts

CREATE TABLE
    user_accounts (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        applicant_id INT,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (applicant_id) REFERENCES applicants (applicant_id)
    );

CREATE TABLE
    applications (
        application_id INT AUTO_INCREMENT PRIMARY KEY,
        instructor_id INT,
        start_date DATE,
        start_date_am_pm ENUM ('AM', 'PM'),
        continuation DATE,
        continuation_am_pm ENUM ('AM', 'PM'),
        applicant_id INT,
        transmission ENUM ("Manual", "Automatic"),
        FOREIGN KEY (instructor_id) REFERENCES instructors (instructor_id),
        FOREIGN KEY (applicant_id) REFERENCES applicants (applicant_id)
    );

CREATE TABLE
    IF NOT EXISTS availability (
        availability_id INT AUTO_INCREMENT PRIMARY KEY,
        instructor_id INT,
        date DATE,
        am_available BOOLEAN DEFAULT TRUE,
        pm_available BOOLEAN DEFAULT TRUE,
        onsite_available BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (instructor_id) REFERENCES instructors (instructor_id)
    );