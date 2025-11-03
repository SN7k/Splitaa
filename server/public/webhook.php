<?php
// Webhook handler for Clerk user events

// Handle CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, svix-id, svix-timestamp, svix-signature');
header('Access-Control-Max-Age: 3600');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

// Get the webhook payload
$payload = file_get_contents('php://input');
$headers = getallheaders();

// Verify webhook signature (optional but recommended)
$svix_id = $headers['svix-id'] ?? '';
$svix_timestamp = $headers['svix-timestamp'] ?? '';
$svix_signature = $headers['svix-signature'] ?? '';

// Parse the payload
$event = json_decode($payload, true);

if (!$event) {
    Response::error('Invalid payload', 400);
}

$eventType = $event['type'] ?? '';
$userData = $event['data'] ?? [];

try {
    $db = Database::getInstance();
    
    switch ($eventType) {
        case 'user.created':
            // New user signed up
            $clerkId = $userData['id'];
            $email = $userData['email_addresses'][0]['email_address'] ?? '';
            $name = trim(($userData['first_name'] ?? '') . ' ' . ($userData['last_name'] ?? ''));
            $name = $name ?: ($email ? explode('@', $email)[0] : 'User');
            $phone = $userData['phone_numbers'][0]['phone_number'] ?? null;
            $avatar = $userData['image_url'] ?? null;
            
            // Check if user already exists
            $existing = $db->fetchOne(
                "SELECT id FROM users WHERE email = ?",
                [$email]
            );
            
            if (!$existing) {
                // Insert new user
                $db->execute(
                    "INSERT INTO users (name, email, password, phone, avatar, created_at) 
                     VALUES (?, ?, ?, ?, ?, NOW())",
                    [$name, $email, password_hash($clerkId, PASSWORD_DEFAULT), $phone, $avatar]
                );
                
                error_log("User created: $email");
            }
            break;
            
        case 'user.updated':
            // User updated their profile
            $email = $userData['email_addresses'][0]['email_address'] ?? '';
            $name = trim(($userData['first_name'] ?? '') . ' ' . ($userData['last_name'] ?? ''));
            $phone = $userData['phone_numbers'][0]['phone_number'] ?? null;
            $avatar = $userData['image_url'] ?? null;
            
            if ($email) {
                $db->execute(
                    "UPDATE users SET name = ?, phone = ?, avatar = ?, updated_at = NOW() 
                     WHERE email = ?",
                    [$name, $phone, $avatar, $email]
                );
                
                error_log("User updated: $email");
            }
            break;
            
        case 'user.deleted':
            // User deleted their account
            $email = $userData['email_addresses'][0]['email_address'] ?? '';
            
            if ($email) {
                $db->execute("DELETE FROM users WHERE email = ?", [$email]);
                error_log("User deleted: $email");
            }
            break;
    }
    
    Response::success('Webhook processed', ['event' => $eventType]);
    
} catch (Exception $e) {
    error_log("Webhook error: " . $e->getMessage());
    Response::error('Webhook processing failed', 500);
}
