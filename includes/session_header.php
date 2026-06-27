<?php
// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Set no-cache headers to prevent caching pages with user data
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");

// Check if user is logged in
$isLoggedIn = isset($_SESSION['user_id']);

// For pages that require authentication, redirect if not logged in
if (defined('REQUIRE_LOGIN') && REQUIRE_LOGIN && !$isLoggedIn) {
    header('Location: /login');
    exit;
}
?>
