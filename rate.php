<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); // Turn off direct error display for AJAX
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');


require_once 'includes/db_connect.php';
require_once 'models/Rating.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Log all incoming POST data for debugging
error_log("Rating POST data: " . print_r($_POST, true));

$conn = connect_db();
if (!$conn) {
    // connect_db() now handles JSON error output and exits
    // This is a fallback.
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

$ratingModel = new Rating($conn);

// Sanitize input data, accepting different possible field names
$booking_id = isset($_POST['booking_id']) ? (int)$_POST['booking_id'] : 0;
$resort_id = isset($_POST['resort_id']) ? sanitize_input($_POST['resort_id']) : 
             (isset($_POST['destination_id']) ? sanitize_input($_POST['destination_id']) : '');
$user_name = isset($_POST['user_name']) ? sanitize_input($_POST['user_name']) : '';
$rating = isset($_POST['rating']) ? (int)$_POST['rating'] : 0;
$review = isset($_POST['review']) ? sanitize_input($_POST['review']) : '';

// Basic validation
if (empty($resort_id) || empty($user_name) || $rating < 1 || $rating > 5) {
    echo json_encode([
        'success' => false, 
        'message' => 'Missing or invalid rating data. Please fill all required fields correctly.',
        'debug' => [
            'booking_id' => $booking_id,
            'resort_id' => $resort_id,
            'user_name' => $user_name,
            'rating' => $rating
        ]
    ]);
    $conn->close();
    exit;
}

// Use the Rating model to create a rating
$result = $ratingModel->create($booking_id, $resort_id, $user_name, $rating, $review);
echo json_encode($result);

$conn->close();
?>