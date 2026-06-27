<?php
// Load environment variables from .env file
function loadEnv($path = '.env') {
    if (!file_exists($path)) {
        return false;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos(trim($line), '#') !== 0) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
    return true;
}

// Load environment variables
loadEnv();

// Define base URL for the application
// Adjust this if your application is in a subdirectory on your server
// For InfinityFree, if it's at the root of your subdomain (e.g., minimiles.wuaze.com), this is fine.
// If it's in a folder like minimiles.wuaze.com/myproject/, then set it to '/myproject/'
define('BASE_URL', '/'); 

// Database credentials (can be defined here if not using .env or db_connect.php directly)
// However, it's generally better to keep them in db_connect.php or an .env file for InfinityFree.
// define('DB_HOST', 'sqlXXX.infinityfree.com');
// define('DB_NAME', 'if0_XXXXXXXX_minimiles');
// define('DB_USER', 'if0_XXXXXXXX');
// define('DB_PASS', 'your_password');

// Other configurations
// define('SITE_NAME', 'Mini Miles');
// define('DEFAULT_TIMEZONE', 'Asia/Kolkata');
// date_default_timezone_set(DEFAULT_TIMEZONE);

// Error reporting (can be set here for development)
// In production, you might want to log errors to a file instead of displaying them.
// error_reporting(E_ALL);
// ini_set('display_errors', 1); // Set to 0 in production
?>
