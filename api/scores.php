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
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check session status for non-GET requests
if (!isset($_SESSION['user_id']) && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'User not authenticated']);
    exit();
}

// Get request data based on method
$data = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Get raw input
    $input = file_get_contents('php://input');
    if (!empty($input)) {
        $data = json_decode($input, true);
    }
    
    // Debug logging for DELETE requests
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        error_log('DELETE request received. Data: ' . print_r($data, true));
    }
}

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getScores($pdo);
        break;
    case 'POST':
        saveScore($pdo, $data);
        break;
    case 'DELETE':
        deleteScore($pdo, $data);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

// Get scores function
function getScores($pdo) {
    // Determine the period parameter (today, yesterday, alltime)
    $period = isset($_GET['period']) ? $_GET['period'] : 'alltime';
    $isAdmin = isset($_GET['admin']) && $_GET['admin'] === 'true' && isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1;
    
    try {
        // Different SQL based on period and admin status
        $sql = "SELECT s.*, u.username FROM scores s 
                JOIN users u ON s.user_id = u.user_id ";
                
        $params = [];
        
        if ($period === 'today' && !$isAdmin) {
            $sql .= "WHERE DATE(s.date) = CURDATE() ";
        } elseif ($period === 'yesterday' && !$isAdmin) {
            $sql .= "WHERE DATE(s.date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) ";
        }
        
        $sql .= "ORDER BY s.score DESC ";
        
        // Limit for non-admin requests
        if (!$isAdmin) {
            $sql .= "LIMIT 10";
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $scores = $stmt->fetchAll();
        
        // Format scores for JSON output
        $formattedScores = [];
        foreach ($scores as $score) {
            $scoreData = [
                'username' => $score['username'],
                'score' => (int)$score['score'],
                'word' => $score['word'],
                'attempts' => (int)$score['attempts'],
                'time' => (int)$score['time'],
                'date' => $score['date']
            ];
            
            // Include score_id for admin
            if ($isAdmin) {
                $scoreData['score_id'] = $score['score_id'];
            }
            
            $formattedScores[] = $scoreData;
        }
        
        echo json_encode(['success' => true, 'scores' => $formattedScores]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

// Save score function
function saveScore($pdo, $data) {
    // Validate input
    if (!isset($data['score']) || !isset($data['word']) || !isset($data['attempts']) || !isset($data['time'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required score data']);
        return;
    }

    $userId = $_SESSION['user_id'];
    $score = (int)$data['score'];
    $word = $data['word'];
    $attempts = (int)$data['attempts'];
    $time = (int)$data['time'];

    try {
        // Insert score into database
        $stmt = $pdo->prepare("INSERT INTO scores (user_id, score, word, attempts, time) 
                               VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $score, $word, $attempts, $time]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Score saved successfully',
            'score_id' => $pdo->lastInsertId()
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

// Delete score function (admin only)
function deleteScore($pdo, $data) {
    // Check if user is admin and log the check result
    $isAdmin = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1;
    error_log('Delete score function. Is admin: ' . ($isAdmin ? 'Yes' : 'No'));
    
    if (!$isAdmin) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized: Admin access required']);
        return;
    }

    // Validate input
    if (!isset($data['score_id'])) {
        error_log('Missing score ID in delete request');
        echo json_encode(['success' => false, 'message' => 'Missing score ID']);
        return;
    }

    $scoreId = (int)$data['score_id'];
    error_log('Attempting to delete score ID: ' . $scoreId);

    try {
        // Delete score from database
        $stmt = $pdo->prepare("DELETE FROM scores WHERE score_id = ?");
        $stmt->execute([$scoreId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Score deleted successfully']);
            error_log('Score deleted successfully');
        } else {
            echo json_encode(['success' => false, 'message' => 'Score not found']);
            error_log('Score not found for deletion');
        }
    } catch (PDOException $e) {
        $errorMessage = 'Database error: ' . $e->getMessage();
        error_log($errorMessage);
        echo json_encode(['success' => false, 'message' => $errorMessage]);
    }
}
?>