<?php
// Start output buffering to capture unexpected output
ob_start();

// Set headers to prevent CORS issues and specify JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS method for CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit;
}

// Error reporting settings
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');

// Import dependencies
require_once 'includes/db_connect.php';

try {
    // Get destination ID
    $destinationId = isset($_GET['id']) ? sanitize_input($_GET['id']) : '';
    
    if (empty($destinationId)) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Destination ID is required'
        ]);
        exit;
    }
    
    // Connect to database
    $conn = connect_db();
    
    // Prepare query to get destination details
    $sql = "SELECT destination_id, name, type, description, image_path, location, price, bookable, latitude, longitude, room_capacity 
            FROM destinations 
            WHERE destination_id = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        throw new Exception("Database query preparation failed: " . $conn->error);
    }
    
    // Bind parameter and execute
    $stmt->bind_param("s", $destinationId);
    
    if (!$stmt->execute()) {
        throw new Exception("Database query execution failed: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        ob_end_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Destination not found'
        ]);
        exit;
    }
    
    // Fetch destination data
    $destination = $result->fetch_assoc();
    
    // Ensure bookable is an integer
    if (isset($destination['bookable'])) {
        $destination['bookable'] = (int)$destination['bookable'];
    }
    
    // Ensure coordinates and room_capacity are properly formatted
    if (isset($destination['latitude'])) {
        $destination['latitude'] = (float)$destination['latitude'];
    }
    if (isset($destination['longitude'])) {
        $destination['longitude'] = (float)$destination['longitude'];
    }
    if (isset($destination['room_capacity'])) {
        $destination['room_capacity'] = (int)$destination['room_capacity'];
    }
    
    // Clean any output and return success response
    ob_end_clean();
    echo json_encode([
        'success' => true,
        'destination' => $destination
    ]);
    
} catch (Exception $e) {
    error_log("Error in get_destination.php: " . $e->getMessage());
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while retrieving the destination'
    ]);
} finally {
    if (isset($stmt) && $stmt !== false) {
        $stmt->close();
    }
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>