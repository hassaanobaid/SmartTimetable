-- =====================================================
-- Smart Timetable Generator - MySQL (XAMPP) database
-- Run this in phpMyAdmin > SQL tab, or: npm run setup-db
-- =====================================================
CREATE DATABASE IF NOT EXISTS smart_timetable
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE smart_timetable;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','teacher','student') NOT NULL DEFAULT 'student',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NULL,
  department VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  size INT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  name     VARCHAR(50) NOT NULL UNIQUE,
  capacity INT NOT NULL,
  is_lab   TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS time_slots (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  day        ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  UNIQUE KEY uq_slot (day, start_time)
);

-- One row = one course taught to one section by one teacher
CREATE TABLE IF NOT EXISTS courses (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  code             VARCHAR(20)  NOT NULL,
  name             VARCHAR(100) NOT NULL,
  classes_per_week INT NOT NULL DEFAULT 2,
  is_lab           TINYINT(1) NOT NULL DEFAULT 0,
  teacher_id       INT NOT NULL,
  section_id       INT NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- A row here means the teacher is NOT available in that slot
CREATE TABLE IF NOT EXISTS teacher_availability (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  slot_id    INT NOT NULL,
  UNIQUE KEY uq_avail (teacher_id, slot_id),
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id)    REFERENCES time_slots(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS timetable_entries (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  room_id   INT NOT NULL,
  slot_id   INT NOT NULL,
  UNIQUE KEY uq_room_slot (room_id, slot_id),
  FOREIGN KEY (course_id) REFERENCES courses(id)    ON DELETE CASCADE,
  FOREIGN KEY (room_id)   REFERENCES rooms(id)      ON DELETE CASCADE,
  FOREIGN KEY (slot_id)   REFERENCES time_slots(id) ON DELETE CASCADE
);

-- Default time slots: Monday to Friday, 5 slots per day
INSERT IGNORE INTO time_slots (day, start_time, end_time)
SELECT d.dname, s.st, s.et
FROM (SELECT 'Monday' AS dname UNION ALL SELECT 'Tuesday' UNION ALL SELECT 'Wednesday'
      UNION ALL SELECT 'Thursday' UNION ALL SELECT 'Friday') d
CROSS JOIN (SELECT '08:30:00' AS st, '10:00:00' AS et
            UNION ALL SELECT '10:00:00', '11:30:00'
            UNION ALL SELECT '11:30:00', '13:00:00'
            UNION ALL SELECT '14:00:00', '15:30:00'
            UNION ALL SELECT '15:30:00', '17:00:00') s;
