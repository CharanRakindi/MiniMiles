<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');

set_time_limit(30);

require_once 'includes/db_connect.php';

$debug = [];
function debugLog($message) {
    global $debug;
    $debug[] = date('H:i:s') . " - " . $message;
    error_log("get_destinations.php: $message");
}

debugLog("Script started");

ob_end_clean();
header('Content-Type: application/json');

try {
    debugLog("Connecting to database");
    $conn = connect_db();
    if (!$conn) {
        debugLog("Database connection failed");
        echo json_encode([
            'success' => false, 
            'message' => 'Database connection failed.',
            'debug' => $debug
        ]);
        exit;
    }
    debugLog("Database connection successful");
    
    $id = isset($_GET['id']) ? sanitize_input($_GET['id']) : '';
    $type = isset($_GET['type']) ? sanitize_input($_GET['type']) : '';
    debugLog("Requested type: " . ($type ?: 'none') . ", ID: " . ($id ?: 'none'));
    
    $sql = "SELECT d.*, COALESCE(AVG(r.rating), 0) AS average_rating, COUNT(r.rating_id) AS review_count
            FROM destinations d
            LEFT JOIN ratings r ON d.destination_id = r.resort_id";
    
    $params = [];
    $types = "";
    
    if (!empty($id)) {
        $sql .= " WHERE d.destination_id = ?";
        $params[] = $id;
        $types .= "s";
        debugLog("Added WHERE clause for id: $id");
    } else if (!empty($type) && $type !== 'all') {
        $sql .= " WHERE d.type = ?";
        $params[] = $type;
        $types .= "s";
        debugLog("Added WHERE clause for type: $type");
    }
    
    $sql .= " GROUP BY d.destination_id
              ORDER BY d.name ASC";
    
    debugLog("SQL query: $sql");
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        debugLog("Prepare failed: " . $conn->error);
        echo json_encode([
            'success' => false, 
            'message' => 'Database query preparation failed.',
            'error' => $conn->error,
            'debug' => $debug
        ]);
        exit;
    }
    
    if (!empty($params)) {
        debugLog("Binding parameters");
        $stmt->bind_param($types, ...$params);
    }
    
    debugLog("Executing query");
    $success = $stmt->execute();
    if (!$success) {
        debugLog("Execute failed: " . $stmt->error);
        echo json_encode([
            'success' => false, 
            'message' => 'Database query execution failed.',
            'error' => $stmt->error,
            'debug' => $debug
        ]);
        exit;
    }
    
    $result = $stmt->get_result();
    $destinations = [];
    
    debugLog("Processing results");
    while ($row = $result->fetch_assoc()) {
        if (isset($row['average_rating'])) {
            $row['average_rating'] = floatval($row['average_rating']);
        }
        if (isset($row['review_count'])) {
            $row['review_count'] = intval($row['review_count']);
        }
        
        if (empty($row['image_path'])) {
            $row['image_path'] = '/minimiles/images/placeholder.jpg';
        } else if (!str_starts_with($row['image_path'], '/minimiles/')) {
            $row['image_path'] = '/minimiles/' . ltrim($row['image_path'], '/');
        }
        
        $destinations[] = $row;
    }
    
    $count = count($destinations);
    debugLog("Found $count destinations");
    
    if (!empty($id) && empty($destinations)) {
        echo json_encode([
            'success' => false,
            'message' => 'Destination not found',
            'debug' => $debug
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'destinations' => $destinations,
            'count' => count($destinations),
            'debug' => $debug
        ]);
    }
    
} catch (Exception $e) {
    debugLog("EXCEPTION: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error retrieving destinations: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'debug' => $debug
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
        debugLog("Database connection closed");
    }
}
?>