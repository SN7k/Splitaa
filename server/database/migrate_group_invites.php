<?php
require_once __DIR__ . '/../config/database.php';

try {
    $db = Database::getInstance();
    
    echo "Running migration: create_group_invites_table.sql\n";
    
    // Read the SQL file
    $sql = file_get_contents(__DIR__ . '/create_group_invites_table.sql');
    
    if ($sql === false) {
        throw new Exception("Failed to read SQL file");
    }
    
    // Execute the SQL
    $result = $db->execute($sql);
    
    if ($result !== false) {
        echo "✓ Successfully created group_invites table\n";
        echo "Migration completed successfully!\n";
    } else {
        echo "✗ Failed to create table\n";
    }
    
} catch (Exception $e) {
    echo "✗ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
