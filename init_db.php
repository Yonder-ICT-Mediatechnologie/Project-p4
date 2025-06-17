<?php
// Database setup/troubleshooting script
// This script will check if the database and tables exist, and create them if needed

// Database connection parameters
$host = 'localhost';
$db_name = 'wordle_game';
$username = 'root';
$password = '';

echo "<h1>Wordle Game Database Setup</h1>";

try {
    // First, try to connect to MySQL server without specifying the database
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p>✅ Successfully connected to MySQL server</p>";
    
    // Check if database exists, if not create it
    $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$db_name'");
    $dbExists = $stmt->fetchColumn();
    
    if (!$dbExists) {
        echo "<p>⚠️ Database '$db_name' doesn't exist. Creating it...</p>";
        $pdo->exec("CREATE DATABASE `$db_name`");
        echo "<p>✅ Database created successfully</p>";
    } else {
        echo "<p>✅ Database '$db_name' already exists</p>";
    }
    
    // Connect to the specific database
    $pdo = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check if tables exist
    $tables = ['users', 'scores', 'active_players'];
    $missingTables = [];
    
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if (!$stmt->fetchColumn()) {
            $missingTables[] = $table;
        }
    }
    
    if (!empty($missingTables)) {
        echo "<p>⚠️ Some tables are missing: " . implode(', ', $missingTables) . ". Creating them...</p>";
        
        // Create users table
        if (in_array('users', $missingTables)) {
            $pdo->exec("CREATE TABLE `users` (
                `user_id` INT NOT NULL AUTO_INCREMENT,
                `username` VARCHAR(50) NOT NULL UNIQUE,
                `password` VARCHAR(255) NOT NULL,
                `is_admin` BOOLEAN NOT NULL DEFAULT FALSE,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`user_id`)
            )");
            
            // Insert demo user
            $demoPassword = password_hash('password', PASSWORD_DEFAULT);
            $pdo->exec("INSERT INTO `users` (`username`, `password`, `is_admin`) VALUES 
                        ('demo', '$demoPassword', FALSE)");
            
            // Insert admin user
            $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
            $pdo->exec("INSERT INTO `users` (`username`, `password`, `is_admin`) VALUES 
                        ('admin', '$adminPassword', TRUE)");
                        
            echo "<p>✅ Created users table with demo and admin accounts</p>";
        }
        
        // Create scores table
        if (in_array('scores', $missingTables)) {
            $pdo->exec("CREATE TABLE `scores` (
                `score_id` INT NOT NULL AUTO_INCREMENT,
                `user_id` INT NOT NULL,
                `score` INT NOT NULL,
                `word` VARCHAR(10) NOT NULL,
                `attempts` INT NOT NULL,
                `time` INT NOT NULL,
                `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`score_id`),
                FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
            )");
            echo "<p>✅ Created scores table</p>";
        }
        
        // Create active_players table
        if (in_array('active_players', $missingTables)) {
            $pdo->exec("CREATE TABLE `active_players` (
                `session_id` VARCHAR(255) NOT NULL,
                `user_id` INT NOT NULL,
                `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`session_id`),
                FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
            )");
            echo "<p>✅ Created active_players table</p>";
        }
    } else {
        echo "<p>✅ All required tables exist</p>";
    }
    
    // Test database functionality by checking users
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $userCount = $stmt->fetchColumn();
    echo "<p>✅ Database functionality test passed: Found $userCount users</p>";
    
    echo "<h2>Database setup successful!</h2>";
    echo "<p>You can now <a href='index.html'>return to the game</a>.</p>";
    
} catch(PDOException $e) {
    // If there is an error with the connection, display the error
    echo "<h2>⚠️ Database Error</h2>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "<p>Please ensure:</p>";
    echo "<ul>";
    echo "<li>XAMPP is running (Apache and MySQL services)</li>";
    echo "<li>MySQL is configured with username 'root' and no password</li>";
    echo "</ul>";
}
?>