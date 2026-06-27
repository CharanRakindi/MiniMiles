<?php
ob_start(); // Start output buffering

// Error reporting settings
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 0 for production

// Set JSON header
header('Content-Type: application/json');

// Debug log array
$debugLog = [];
function logDebug($msg) {
    global $debugLog;
    $debugLog[] = "[" . date('Y-m-d H:i:s') . "] " . $msg;
}

logDebug("Script started");

try {
    // Include dependencies
    logDebug("Including dependencies");
    require_once 'includes/db_connect.php';
    require_once 'models/User.php';
    
    // Connect to database
    $conn = connect_db();
    
    // Create User model
    $userModel = new User($conn);
    
    // Get and sanitize form data
    $full_name = isset($_POST['full_name']) ? sanitize_input($_POST['full_name']) : '';
    $email = isset($_POST['email']) ? filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL) : '';
    $password = $_POST['password'] ?? '';
    
    // Validate form data
    logDebug("Form data received - Name: $full_name, Email: $email, Password length: " . strlen($password));
    
    if (empty($full_name) || empty($email) || empty($password)) {
        logDebug("Validation failed: missing fields");
        echo json_encode([
            'success' => false, 
            'message' => 'All fields are required.', 
            'debugLog' => $debugLog
        ]);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        logDebug("Validation failed: invalid email format");
        echo json_encode([
            'success' => false, 
            'message' => 'Invalid email format.', 
            'debugLog' => $debugLog
        ]);
        exit;
    }
    
    // Register user
    logDebug("Calling User->register()");
    $result = $userModel->register($full_name, $email, $password);
    logDebug("Registration result: " . ($result['success'] ? 'Success' : 'Failed - ' . $result['message']));
    
    // Add debug log to result
    $finalResult = array_merge($result, ['debugLog' => $debugLog]);
    echo json_encode($finalResult);
    
} catch (Throwable $e) {
    logDebug("ERROR: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    logDebug("ERROR TYPE: " . get_class($e));
    
    // Ensure error response is sent as JSON
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred: ' . $e->getMessage(),
        'debugLog' => $debugLog,
        'error_type' => get_class($e)
    ]);
} finally {
    // Clean up
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
        logDebug("Database connection closed");
    }
    logDebug("Script finished");
}
?>