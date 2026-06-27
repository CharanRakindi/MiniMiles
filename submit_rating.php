<?php
// Start output buffering
ob_start();

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');

// Import dependencies
require_once 'includes/db_connect.php';
require_once 'models/Rating.php';

// Ensure we return JSON
header('Content-Type: application/json');

try {
    // Get form data
    $destinationId = isset($_POST['resort_id']) ? $_POST['resort_id'] : '';
    $userName = isset($_POST['user_name']) ? $_POST['user_name'] : '';
    $rating = isset($_POST['rating']) ? (int)$_POST['rating'] : 0;
    $review = isset($_POST['review']) ? $_POST['review'] : '';

    // Connect to database
    $conn = connect_db();

    // Create Rating model instance
    $ratingModel = new Rating($conn);

    // Add the rating
    $result = $ratingModel->create($destinationId, $userName, $rating, $review);

    // Clean any output before sending response
    ob_end_clean();

    // Return the result
    echo json_encode($result);

} catch (Exception $e) {
    // Log the error
    error_log('Error in submit_rating.php: ' . $e->getMessage());

    // Clean any output before sending response
    ob_end_clean();

    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while submitting your rating'
    ]);
} finally {
    // Close database connection if it exists
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>