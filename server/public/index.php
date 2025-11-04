<?php
// Entry point for the API

// Set content type
header('Content-Type: application/json');

// Note: CORS headers are handled by Apache .htaccess
// Don't add them here to avoid duplicate headers

// Load dependencies
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../routes/api.php';

// Get request URI and method
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove base path if needed
$base_path = '/server/public';
if (strpos($request_uri, $base_path) === 0) {
    $request_uri = substr($request_uri, strlen($base_path));
}

// Route the request
handleRequest($request_uri, $request_method);
