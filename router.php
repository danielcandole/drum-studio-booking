<?php
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (str_starts_with($path, '/database/')) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Direct database access is forbidden.']);
    exit;
}
if ($path !== '/' && is_file(__DIR__ . $path)) {
    return false;
}
if ($path === '/') {
    require __DIR__ . '/index.php';
    exit;
}
return false;
