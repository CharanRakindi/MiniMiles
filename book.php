<?php
// Start output buffering immediately
ob_start();

// Register shutdown function to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_end_clean();
        header('Content-Type: application/json; charset=UTF-8');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Fatal error occurred: ' . $error['message'],
            'details' => [
                'file' => $error['file'],
                'line' => $error['line']
            ]
        ]);
        error_log('[book.php] Fatal Error: ' . print_r($error, true));
    }
});

// Error reporting and logging
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');

// Set headers
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit;
}

try {
    error_log('[book.php] Script started');

    // Check file existence
    error_log('[book.php] Checking file includes');
    if (!file_exists('includes/db_connect.php')) {
        throw new Exception('Database connection file not found');
    }
    if (!file_exists('models/Booking.php')) {
        throw new Exception('Booking model file not found');
    }

    // Include dependencies
    error_log('[book.php] Including files');
    require_once 'includes/db_connect.php';
    require_once 'models/Booking.php';

    function logBookingError($message) {
        error_log('[Booking Error] ' . $message);
    }

    // Verify request method
    error_log('[book.php] Checking request method');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Log POST data
    error_log('[book.php] Raw POST data: ' . file_get_contents('php://input'));
    error_log('[book.php] POST array: ' . print_r($_POST, true));

    // Connect to database
    error_log('[book.php] Connecting to database');
    $conn = connect_db();
    if (!$conn) {
        throw new Exception('Database connection failed.');
    }

    // Sanitize inputs
    error_log('[book.php] Sanitizing inputs');
    $destination_id = isset($_POST['destination']) ? sanitize_input($_POST['destination']) : '';
    $name = isset($_POST['name']) ? sanitize_input($_POST['name']) : '';
    $email = isset($_POST['email']) ? filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL) : '';
    $check_in = isset($_POST['check_in_date']) ? $_POST['check_in_date'] : '';
    $check_out = isset($_POST['check_out_date']) ? $_POST['check_out_date'] : '';
    $guests = (int)(isset($_POST['guests']) ? $_POST['guests'] : 0);
    $notes = isset($_POST['notes']) ? sanitize_input($_POST['notes']) : '';

    // Log sanitized inputs
    error_log('[book.php] Sanitized inputs: ' . json_encode([
        'destination_id' => $destination_id,
        'name' => $name,
        'email' => $email,
        'check_in' => $check_in,
        'check_out' => $check_out,
        'guests' => $guests,
        'notes' => $notes
    ]));

    // Validate inputs
    error_log('[book.php] Validating inputs');
    if (empty($destination_id)) {
        throw new Exception('Destination ID is required.');
    }
    if (empty($name)) {
        throw new Exception('Name is required.');
    }
    if (empty($email)) {
        throw new Exception('Email is required.');
    }
    if (empty($check_in) || ($check_out && strtotime($check_in) > strtotime($check_out))) {
        throw new Exception('Invalid check-in/check-out dates.');
    }
    if ($guests <= 0) {
        throw new Exception('Number of guests must be greater than 0.');
    }

    // Check destination exists
    error_log('[book.php] Checking destination');
    $destCheckStmt = $conn->prepare("SELECT destination_id FROM destinations WHERE destination_id = ?");
    if (!$destCheckStmt) {
        throw new Exception("Failed to prepare destination check query: " . $conn->error);
    }
    $destCheckStmt->bind_param("s", $destination_id);
    if (!$destCheckStmt->execute()) {
        throw new Exception("Failed to execute destination check query: " . $destCheckStmt->error);
    }
    $destCheckResult = $destCheckStmt->get_result();
    if ($destCheckResult->num_rows === 0) {
        throw new Exception('The selected destination does not exist.');
    }
    $destCheckStmt->close();

    // Create booking
    error_log('[book.php] Creating booking');
    $bookingModel = new Booking($conn);
    $result = $bookingModel->create($destination_id, $name, $email, $check_in, $check_out, $guests, $notes);

    // Return response
    error_log('[book.php] Sending response');
    ob_end_clean();
    echo json_encode($result);

} catch (Exception $e) {
    logBookingError('Exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());
    logBookingError('Stack trace: ' . $e->getTraceAsString());
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while processing your booking: ' . $e->getMessage(),
        'details' => [
            'type' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
} catch (Error $e) {
    logBookingError('Fatal Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());
    logBookingError('Stack trace: ' . $e->getTraceAsString());
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'A fatal error occurred: ' . $e->getMessage(),
        'details' => [
            'type' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
    error_log('[book.php] Script ended');
}
?>