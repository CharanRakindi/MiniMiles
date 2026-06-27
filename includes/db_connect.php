<?php
/**
 * Mini Miles - Database Connection Module
 */

// Start output buffering if not already started
if (ob_get_level() == 0) {
    ob_start();
}

// Set timezone
date_default_timezone_set('Asia/Kolkata');

/**
 * Creates and returns a database connection
 *
 * @return mysqli|null
 */
function connect_db() {
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "minimiles_db";

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        error_log("Connection failed: " . $conn->connect_error);
        return null;
    }

    return $conn;
}

/**
 * Sanitizes input data to prevent XSS and ensure safe database queries
 *
 * @param string $data - The input data to sanitize
 * @return string - Sanitized data
 */
function sanitize_input($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}
?>