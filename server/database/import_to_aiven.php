<?php
/**
 * Import schema to Aiven MySQL database
 * Run this script from command line: php import_to_aiven.php
 */

// Aiven MySQL connection details
$host = 'mysql-2d9c8860-splitaa.j.aivencloud.com';
$port = 27429;
$database = 'splitaa_db'; // Use the new database you created
$username = 'avnadmin';
$password = 'AVNS_0DXfZgEbe-Dvl46a0wx';

// Create connection with SSL
$dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    PDO::MYSQL_ATTR_SSL_CA => null
];

try {
    echo "Connecting to Aiven MySQL...\n";
    $pdo = new PDO($dsn, $username, $password, $options);
    echo "✓ Connected successfully!\n\n";

    // Read the schema file
    $schemaFile = __DIR__ . '/schema_aiven.sql';
    if (!file_exists($schemaFile)) {
        throw new Exception("Schema file not found: {$schemaFile}");
    }

    echo "Reading schema file...\n";
    $sql = file_get_contents($schemaFile);
    
    // Remove comments and split SQL into individual statements
    $lines = explode("\n", $sql);
    $cleanedSql = '';
    foreach ($lines as $line) {
        $line = trim($line);
        // Skip empty lines and comment lines
        if (empty($line) || substr($line, 0, 2) === '--') {
            continue;
        }
        $cleanedSql .= $line . "\n";
    }
    
    // Split by semicolon
    $statements = array_filter(
        array_map('trim', explode(';', $cleanedSql)),
        function($statement) {
            return !empty($statement);
        }
    );

    echo "Found " . count($statements) . " SQL statements to execute\n\n";

    // Execute each statement
    $successCount = 0;
    $errorCount = 0;

    foreach ($statements as $index => $statement) {
        $statement = trim($statement);
        if (empty($statement)) {
            continue;
        }

        try {
            $pdo->exec($statement);
            $successCount++;
            
            // Show progress for table creation
            if (stripos($statement, 'CREATE TABLE') !== false) {
                preg_match('/CREATE TABLE[^`]*`?(\w+)`?/i', $statement, $matches);
                $tableName = $matches[1] ?? 'unknown';
                echo "✓ Created table: {$tableName}\n";
            } elseif (stripos($statement, 'INSERT INTO') !== false) {
                echo "✓ Inserted default data\n";
            }
        } catch (PDOException $e) {
            $errorCount++;
            // Show first 100 chars of statement
            $preview = substr($statement, 0, 100);
            echo "✗ Error executing statement: {$preview}...\n";
            echo "  Error: " . $e->getMessage() . "\n\n";
        }
    }

    echo "\n" . str_repeat('=', 50) . "\n";
    echo "Import completed!\n";
    echo "✓ Successful: {$successCount}\n";
    if ($errorCount > 0) {
        echo "✗ Errors: {$errorCount}\n";
    }
    echo str_repeat('=', 50) . "\n\n";

    // Verify tables were created
    echo "Verifying tables...\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Tables in database ({$database}):\n";
    foreach ($tables as $table) {
        echo "  - {$table}\n";
    }
    echo "\nTotal tables: " . count($tables) . "\n";

} catch (PDOException $e) {
    echo "✗ Database connection failed!\n";
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n✓ All done! Your database is ready.\n";
