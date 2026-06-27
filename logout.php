<?php
// Start output buffering to avoid any unexpected output
ob_start();

// Start or resume session
session_start();

// Clear session data
$_SESSION = array();

// Destroy the session cookie if it exists
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 42000, '/');
}

// Destroy the session
session_destroy();

// Set cache control headers to prevent caching
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");

// Clear any output and set content type
ob_end_clean();
header('Content-Type: application/json');

// Return success response
echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
exit;
?>
