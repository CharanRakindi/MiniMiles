<?php
ob_start();
while (ob_get_level() > 0) {
    ob_end_clean();
}
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-errors.log');

if (!file_exists(__DIR__ . '/includes/db_connect.php') || !file_exists(__DIR__ . '/models/User.php')) {
    error_log("[update_profile.php] Required file missing: db_connect.php=" . __DIR__ . '/includes/db_connect.php' . ", User.php=" . __DIR__ . '/models/User.php');
    echo json_encode(['success' => false, 'message' => 'Server configuration error.']);
    exit;
}
require_once __DIR__ . '/includes/db_connect.php';
require_once __DIR__ . '/models/User.php';

header('Content-Type: application/json');

try {
    session_start();

    $conn = connect_db();
    error_log("[update_profile.php] Database connection: " . ($conn ? 'Success' : 'Failed'));
    if (!$conn) {
        error_log("[update_profile.php] Database connection failed.");
        echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
        exit;
    }

    $userModel = new User($conn);
    $userId = null;
    if (isset($_POST['user_id']) && is_numeric($_POST['user_id'])) {
        $userId = (int)$_POST['user_id'];
    } elseif (isset($_SESSION['user']['id'])) {
        $userId = $_SESSION['user']['id'];
    }
    if (!$userId) {
        error_log("[update_profile.php] User ID not found in session or POST data.");
        echo json_encode(['success' => false, 'message' => 'User not authenticated.']);
        exit;
    }

    $fullName = isset($_POST['full_name']) ? trim($_POST['full_name']) : '';
    $removePhoto = isset($_POST['remove_photo']) && $_POST['remove_photo'] === '1';
    $profilePhoto = isset($_FILES['profile_photo']) ? $_FILES['profile_photo'] : null;

    if (empty($fullName)) {
        echo json_encode(['success' => false, 'message' => 'Full name is required.']);
        exit;
    }

    $currentUser = $userModel->getUserById($userId);
    error_log("[update_profile.php] Current user: " . json_encode($currentUser));
    if (!$currentUser) {
        error_log("[update_profile.php] User not found for ID: $userId");
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit;
    }

    $profilePhotoPath = $currentUser['profile_pic_path'];

    if ($removePhoto) {
        error_log("[update_profile.php] Attempting to remove photo: " . __DIR__ . '/' . $profilePhotoPath);
        if ($profilePhotoPath && file_exists(__DIR__ . '/' . $profilePhotoPath)) {
            if (!unlink(__DIR__ . '/' . $profilePhotoPath)) {
                error_log("[update_profile.php] Failed to remove profile photo: $profilePhotoPath");
            } else {
                error_log("[update_profile.php] Removed profile photo: $profilePhotoPath");
            }
        }
        $profilePhotoPath = null;
    } elseif ($profilePhoto && $profilePhoto['error'] === UPLOAD_ERR_OK) {
        $validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxFileSize = 2 * 1024 * 1024; // 2MB

        if (!in_array($profilePhoto['type'], $validImageTypes)) {
            echo json_encode(['success' => false, 'photo_error' => 'Invalid image type. Use JPEG, PNG, GIF, or WEBP.']);
            exit;
        }

        if ($profilePhoto['size'] > $maxFileSize) {
            echo json_encode(['success' => false, 'photo_error' => 'Image size exceeds 2MB.']);
            exit;
        }

        $uploadDir = 'Uploads/profile_photos/';
        if (!is_dir(__DIR__ . '/' . $uploadDir)) {
            mkdir(__DIR__ . '/' . $uploadDir, 0755, true);
        }

        if ($profilePhotoPath && file_exists(__DIR__ . '/' . $profilePhotoPath)) {
            unlink(__DIR__ . '/' . $profilePhotoPath);
        }

        $fileExtension = pathinfo($profilePhoto['name'], PATHINFO_EXTENSION);
        $newFileName = 'user_' . $userId . '_' . time() . '.' . $fileExtension;
        $destination = $uploadDir . $newFileName;

        if (move_uploaded_file($profilePhoto['tmp_name'], __DIR__ . '/' . $destination)) {
            $profilePhotoPath = $destination;
        } else {
            error_log("[update_profile.php] Failed to move uploaded file to: $destination");
            echo json_encode(['success' => false, 'photo_error' => 'Failed to upload photo.']);
            exit;
        }
    }

    $nameUpdated = $userModel->updateName($userId, $fullName);
    $photoUpdated = $userModel->updateProfilePhoto($userId, $profilePhotoPath);

    error_log("[update_profile.php] Name updated: " . ($nameUpdated ? 'Success' : 'Failed'));
    error_log("[update_profile.php] Photo updated: " . ($photoUpdated ? 'Success' : 'Failed'));

    if ($nameUpdated || $photoUpdated) {
        $_SESSION['user']['name'] = $fullName;
        $_SESSION['user']['profilePic'] = $profilePhotoPath;

        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'name' => $fullName,
            'profile_photo' => $profilePhotoPath
        ]);
    } else {
        error_log("[update_profile.php] Failed to update user profile for ID: $userId");
        echo json_encode(['success' => false, 'message' => 'Failed to update profile.']);
    }

    exit;

} catch (Exception $e) {
    error_log("[update_profile.php] Exception: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Error updating profile: ' . $e->getMessage()]);
    exit;
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
    if (ob_get_level() > 0 && !headers_sent()) {
        ob_end_clean();
    }
}