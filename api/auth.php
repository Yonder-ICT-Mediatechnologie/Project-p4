<?php
// Initialize session
session_start();

// Include database connection
require_once '../db_connect.php';

// Set response headers
header('Content-Type: application/json');
// Fix CORS to allow credentials (must specify exact origin, not wildcards)
header('Access-Control-Allow-Origin: http://' . $_SERVER['HTTP_HOST']);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

// Check action type
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'login':
        login($pdo, $data);
        break;
    case 'register':
        register($pdo, $data);
        break;
    case 'logout':
        logout($pdo, $data);
        break;
    case 'check-session':
        checkSession();
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

// Login user function
function login($pdo, $data) {
    // Validate input
    if (!isset($data['username']) || !isset($data['password'])) {
        echo json_encode(['success' => false, 'message' => 'Please provide username and password']);
        return;
    }

    $username = $data['username'];
    $password = $data['password'];

    try {
        // Get user from database
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        // Check if user exists and password is correct
        if ($user && password_verify($password, $user['password'])) {
            // Create session for the user
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['is_admin'] = $user['is_admin'];

            // Update active players table
            $sessionId = session_id();
            $stmt = $pdo->prepare("REPLACE INTO active_players (session_id, user_id, username, last_activity) VALUES (?, ?, ?, NOW())");
            $stmt->execute([$sessionId, $user['user_id'], $user['username']]);

            echo json_encode([
                'success' => true, 
                'message' => 'Login successful',
                'user' => [
                    'username' => $user['username'],
                    'is_admin' => (bool)$user['is_admin']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

// Register user function
function register($pdo, $data) {
    // Validate input
    if (!isset($data['username']) || !isset($data['password'])) {
        echo json_encode(['success' => false, 'message' => 'Please provide username and password']);
        return;
    }

    $username = $data['username'];
    $password = $data['password'];
    $email = isset($data['email']) ? $data['email'] : null;

    // Validate username length
    if (strlen($username) < 3) {
        echo json_encode(['success' => false, 'message' => 'Username must be at least 3 characters']);
        return;
    }

    // Validate password length
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        return;
    }

    try {
        // Check if username already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $result = $stmt->fetch();

        if ($result['count'] > 0) {
            echo json_encode(['success' => false, 'message' => 'Username already exists']);
            return;
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (username, password, email) VALUES (?, ?, ?)");
        $stmt->execute([$username, $hashedPassword, $email]);

        echo json_encode(['success' => true, 'message' => 'Registration successful']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

// Logout user function
function logout($pdo, $data) {
    try {
        // Remove from active players
        if (isset($_SESSION['user_id'])) {
            $sessionId = session_id();
            $stmt = $pdo->prepare("DELETE FROM active_players WHERE session_id = ?");
            $stmt->execute([$sessionId]);
        }

        // Destroy the session
        session_unset();
        session_destroy();

        echo json_encode(['success' => true, 'message' => 'Logout successful']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

// Check if user is logged in
function checkSession() {
    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            'success' => true,
            'user' => [
                'username' => $_SESSION['username'],
                'is_admin' => (bool)$_SESSION['is_admin']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Not logged in']);
    }
}
?>