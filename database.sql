-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS wordle_game;

-- Use the database
USE wordle_game;

-- Users table to store user credentials and basic info
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Will store hashed passwords
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Scores table to store game results
CREATE TABLE IF NOT EXISTS scores (
    score_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score INT NOT NULL,
    word VARCHAR(5) NOT NULL,
    attempts INT NOT NULL,
    time INT NOT NULL, -- Game duration in seconds
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Active Players table to track who is currently playing
CREATE TABLE IF NOT EXISTS active_players (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert admin user (password is 'admin123' - this would be hashed in production)
INSERT INTO users (username, password, is_admin) 
VALUES ('admin', '$2y$10$H8oiV9.q3v3lAkRJ7LnN7.ycBtIFvZIvzrHmBLsEjkrLcQyeIw2OC', TRUE);

-- Insert demo user (password is 'password' - this would be hashed in production)
INSERT INTO users (username, password) 
VALUES ('demo', '$2y$10$pQCO3AL41Y9L3llJ8VT9lO1DUOaBUWAPyiNnSXEIpcIBHCi1kv0vy');