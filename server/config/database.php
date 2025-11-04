<?php
// Database configuration
// Check environment
$isProduction = isset($_SERVER['GAE_APPLICATION']) || getenv('DB_HOST');
$isInfinityFree = !$isProduction && isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'infinityfreeapp.com') !== false;

if ($isInfinityFree) {
    // InfinityFree hosting
    define('DB_HOST', 'sql100.infinityfree.com');
    define('DB_NAME', 'if0_40328792_splitaa');
    define('DB_USER', 'if0_40328792');
    define('DB_PASS', 'lSrNqg58Ij37');
    define('JWT_SECRET', 'change-this-secret-key-in-production-12345');
} elseif ($isProduction) {
    // Production (App Engine with Cloud SQL)
    define('DB_HOST', getenv('DB_HOST') ?: '/cloudsql/splitaa:asia-south1:splitaa-db');
    define('DB_NAME', getenv('DB_NAME') ?: 'splitaa_database');
    define('DB_USER', getenv('DB_USER') ?: 'root');
    define('DB_PASS', getenv('DB_PASS') ?: '');
    define('JWT_SECRET', getenv('JWT_SECRET') ?: 'change-this-secret-key');
} else {
    // Local development
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'expense_splitter');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('JWT_SECRET', 'your-secret-key-change-this-in-production');
}

define('DB_CHARSET', 'utf8mb4');
define('JWT_EXPIRY', 86400); // 24 hours

class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            // Check if using Unix socket (Cloud SQL) or TCP (local)
            if (strpos(DB_HOST, '/cloudsql/') === 0) {
                // Cloud SQL connection using Unix socket
                $dsn = "mysql:unix_socket=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            } else {
                // Local connection using TCP
                $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            }
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die(json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ]));
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    public function fetchAll($sql, $params = []) {
        return $this->query($sql, $params)->fetchAll();
    }
    
    public function fetchOne($sql, $params = []) {
        return $this->query($sql, $params)->fetch();
    }
    
    public function execute($sql, $params = []) {
        return $this->query($sql, $params);
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
}
