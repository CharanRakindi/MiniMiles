<?php
/**
 * Rating Model
 * Handles ratings and reviews for destinations
 */
class Rating {
    private $conn;
    
    /**
     * Constructor
     * @param mysqli $db Database connection
     */
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Get ratings for a destination
     * @param string $destinationId Destination ID
     * @return array Array of ratings
     */
    public function getByDestination($destinationId) {
        $ratings = [];
        
        try {
            $sql = "SELECT * FROM ratings WHERE resort_id = ? ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($sql);
            
            if ($stmt === false) {
                error_log("Prepare failed in Rating->getByDestination: " . $this->conn->error);
                return $ratings;
            }
            
            $stmt->bind_param("s", $destinationId);
            
            if (!$stmt->execute()) {
                error_log("Execute failed in Rating->getByDestination: " . $stmt->error);
                return $ratings;
            }
            
            $result = $stmt->get_result();
            
            while ($row = $result->fetch_assoc()) {
                $ratings[] = $row;
            }
            
            $stmt->close();
            
        } catch (Exception $e) {
            error_log("Exception in Rating->getByDestination: " . $e->getMessage());
        }
        
        return $ratings;
    }
    
    /**
     * Add a rating for a destination
     * @param string $destinationId Destination ID
     * @param string $userName User name
     * @param int $rating Rating value (1-5)
     * @param string $review Review text
     * @return array Operation result
     */
    public function create($destinationId, $userName, $rating, $review) {
        try {
            // Validate inputs
            if (empty($destinationId)) {
                return ['success' => false, 'message' => 'Destination ID is required'];
            }
            
            if (empty($userName)) {
                return ['success' => false, 'message' => 'Name is required'];
            }
            
            if (!is_numeric($rating) || $rating < 1 || $rating > 5) {
                return ['success' => false, 'message' => 'Rating must be between 1 and 5'];
            }
            
            // Insert rating
            $sql = "INSERT INTO ratings (resort_id, user_name, rating, review) VALUES (?, ?, ?, ?)";
            $stmt = $this->conn->prepare($sql);
            
            if ($stmt === false) {
                error_log("Prepare failed in Rating->create: " . $this->conn->error);
                return ['success' => false, 'message' => 'Database error occurred'];
            }
            
            $stmt->bind_param("ssis", $destinationId, $userName, $rating, $review);
            
            if ($stmt->execute()) {
                return [
                    'success' => true,
                    'message' => 'Rating submitted successfully',
                    'rating_id' => $this->conn->insert_id
                ];
            } else {
                error_log("Execute failed in Rating->create: " . $stmt->error);
                return ['success' => false, 'message' => 'Failed to submit rating'];
            }
            
        } catch (Exception $e) {
            error_log("Exception in Rating->create: " . $e->getMessage());
            return ['success' => false, 'message' => 'An error occurred while submitting your rating'];
        }
    }
}
?>
