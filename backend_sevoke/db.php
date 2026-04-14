<?php
// Detect if we are on localhost
$isLocal = ($_SERVER['REMOTE_ADDR'] == '127.0.0.1' || $_SERVER['HTTP_HOST'] == 'localhost');

if ($isLocal) {
    // LOCAL SETTINGS (XAMPP)
    $host = "localhost";
    $db_name = "sevoke_local";
    $username = "root";
    $password = "";
} else {
    // LIVE SETTINGS (HOSTINGER)
    $host = "127.0.0.1";
    $db_name = "u715656778_sevoke_realty"; 
    $username = "u715656778_sevokerealty"; 
    $password = "Consultica@12345"; 
}

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["error" => "Connection failed"]));
}