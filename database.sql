CREATE DATABASE IF NOT EXISTS drum_studio_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE drum_studio_booking;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(25) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('client','admin') NOT NULL DEFAULT 'client',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS drums (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(1000) NOT NULL DEFAULT '',
  hourly_rate DECIMAL(10,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_drums_rate CHECK (hourly_rate > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  drum_id BIGINT UNSIGNED NOT NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  duration_hours TINYINT UNSIGNED NOT NULL,
  purpose VARCHAR(120) NOT NULL,
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('Pending','Approved','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
  admin_note VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_booking_schedule (drum_id, status, start_at, end_at),
  INDEX idx_booking_user (user_id, created_at),
  CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_booking_drum FOREIGN KEY (drum_id) REFERENCES drums(id) ON DELETE RESTRICT,
  CONSTRAINT chk_booking_time CHECK (end_at > start_at),
  CONSTRAINT chk_booking_duration CHECK (duration_hours BETWEEN 1 AND 12),
  CONSTRAINT chk_booking_total CHECK (total_price >= 0)
) ENGINE=InnoDB;

INSERT INTO drums (name, description, hourly_rate) VALUES
('Studio Kit A', 'Standard acoustic drum kit for practice and rehearsal.', 250.00),
('Studio Kit B', 'Full acoustic drum kit suitable for band sessions.', 350.00),
('Electronic Kit', 'Electronic drum kit for quieter practice sessions.', 200.00);

-- Create the first administrator using the instructions in README.md.
