<?php
ob_start(); // Ensure this is the VERY FIRST line.

// Attempt to set timezone directly in this script
$set_result = date_default_timezone_set('Asia/Delhi');
error_log("[get_bookings.php] Attempted to set timezone to Asia/Delhi directly. Result: " . ($set_result ? 'Success' : 'Failure'));
$timezone_at_start = date_default_timezone_get();
error_log("[get_bookings.php] Timezone at very start of script (after direct set): " . $timezone_at_start);

error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable HTML error output for API responses
ini_set('log_errors', 1); // Ensure errors are logged
ini_set('error_log', __DIR__ . '/php-errors.log'); // Specify error log file

// Import dependencies
require_once 'includes/db_connect.php'; // db_connect.php also tries to set it
require_once 'models/Booking.php';

// Log timezone immediately after includes
$timezone_after_includes = date_default_timezone_get();
error_log("[get_bookings.php] Timezone immediately after includes (db_connect.php should have run): " . $timezone_after_includes);

// Set JSON response header
ob_end_clean(); // Clean buffer before sending headers
header('Content-Type: application/json');

try {
    // Connect to database
    $conn = connect_db();
    if (!$conn) {
        // connect_db() should handle JSON error output and exit.
        // This is a fallback if it somehow doesn't.
        error_log("[get_bookings.php] Database connection failed in try block.");
        echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
        exit;
    }
    
    // Get email parameter
    $email = '';
    if (isset($_POST['email']) && !empty($_POST['email'])) {
        $email = $_POST['email'];
    } elseif (isset($_GET['email']) && !empty($_GET['email'])) {
        $email = $_GET['email'];
    }
    
    if (empty($email)) {
        error_log("[get_bookings.php] Email parameter is missing.");
        echo json_encode(['success' => false, 'message' => 'Email parameter is required.']);
        exit;
    }
    
    error_log("[get_bookings.php] Fetching bookings for email: " . $email);
    
    // Create booking model instance
    $bookingModel = new Booking($conn);
    
    // Get bookings for the email
    $bookings = $bookingModel->getByUser($email);
    
    error_log("[get_bookings.php] Retrieved " . (is_array($bookings) ? count($bookings) : '0 or non-array') . " bookings for email: " . $email . ". Data: " . json_encode($bookings));
    
    // Separate bookings into upcoming and past
    $server_timezone = date_default_timezone_get();
    $today = date('Y-m-d');
    error_log("[get_bookings.php] Server Timezone: " . $server_timezone . ". Current 'today' on server: " . $today);

    $upcomingBookings = [];
    $pastBookings = [];
    
    if (is_array($bookings)) {
        foreach ($bookings as $booking) {
            $check_in_date_str = isset($booking['check_in_date']) ? $booking['check_in_date'] : 'NOT SET';
            $destination_name_log = isset($booking['destination_name']) ? $booking['destination_name'] : (isset($booking['destination_id']) ? $booking['destination_id'] : 'Unknown Destination');
            
            error_log("[get_bookings.php] Processing booking for " . $destination_name_log . ": Check-in date from DB: '" . $check_in_date_str . "'");

            if (isset($booking['check_in_date'])) {
                // Normalize check_in_date to YYYY-MM-DD format for reliable comparison, if it's not already.
                // Assuming it's already in YYYY-MM-DD from the database. If not, conversion is needed.
                $booking_check_in_date = $booking['check_in_date']; 

                if ($booking_check_in_date >= $today) {
                    error_log("[get_bookings.php] -> Classified as UPCOMING ('" . $booking_check_in_date . "' >= '" . $today . "')");
                    $upcomingBookings[] = $booking;
                } else {
                    error_log("[get_bookings.php] -> Classified as PAST ('" . $booking_check_in_date . "' < '" . $today . "')");
                    $pastBookings[] = $booking;
                }
            } else {
                error_log("[get_bookings.php] -> Classified as PAST (check_in_date not set or invalid)");
                // Decide how to handle bookings with missing check_in_date, often they'd be past or errored.
                $pastBookings[] = $booking; 
            }
        }
    } else {
        error_log("[get_bookings.php] Bookings data is not an array for email: " . $email);
    }
    
    error_log("[get_bookings.php] Final Count - Upcoming: " . count($upcomingBookings) . ", Past: " . count($pastBookings));

    // Send response
    echo json_encode([
        'success' => true,
        'message' => 'Bookings retrieved successfully.',
        'upcomingBookings' => $upcomingBookings,
        'pastBookings' => $pastBookings,
        'totalBookings' => is_array($bookings) ? count($bookings) : 0 // Ensure $bookings is an array before count
    ]);
    exit; // Ensure script termination after sending JSON
    
} catch (Exception $e) {
    error_log("[get_bookings.php] Exception: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    echo json_encode([
        'success' => false, 
        'message' => 'Error retrieving bookings: ' . $e->getMessage()
    ]);
    exit; // Ensure script termination after sending error JSON
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
    // Ensure any further accidental output is ignored
    // No need for ob_end_clean() here if exit is used above, but doesn't hurt.
    if (ob_get_level() > 0 && !headers_sent()) { // Check headers_sent before trying to clean
        ob_end_clean();
    }
}
?>
