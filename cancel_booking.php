<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');

require_once 'includes/db_connect.php';
require_once 'models/Booking.php';
require_once 'includes/session_header.php';

header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method.');
    }

    if (!isset($_SESSION['user_id']) || !isset($_SESSION['email'])) {
        throw new Exception('User not authenticated. Please log in.');
    }

    $booking_id = isset($_POST['booking_id']) ? (int)$_POST['booking_id'] : 0;
    $user_email = $_SESSION['email'];

    if ($booking_id <= 0) {
        throw new Exception('Invalid booking ID provided.');
    }

    $conn = connect_db();
    if (!$conn) {
        throw new Exception('Database connection failed.');
    }

    $bookingModel = new Booking($conn);
    $result = $bookingModel->cancelBooking($booking_id, $user_email);

    ob_end_clean();
    echo json_encode($result);

} catch (Exception $e) {
    error_log('Cancel booking error: ' . $e->getMessage());
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>