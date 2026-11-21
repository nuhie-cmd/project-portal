CREATE DATABASE IF NOT EXISTS project_management;
USE project_management;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','guide','coordinator') NOT NULL,
  usn VARCHAR(20) NULL,
  max_teams INT NOT NULL DEFAULT 4,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  leader_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES users(id)
);

CREATE TABLE team_members (
  team_id INT NOT NULL,
  student_id INT NOT NULL UNIQUE,
  PRIMARY KEY (team_id, student_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL UNIQUE,
  guide_id INT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  objectives TEXT,
  scope TEXT,
  status ENUM('Pending','Approved','In Progress','Completed') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (guide_id) REFERENCES users(id)
);

CREATE TABLE deadlines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  due_date DATETIME NOT NULL,
  created_by INT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  deadline_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (deadline_id) REFERENCES deadlines(id)
);

CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  guide_id INT NOT NULL,
  comments TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (guide_id) REFERENCES users(id)
);

CREATE TABLE milestones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  status ENUM('Not Started','In Progress','Done') DEFAULT 'Not Started',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  agenda VARCHAR(255),
  notes TEXT,
  status ENUM('Scheduled','Completed') DEFAULT 'Scheduled',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE similarity_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  similar_project_id INT NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (similar_project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE ai_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  review_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);