<?php
// Test script for auth API
$data = [
    'username' => 'testuser',
    'password' => 'test123',
    'action' => 'register'
];

$url = 'http://localhost/school4/WEBT/idk/api/auth.php';

$options = [
    'http' => [
        'header' => "Content-type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

echo "Response: " . $result . "\n";

// Test with GET parameter instead
$url2 = 'http://localhost/school4/WEBT/idk/api/auth.php?action=register';
$result2 = file_get_contents($url2, false, $context);
echo "Response with GET param: " . $result2 . "\n";
?>
