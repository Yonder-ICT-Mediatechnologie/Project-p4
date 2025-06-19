<?php
// Database connection parameters
$host = 'localhost';
$db_name = 'wordle_game';
$username = 'root'; // Default XAMPP username
$password = '';     // Default XAMPP empty password

// Create connection
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    // Set the PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Set default fetch mode to associative array
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    // If there is an error with the connection, stop the script and display the error
    die("Connection failed: " . $e->getMessage());
}
?>