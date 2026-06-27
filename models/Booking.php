<?php
// Log inclusion
error_log('[Booking.php] File included: ' . __FILE__);

// Prevent class redeclaration
if (!class_exists('Booking')) {
    class Booking {
        private $conn;
        private $max_guests_per_room = 4;

        public function __construct($conn) {
            $this->conn = $conn;
        }

        public function getByUser($email) {
            error_log('[Booking.php] getByUser called for email: ' . $email);
            try {
                $query = "SELECT b.booking_id, b.user_id, b.destination_id, b.full_name, b.email, 
                                 b.check_in_date, b.check_out_date, b.guests, b.notes, b.status, 
                                 d.name AS destination_name 
                          FROM bookings b 
                          LEFT JOIN destinations d ON b.destination_id = d.destination_id 
                          WHERE b.email = ?";
                error_log('[Booking.php] Query: ' . $query);
                $stmt = $this->conn->prepare($query);
                if (!$stmt) {
                    throw new Exception('Prepare failed: ' . $this->conn->error);
                }
                $stmt->bind_param('s', $email);
                if (!$stmt->execute()) {
                    throw new Exception('Execute failed: ' . $stmt->error);
                }
                $result = $stmt->get_result();
                $bookings = [];
                while ($row = $result->fetch_assoc()) {
                    $bookings[] = $row;
                }
                $stmt->close();
                error_log('[Booking.php] Retrieved ' . count($bookings) . ' bookings for email: ' . $email);
                return $bookings;
            } catch (Exception $e) {
                error_log('[Booking.php] getByUser error: ' . $e->getMessage());
                throw $e;
            }
        }

        private function getRoomCount($destination_id) {
            error_log('[Booking.php] Getting room count for: ' . $destination_id);
            $sql = "SELECT room_capacity AS room_count FROM destinations WHERE destination_id = ?";
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }
            $stmt->bind_param("s", $destination_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            $room_count = $row ? (int)$row['room_count'] : 0;
            error_log('[Booking.php] Room count: ' . $room_count);
            if ($room_count <= 0) {
                throw new Exception("Invalid room count for destination: $destination_id");
            }
            return $room_count;
        }

        private function isRoomAvailable($destination_id, $check_in, $check_out) {
            error_log('[Booking.php] Checking availability for: ' . $destination_id . ', check_in: ' . $check_in . ', check_out: ' . ($check_out ?: 'null'));
            if (!$check_out) {
                $check_out = $check_in;
            }
            $sql = "SELECT COUNT(*) as booking_count 
                    FROM bookings 
                    WHERE destination_id = ? 
                    AND status = 'Confirmed'
                    AND check_in_date <= ?
                    AND (check_out_date >= ? OR (check_out_date IS NULL AND check_in_date = ?))
                    AND (check_out_date >= CURDATE() OR check_out_date IS NULL)";
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                throw new Exception("Prepare failed: " . $this->conn->error);
            }
            $log_sql = sprintf("SELECT COUNT(*) as booking_count 
                    FROM bookings 
                    WHERE destination_id = '%s' 
                    AND status = 'Confirmed'
                    AND check_in_date <= '%s'
                    AND (check_out_date >= '%s' OR (check_out_date IS NULL AND check_in_date = '%s'))
                    AND (check_out_date >= CURDATE() OR check_out_date IS NULL)",
                    $destination_id, $check_out, $check_in, $check_in);
            error_log('[Booking.php] Availability query: ' . $log_sql);
            $stmt->bind_param("ssss", $destination_id, $check_out, $check_in, $check_in);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stmt->close();
            
            $booking_count = (int)$row['booking_count'];
            $room_count = $this->getRoomCount($destination_id);
            
            error_log('[Booking.php] Booking count: ' . $booking_count . ', Room count: ' . $room_count);
            return $booking_count < $room_count;
        }

        public function create($destination_id, $name, $email, $check_in, $check_out, $guests, $notes = '') {
            error_log('[Booking.php] Creating booking: ' . json_encode([
                'destination_id' => $destination_id,
                'full_name' => $name,
                'email' => $email,
                'check_in' => $check_in,
                'check_out' => $check_out ?: 'null',
                'guests' => $guests,
                'notes' => $notes
            ]));

            if ($guests > $this->max_guests_per_room) {
                error_log('[Booking.php] Too many guests: ' . $guests . ' exceeds max: ' . $this->max_guests_per_room);
                return [
                    'success' => false,
                    'status' => 'invalid_guests',
                    'message' => 'Number of guests exceeds maximum per room (' . $this->max_guests_per_room . ').'
                ];
            }

            $this->conn->begin_transaction();
            try {
                if (!$this->isRoomAvailable($destination_id, $check_in, $check_out)) {
                    error_log('[Booking.php] Rooms full for: ' . $destination_id);
                    $this->conn->rollback();
                    return [
                        'success' => false,
                        'status' => 'rooms_full',
                        'message' => 'No rooms available for the selected dates.'
                    ];
                }

                $user_id = 1;
                $sql = "INSERT INTO bookings (user_id, destination_id, full_name, email, check_in_date, check_out_date, guests, notes, status) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')";
                $stmt = $this->conn->prepare($sql);
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $this->conn->error);
                }
                
                $check_out = $check_out ?: null;
                $type_string = "isssssis";
                error_log('[Booking.php] Binding params with type: ' . $type_string . ', values: ' . json_encode([
                    'user_id' => $user_id,
                    'destination_id' => $destination_id,
                    'full_name' => $name,
                    'email' => $email,
                    'check_in' => $check_in,
                    'check_out' => $check_out,
                    'guests' => $guests,
                    'notes' => $notes
                ]));
                
                $params = [$user_id, $destination_id, $name, $email, $check_in, &$check_out, $guests, $notes];
                $stmt->bind_param($type_string, ...$params);
                
                if (!$stmt->execute()) {
                    throw new Exception("Execute failed: " . $stmt->error);
                }
                
                $booking_id = $this->conn->insert_id;
                $stmt->close();
                
                $this->conn->commit();
                error_log('[Booking.php] Booking created, ID: ' . $booking_id);
                return [
                    'success' => true,
                    'booking_id' => $booking_id,
                    'message' => 'Booking created successfully.'
                ];
            } catch (Exception $e) {
                $this->conn->rollback();
                error_log('[Booking.php] Error: ' . $e->getMessage());
                return [
                    'success' => false,
                    'message' => 'Booking failed: ' . $e->getMessage()
                ];
            }
        }

        public function cancelBooking($booking_id, $user_email) {
            error_log('[Booking.php] Cancel booking called for booking_id: ' . $booking_id . ', email: ' . $user_email);
            try {
                // Verify the booking belongs to the user and is cancellable
                $sql = "SELECT check_in_date, status FROM bookings WHERE booking_id = ? AND email = ?";
                $stmt = $this->conn->prepare($sql);
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $this->conn->error);
                }
                $stmt->bind_param("is", $booking_id, $user_email);
                if (!$stmt->execute()) {
                    throw new Exception("Execute failed: " . $stmt->error);
                }
                $result = $stmt->get_result();
                $booking = $result->fetch_assoc();
                $stmt->close();

                if (!$booking) {
                    error_log('[Booking.php] Booking not found or not owned by user: ' . $booking_id);
                    return [
                        'success' => false,
                        'message' => 'Booking not found or you do not have permission to cancel it.'
                    ];
                }

                if ($booking['status'] === 'Cancelled') {
                    error_log('[Booking.php] Booking already cancelled: ' . $booking_id);
                    return [
                        'success' => false,
                        'message' => 'Booking is already cancelled.'
                    ];
                }

                $check_in_date = new DateTime($booking['check_in_date']);
                $current_date = new DateTime();
                if ($check_in_date < $current_date) {
                    error_log('[Booking.php] Cannot cancel past booking: ' . $booking_id);
                    return [
                        'success' => false,
                        'message' => 'Cannot cancel a booking after the check-in date.'
                    ];
                }

                // Update the booking status to Cancelled
                $sql = "UPDATE bookings SET status = 'Cancelled' WHERE booking_id = ?";
                $stmt = $this->conn->prepare($sql);
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $this->conn->error);
                }
                $stmt->bind_param("i", $booking_id);
                if (!$stmt->execute()) {
                    throw new Exception("Execute failed: " . $stmt->error);
                }
                $stmt->close();

                error_log('[Booking.php] Booking cancelled successfully: ' . $booking_id);
                return [
                    'success' => true,
                    'message' => 'Booking cancelled successfully.'
                ];
            } catch (Exception $e) {
                error_log('[Booking.php] Cancel booking error: ' . $e->getMessage());
                return [
                    'success' => false,
                    'message' => 'Failed to cancel booking: ' . $e->getMessage()
                ];
            }
        }
    }
}
?>