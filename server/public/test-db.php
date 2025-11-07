<?php
$host = "mysql-snk007.alwaysdata.net";
$user = "snk007";
$pass = "572486@Snk";
$dbname = "snk007_splitaa_db";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully to AlwaysData DB!";
?>
