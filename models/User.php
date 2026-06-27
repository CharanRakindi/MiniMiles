<?php
class User {
    private $conn;
    private $id;
    private $name;
    private $email;
    
    public function __construct($db) {
        if (!$db instanceof mysqli) {
            error_log("User class instantiated with invalid database connection object.");
            throw new Exception("Invalid database connection.");
        }
        $this->conn = $db;
    }
    
    public function register($name, $email, $password) {
        $emailExistsResult = $this->emailExists($email);
        if (isset($emailExistsResult['success']) && !$emailExistsResult['success']) {
            return $emailExistsResult;
        }
        if ($emailExistsResult === true) {
            return [
                'success' => false, 
                'message' => 'This email is already registered. Please log in.'
            ];
        }
        
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        $sql = "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)";
        $stmt = $this->conn->prepare($sql);
        if ($stmt === false) {
            error_log("Prepare failed in User->register: " . $this->conn->error . ". SQL: " . $sql);
            return ['success' => false, 'message' => 'Database error during registration preparation.'];
        }
        
        $stmt->bind_param("sss", $name, $email, $hashed_password);
        
        if ($stmt->execute()) {
            $stmt->close();
            return ['success' => true, 'message' => 'Registered successfully!'];
        } else {
            error_log("Insert error in User->register: " . $stmt->error);
            $stmt->close();
            if ($this->conn->errno == 1062) {
                 return ['success' => false, 'message' => 'This email is already registered. (Duplicate Key)'];
            }
            return ['success' => false, 'message' => 'An error occurred during registration execution.'];
        }
    }
    
    public function login($email, $password) {
        try {
            if (empty($email) || empty($password)) {
                return ['success' => false, 'message' => 'Email and password are required'];
            }
            
            $sql = "SELECT id, full_name, email, password, profile_pic_path FROM users WHERE email = ?";
            $stmt = $this->conn->prepare($sql);
            
            if ($stmt === false) {
                error_log("SQL prepare failed in User->login: " . $this->conn->error);
                return ['success' => false, 'message' => 'Database error occurred during login preparation.'];
            }
            
            $stmt->bind_param("s", $email);
            if (!$stmt->execute()) {
                error_log("SQL execute failed in User->login: " . $stmt->error);
                $stmt->close();
                return ['success' => false, 'message' => 'Database error occurred during login execution.'];
            }
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                $stmt->close();
                return ['success' => false, 'message' => 'Invalid email or password (user not found).'];
            }
            
            $row = $result->fetch_assoc();
            $hashed_password = $row['password'];
            
            if (password_verify($password, $hashed_password)) {
                $this->id = $row['id'];
                $this->name = $row['full_name'];
                $this->email = $row['email'];
                
                $profilePic = !empty($row['profile_pic_path']) ? $row['profile_pic_path'] : '/minimiles/images/default-avatar.png';
                
                if (strpos($profilePic, 'minimiles.wuaze.com') !== false) {
                    $profilePic = str_replace('https://minimiles.wuaze.com/', '/minimiles/', $profilePic);
                }
                
                $stmt->close();
                return [
                    'success' => true,
                    'user' => [
                        'id' => $row['id'],
                        'name' => $row['full_name'],
                        'email' => $row['email'],
                        'profilePic' => $profilePic
                    ]
                ];
            } else {
                error_log("Password verification failed for user: $email");
                $stmt->close();
                return ['success' => false, 'message' => 'Invalid email or password.'];
            }
        } catch (Exception $e) {
            error_log("Login exception: " . $e->getMessage());
            return ['success' => false, 'message' => 'An error occurred during login: ' . $e->getMessage()];
        }
    }
    
    private function emailExists($email) {
        $sql = "SELECT id FROM users WHERE email = ?";
        $stmt = $this->conn->prepare($sql);

        if ($stmt === false) {
            error_log("Prepare failed in User->emailExists: " . $this->conn->error . ". SQL: " . $sql);
            return ['success' => false, 'message' => 'Database error checking email.'];
        }

        $stmt->bind_param("s", $email);
        if (!$stmt->execute()) {
            error_log("Execute failed in User->emailExists: " . $stmt->error);
            $stmt->close();
            return ['success' => false, 'message' => 'Database error executing email check.'];
        }
        $stmt->store_result();
        
        $num_rows = $stmt->num_rows;
        $stmt->close();
        return $num_rows > 0;
    }
    
    public function updateName($userId, $name) {
        try {
            $sql = "UPDATE users SET full_name = ? WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            
            if (!$stmt) {
                error_log("Prepare failed in User->updateName: " . $this->conn->error);
                return false;
            }
            
            $stmt->bind_param("si", $name, $userId);
            $result = $stmt->execute();
            $stmt->close();
            
            if (!$result) {
                error_log("Update name failed for user ID: $userId");
            }
            return $result;
        } catch (Exception $e) {
            error_log("Error updating user name: " . $e->getMessage());
            return false;
        }
    }
    
    public function updateProfilePhoto($userId, $photoPath) {
        try {
            $sql = "UPDATE users SET profile_pic_path = ? WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            
            if (!$stmt) {
                error_log("Prepare failed in User->updateProfilePhoto: " . $this->conn->error);
                return false;
            }
            
            $stmt->bind_param("si", $photoPath, $userId);
            $result = $stmt->execute();
            $stmt->close();
            
            if (!$result) {
                error_log("Update profile photo failed for user ID: $userId");
            }
            return $result;
        } catch (Exception $e) {
            error_log("Error updating profile photo: " . $e->getMessage());
            return false;
        }
    }
    
    public function getUserById($userId) {
        try {
            $sql = "SELECT id, full_name, email, profile_pic_path FROM users WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            
            if (!$stmt) {
                error_log("Prepare failed in User->getUserById: " . $this->conn->error);
                return false;
            }
            
            $stmt->bind_param("i", $userId);
            
            if (!$stmt->execute()) {
                error_log("Execute failed in User->getUserById: " . $stmt->error);
                $stmt->close();
                return false;
            }
            
            $result = $stmt->get_result();
            if ($result->num_rows === 0) {
                $stmt->close();
                return false;
            }
            
            $user = $result->fetch_assoc();
            $stmt->close();
            
            return $user;
        } catch (Exception $e) {
            error_log("Error getting user by ID: " . $e->getMessage());
            return false;
        }
    }
}
?>