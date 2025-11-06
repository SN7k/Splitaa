<?php
/**
 * Test Aiven connection from Render
 * This simulates the production environment
 */

// Aiven connection details (same as Render env vars)
$host = 'mysql-2d9c8860-splitaa.j.aivencloud.com';
$port = 27429;
$database = 'splitaa_db';
$username = 'avnadmin';
$password = 'AVNS_0DXfZgEbe-Dvl46a0wx';

echo "Testing Aiven MySQL Connection...\n";
echo "Host: {$host}\n";
echo "Port: {$port}\n";
echo "Database: {$database}\n";
echo "User: {$username}\n\n";

// Test 1: Check if host is reachable
echo "Test 1: DNS Resolution\n";
$ip = gethostbyname($host);
if ($ip === $host) {
    echo "✗ Failed to resolve hostname\n\n";
} else {
    echo "✓ Resolved to: {$ip}\n\n";
}

// Test 2: Try to connect with SSL
echo "Test 2: PDO Connection with SSL\n";
$dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    PDO::MYSQL_ATTR_SSL_CA => null,
    PDO::ATTR_TIMEOUT => 10
];

try {
    $startTime = microtime(true);
    $pdo = new PDO($dsn, $username, $password, $options);
    $elapsed = round((microtime(true) - $startTime) * 1000, 2);
    
    echo "✓ Connected successfully in {$elapsed}ms\n\n";
    
    // Test 3: Run a simple query
    echo "Test 3: Query Execution\n";
    $stmt = $pdo->query("SELECT DATABASE() as db, VERSION() as version, NOW() as time");
    $result = $stmt->fetch();
    echo "✓ Database: {$result['db']}\n";
    echo "✓ Version: {$result['version']}\n";
    echo "✓ Server Time: {$result['time']}\n\n";
    
    // Test 4: Check tables
    echo "Test 4: List Tables\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "✓ Found " . count($tables) . " tables:\n";
    foreach ($tables as $table) {
        echo "  - {$table}\n";
    }
    echo "\n";
    
    echo "==================================================\n";
    echo "✓ ALL TESTS PASSED! Connection is working.\n";
    echo "==================================================\n";
    
} catch (PDOException $e) {
    $elapsed = round((microtime(true) - $startTime) * 1000, 2);
    echo "✗ Connection failed after {$elapsed}ms\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "Error Code: " . $e->getCode() . "\n\n";
    
    echo "Possible causes:\n";
    echo "1. Aiven IP allowlist blocking connections\n";
    echo "2. SSL/TLS configuration issue\n";
    echo "3. Network/firewall blocking port 27429\n";
    echo "4. Incorrect credentials\n";
    exit(1);
}
