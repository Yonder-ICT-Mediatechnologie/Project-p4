<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

try {
    // Read the words.txt file
    $wordsFile = '../words.txt';
    
    if (!file_exists($wordsFile)) {
        throw new Exception('Words file not found');
    }
    
    $content = file_get_contents($wordsFile);
    if ($content === false) {
        throw new Exception('Could not read words file');
    }
    
    // Split content into lines and filter valid words
    $lines = explode("\n", $content);
    $validWords = array();
    $invalidCount = 0;    foreach ($lines as $line) {
        $originalWord = trim($line);
        $word = strtolower($originalWord);
        
        // Skip empty lines
        if (empty($word)) {
            continue;
        }
        
        // Accept words that start with either lowercase or uppercase letters
        if (empty($originalWord) || (!ctype_lower($originalWord[0]) && !ctype_upper($originalWord[0]))) {
            $invalidCount++;
            continue;
        }
        
        // Validate word: exactly 5 characters and only alphabetic
        if (strlen($word) === 5 && preg_match('/^[a-z]+$/', $word)) {
            // Check for duplicates
            if (!in_array($word, $validWords)) {
                $validWords[] = $word;
            }
        } else {
            $invalidCount++;
        }
    }
    
    // Return successful response
    echo json_encode([
        'success' => true,
        'words' => $validWords,
        'stats' => [
            'total_lines' => count($lines),
            'valid_words' => count($validWords),
            'invalid_words' => $invalidCount
        ]
    ]);
    
} catch (Exception $e) {
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'fallback_words' => ['fiets', 'huist', 'blauw', 'grijs', 'groot', 'recht', 'klein', 'maand', 'water', 'licht', 'zwaar', 'snel', 'lang', 'kort', 'breed', 'smal', 'hoog', 'laag', 'warm', 'koud']
    ]);
}
?>
