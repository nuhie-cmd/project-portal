-- MySQL Schema for Mini Project Management Portal (project_portal)
-- Run this script in MySQL Workbench or MySQL CLI before starting the backend server.

CREATE DATABASE IF NOT EXISTS project_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE project_portal;

-- 1. Users (Students, Guides, Coordinators)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'guide', 'coordinator') NOT NULL DEFAULT 'student',
  usn VARCHAR(30) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Teams
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_name VARCHAR(120) NOT NULL,
  project_title VARCHAR(200) NOT NULL,
  leader_user_id INT NOT NULL,
  leader_name VARCHAR(100) NOT NULL,
  leader_usn VARCHAR(30) NOT NULL,
  leader_email VARCHAR(150) NOT NULL,
  guide_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_teams_leader FOREIGN KEY (leader_user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_teams_guide FOREIGN KEY (guide_id)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  member_name VARCHAR(100) NOT NULL,
  member_usn VARCHAR(30) NOT NULL,
  member_email VARCHAR(150) NOT NULL,
  role_in_team ENUM('leader', 'member') NOT NULL DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_team_members_team FOREIGN KEY (team_id)
    REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY uq_team_member_email (team_id, member_email)
) ENGINE=InnoDB;

-- 4. Project Proposals
CREATE TABLE IF NOT EXISTS project_proposals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  submitted_by INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  problem_statement TEXT NOT NULL,
  objectives TEXT NOT NULL,
  technologies_used VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_proposals_team FOREIGN KEY (team_id)
    REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_proposals_user FOREIGN KEY (submitted_by)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Project Status (Tracks current proposal state: Pending, Approved, Rejected)
CREATE TABLE IF NOT EXISTS project_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL UNIQUE,
  team_id INT NOT NULL UNIQUE,
  status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  remarks TEXT NULL,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_proposal FOREIGN KEY (proposal_id)
    REFERENCES project_proposals(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_team FOREIGN KEY (team_id)
    REFERENCES teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_updater FOREIGN KEY (updated_by)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Guide Reviews (Audit history of guide feedback and approval/rejection decisions)
CREATE TABLE IF NOT EXISTS guide_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  guide_id INT NOT NULL,
  decision ENUM('Approved', 'Rejected') NOT NULL,
  feedback TEXT NOT NULL,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_proposal FOREIGN KEY (proposal_id)
    REFERENCES project_proposals(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_guide FOREIGN KEY (guide_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
