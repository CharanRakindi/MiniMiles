<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');

function logLoginError($message) {
    error_log("[Login Error] " . $message);
}

try {
    try {
        require_once __DIR__ . '/includes/db_connect.php';
        require_once __DIR__ . '/models/User.php';
    } catch (Throwable $e) {
        logLoginError("Failed to include required files: " . $e->getMessage());
        throw new Exception("System error: Failed to load required components");
    }
    
    ob_end_clean();
    header('Content-Type: application/json');
    
    $conn = connect_db();
    if (!$conn) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
        exit;
    }
    
    $userModel = new User($conn);
    
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? ''; 
    
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Email and password are required']);
        exit;
    }
    
    $result = $userModel->login($email, $password);
    
    if ($result['success']) {
        if (session_status() == PHP_SESSION_NONE) {
            session_set_cookie_params([
                'lifetime' => 0,
                'path' => '/',
                'domain' => $_SERVER['HTTP_HOST'],
                'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
                'httponly' => true,
                'samesite' => 'Lax'
            ]);
            session_start();
        }
        
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id' => $result['user']['id'],
            'name' => $result['user']['name'],
            'email' => $result['user']['email'],
            'profilePic' => $result['user']['profilePic']
        ];
        $_SESSION['last_activity'] = time();

        $result['redirect'] = '/minimiles/index.html';
    }

    echo json_encode($result);
    
} catch (Throwable $e) {
    logLoginError($e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    if (ob_get_length()) ob_end_clean();
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false, 
        'message' => 'Authentication failed. Please try again or contact support.'
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
?>