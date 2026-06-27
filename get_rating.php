<?php
// Start output buffering immediately to capture any unexpected output
ob_start();

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable HTML error output for API responses
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');

// Import dependencies
require_once 'includes/db_connect.php';
require_once 'models/Rating.php';

// Ensure we only return JSON
header('Content-Type: application/json');

try {
    // Get destination ID from query parameter
    $destinationId = isset($_GET['id']) ? sanitize_input($_GET['id']) : '';
    
    if (empty($destinationId)) {
        // Clean any output before sending response
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Destination ID is required'
        ]);
        exit;
    }
    
    // Connect to database
    $conn = connect_db();
    
    // Create Rating model instance
    $ratingModel = new Rating($conn);
    
    // Get ratings for the destination
    $ratings = $ratingModel->getByDestination($destinationId);
    
    // Calculate average rating
    $averageRating = 0;
    $totalRatings = count($ratings);
    
    if ($totalRatings > 0) {
        $sum = 0;
        foreach ($ratings as $rating) {
            $sum += $rating['rating'];
        }
        $averageRating = $sum / $totalRatings;
    }
    
    // Clean any output before sending response
    ob_end_clean();
    
    // Return success response with ratings data
    echo json_encode([
        'success' => true,
        'message' => 'Ratings retrieved successfully',
        'ratings' => $ratings,
        'average_rating' => $averageRating,
        'count' => $totalRatings
    ]);
    
} catch (Exception $e) {
    // Log the error
    error_log('Error in get_rating.php: ' . $e->getMessage());
    
    // Clean any output before sending response
    ob_end_clean();
    
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while retrieving ratings'
    ]);
} finally {
    // Close database connection if it exists
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>
