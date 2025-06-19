<?php
// Initialize session
session_start();

// Include database connection
require_once '../db_connect.php';

// Set response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit();
}

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getActivePlayers($pdo);
        break;
    case 'POST':
        updateActivity($pdo);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

// Get active players (admin only)
function getActivePlayers($pdo) {
    // Check if user is admin
    if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] != 1) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin access required']);
        return;
    }

    try {
        // Clean up stale sessions (inactive for more than 5 minutes)
        $stmt = $pdo->prepare("DELETE FROM active_players WHERE last_activity < DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
        $stmt->execute();

        // Get active players
        $stmt = $pdo->prepare("SELECT username, last_activity FROM active_players ORDER BY username");
        $stmt->execute();
        $players = $stmt->fetchAll();

        // Get count
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM active_players");
        $stmt->execute();
        $count = $stmt->fetch();

        echo json_encode([
            'success' => true, 
            'players' => $players,
            'count' => (int)$count['count']
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

// Update user activity
function updateActivity($pdo) {
    $userId = $_SESSION['user_id'];
    $username = $_SESSION['username'];
    $sessionId = session_id();

    try {
        // Update active players table
        $stmt = $pdo->prepare("REPLACE INTO active_players (session_id, user_id, username, last_activity) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$sessionId, $userId, $username]);

        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
?>