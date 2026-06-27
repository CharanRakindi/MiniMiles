document.addEventListener('DOMContentLoaded', function() {
    console.log("Profile page initializing - Optimized V2");

    document.documentElement.classList.remove('loading-profile');
    document.body.classList.remove('loading-profile');

    const profileContainer = document.querySelector('.profile-container');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editProfileFormEl = document.getElementById('edit-profile-form');
    const updateProfileForm = document.getElementById('update-profile-form');
    const fullNameInput = document.getElementById('full-name');
    const profilePhotoInput = document.getElementById('profile-photo');
    const photoPreview = document.getElementById('photo-preview');
    const updateMessage = document.getElementById('profile-update-message');
    const upcomingBookingsList = document.getElementById('upcoming-bookings-list');
    const pastBookingsList = document.getElementById('past-bookings-list');
    const ratingModal = document.getElementById('ratingModal');
    const closeRatingModal = document.getElementById('closeRatingModal');
    const modalTitle = document.getElementById('modal-title-destination-name');
    const modalBookingId = document.getElementById('modal-booking-id');
    const modalDestinationId = document.getElementById('destination-id-rating-modal');

    let formTransitioning = false;

    function showMessage(element, message, isSuccess) {
        if (element) {
            element.textContent = message;
            element.className = `form-message ${isSuccess ? 'success' : 'error'}`;
            element.style.display = 'block';
            setTimeout(() => {
                element.style.display = 'none';
            }, 3000);
        }
    }

    function ensureAbsolutePath(url) {
        if (!url.startsWith('/')) {
            return '/minimiles/' + url;
        }
        return url.startsWith('/minimiles/') ? url : '/minimiles' + url;
    }

    function initializeProfilePage() {
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');

        if (!userData || !userData.id || !userData.email) {
            console.warn("User data not found in session. Redirecting to login.");
            window.location.replace('/minimiles/login.html');
            return;
        }

        if (profileName) profileName.textContent = userData.name || 'User Name';
        if (profileEmail) profileEmail.textContent = userData.email || 'user@example.com';
        
        if (profileAvatar) {
            const profilePic = userData.profilePic || '/minimiles/images/default-avatar.png';
            const absoluteProfilePic = ensureAbsolutePath(profilePic);
            console.log('Attempting to load profile photo:', absoluteProfilePic);
            profileAvatar.src = absoluteProfilePic;
            profileAvatar.onerror = () => {
                console.error('Failed to load profile photo:', absoluteProfilePic);
                profileAvatar.src = '/minimiles/images/default-avatar.png';
            };
            profileAvatar.classList.add('loaded');
        }
        if (photoPreview) {
            const previewPic = userData.profilePic || '/minimiles/images/default-avatar.png';
            const absolutePreviewPic = ensureAbsolutePath(previewPic);
            console.log('Setting photo preview:', absolutePreviewPic);
            photoPreview.src = absolutePreviewPic;
            photoPreview.onerror = () => {
                console.error('Failed to load photo preview:', absolutePreviewPic);
                photoPreview.src = '/minimiles/images/default-avatar.png';
            };
        }

        if (profileContainer) profileContainer.classList.add('loaded');
        loadBookingHistory(userData.email);
    }

    if (editProfileBtn && editProfileFormEl) {
        editProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (formTransitioning) return;
            formTransitioning = true;

            const isActive = editProfileFormEl.classList.contains('active');
            if (!isActive) {
                const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
                if (fullNameInput) fullNameInput.value = userData.name || '';
                if (photoPreview) {
                    const previewPic = userData.profilePic || '/minimiles/images/default-avatar.png';
                    const absolutePreviewPic = ensureAbsolutePath(previewPic);
                    console.log('Setting photo preview on edit:', absolutePreviewPic);
                    photoPreview.src = absolutePreviewPic;
                    photoPreview.onerror = () => {
                        console.error('Failed to load photo preview on edit:', absolutePreviewPic);
                        photoPreview.src = '/minimiles/images/default-avatar.png';
                    };
                }
                
                editProfileFormEl.style.display = 'block';
                requestAnimationFrame(() => {
                    editProfileFormEl.classList.add('active');
                });
            } else {
                editProfileFormEl.classList.remove('active');
            }
            
            setTimeout(() => {
                if (!editProfileFormEl.classList.contains('active')) {
                    editProfileFormEl.style.display = 'none';
                }
                formTransitioning = false;
            }, 300);
        });

        document.addEventListener('click', function(e) {
            if (editProfileFormEl && editProfileFormEl.classList.contains('active') &&
                !editProfileFormEl.contains(e.target) && e.target !== editProfileBtn) {
                if (formTransitioning) return;
                formTransitioning = true;
                editProfileFormEl.classList.remove('active');
                setTimeout(() => {
                    editProfileFormEl.style.display = 'none';
                    formTransitioning = false;
                }, 300);
            }
        });
    }

    if (profilePhotoInput && photoPreview) {
        // Add Remove button functionality
        const removePhotoBtn = document.createElement('button');
        removePhotoBtn.type = 'button';
        removePhotoBtn.className = 'btn btn-remove-photo';
        removePhotoBtn.textContent = 'Remove';
        removePhotoBtn.style.marginLeft = '10px';
        profilePhotoInput.parentNode.appendChild(removePhotoBtn);

        // Hidden input to track removal
        const removePhotoInput = document.createElement('input');
        removePhotoInput.type = 'hidden';
        removePhotoInput.name = 'remove_photo';
        removePhotoInput.id = 'remove-photo-input';
        removePhotoInput.value = '0';
        updateProfileForm.appendChild(removePhotoInput);

        // Create a message element for remove feedback
        const removeMessage = document.createElement('div');
        removeMessage.className = 'form-message';
        removeMessage.style.display = 'none';
        profilePhotoInput.parentNode.appendChild(removeMessage);

        profilePhotoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (!validImageTypes.includes(file.type)) {
                    alert('Invalid image type. Please use JPEG, PNG, GIF, or WEBP.');
                    this.value = '';
                    showMessage(removeMessage, 'Invalid image type.', false);
                    return;
                }
                if (file.size > 2 * 1024 * 1024) {
                    alert('Image size exceeds 2MB.');
                    this.value = '';
                    showMessage(removeMessage, 'Image size exceeds 2MB.', false);
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoPreview.src = e.target.result;
                    profileAvatar.src = e.target.result; // Update main avatar immediately
                    removePhotoInput.value = '0'; // Reset removal flag
                    showMessage(removeMessage, 'New photo selected. Save to confirm.', true);
                };
                reader.onerror = () => {
                    console.error('Failed to read file for preview:', file.name);
                    photoPreview.src = '/minimiles/images/default-avatar.png';
                    profileAvatar.src = '/minimiles/images/default-avatar.png';
                    removePhotoInput.value = '0';
                    showMessage(removeMessage, 'Failed to load photo.', false);
                };
                reader.readAsDataURL(file);
            }
        });

        removePhotoBtn.addEventListener('click', function() {
            photoPreview.src = '/minimiles/images/default-avatar.png';
            profileAvatar.src = '/minimiles/images/default-avatar.png'; // Update main avatar immediately
            profilePhotoInput.value = ''; // Clear file input
            removePhotoInput.value = '1'; // Set removal flag
            showMessage(removeMessage, 'Profile photo removed. Save to confirm.', true);
        });
    }

    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (updateMessage) updateMessage.style.display = 'none';
            const submitBtn = updateProfileForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Updating...';
            }

            const formData = new FormData(updateProfileForm);
            const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
            if (userData.id) {
                formData.append('user_id', userData.id); // Add user_id to FormData
            } else {
                console.error('User ID not found in sessionStorage');
                showMessage(updateMessage, 'User not authenticated. Please log in again.', false);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Save Changes';
                return;
            }

            fetch('/minimiles/update_profile.php', { method: 'POST', body: formData })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const currentSessionUser = JSON.parse(sessionStorage.getItem('user') || '{}');
                    currentSessionUser.name = data.name || currentSessionUser.name;
                    currentSessionUser.profilePic = data.profile_photo || null; // Set to null if photo removed
                    sessionStorage.setItem('user', JSON.stringify(currentSessionUser));

                    console.log('Profile updated successfully. New session data:', currentSessionUser);

                    // Set default avatar if profile photo is removed
                    const defaultAvatar = '/minimiles/images/default-avatar.png';
                    if (!data.profile_photo) {
                        if (profileAvatar) profileAvatar.src = defaultAvatar;
                        if (photoPreview) photoPreview.src = defaultAvatar;
                    }

                    initializeProfilePage();
                    if (typeof window.updateHeader === 'function') {
                        window.updateHeader();
                    }
                
                    setTimeout(() => {
                        if (editProfileFormEl) {
                            editProfileFormEl.classList.remove('active');
                            setTimeout(() => { editProfileFormEl.style.display = 'none'; }, 300);
                        }
                    }, 1500);
                    showMessage(updateMessage, data.message, true);
                } else {
                    const errorMessage = data.photo_error || data.message || 'Failed to update profile';
                    console.error('Profile update failed:', errorMessage);
                    showMessage(updateMessage, errorMessage, false);
                }
            })
            .catch(error => {
                console.error('Profile update error:', error);
                showMessage(updateMessage, 'An error occurred: ' + error.message, false);
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save Changes';
                }
            });
        });
    }

    function renderBookingItem(booking) {
        const listItem = document.createElement('li');
        listItem.classList.add('booking-item');
        listItem.dataset.bookingId = booking.booking_id;

        const checkInDate = booking.check_in_date ? new Date(booking.check_in_date) : null;
        const checkOutDate = booking.check_out_date ? new Date(booking.check_out_date) : checkInDate;
        const now = new Date();

        const normalizeToISTMidnight = (date) => {
            if (!date || isNaN(date)) {
                console.warn(`Invalid date for booking ${booking.booking_id}:`, date);
                return null;
            }
            const istOffset = 5.5 * 60;
            const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
            const istDate = new Date(utc + (istOffset * 60000));
            return new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate());
        };

        const normalizedToday = normalizeToISTMidnight(now);
        const normalizedCheckIn = normalizeToISTMidnight(checkInDate);
        const normalizedCheckOut = normalizeToISTMidnight(checkOutDate);

        console.log('Booking:', {
            booking_id: booking.booking_id,
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date,
            status: booking.status,
            normalizedCheckIn: normalizedCheckIn?.toISOString(),
            normalizedCheckOut: normalizedCheckOut?.toISOString(),
            normalizedToday: normalizedToday?.toISOString(),
            now: now.toISOString()
        });

        const isCancelled = booking.status.toLowerCase() === 'cancelled';
        const isUpcoming = !isCancelled && normalizedCheckIn && normalizedCheckIn >= normalizedToday;
        const isCompleted = !isCancelled && normalizedCheckOut && normalizedCheckOut < normalizedToday;

        console.log('Classification for booking', booking.booking_id, { isUpcoming, isCompleted, isCancelled });

        let timeContext = '';
        let timeContextClass = '';
        let diffDays = 0;

        if (normalizedCheckIn) {
            diffDays = Math.ceil((normalizedCheckIn - normalizedToday) / (1000 * 60 * 60 * 24));
            console.log('Days difference for booking', booking.booking_id, { diffDays });
        }

        if (isCancelled) {
            timeContext = 'Cancelled';
            timeContextClass = 'cancelled';
        } else if (isCompleted) {
            timeContext = 'Completed';
            timeContextClass = 'completed';
        } else if (isUpcoming && normalizedCheckIn) {
            if (diffDays === 0) {
                timeContext = 'Today';
                timeContextClass = 'today';
            } else if (diffDays === 1) {
                timeContext = 'Tomorrow';
                timeContextClass = 'tomorrow';
            } else if (diffDays > 1) {
                timeContext = `In ${diffDays} days`;
                timeContextClass = 'in-days';
            } else {
                timeContext = 'Past';
                timeContextClass = 'past';
            }
        } else {
            timeContext = 'Invalid Date';
            timeContextClass = 'invalid-date';
        }

        let statusClass = `status-${booking.status.toLowerCase()}`;

        listItem.innerHTML = `
            <div class="booking-destination">
                <a href="/minimiles/detail.html?id=${booking.destination_id}">${booking.destination_name || 'N/A'}</a>
            </div>
            <div class="booking-id-time-row">
                <span class="booking-id">Booking #${booking.booking_id || 'N/A'}</span>
                <span class="time-context ${timeContextClass}" data-days-left="${diffDays}">${timeContext}</span>
            </div>
            <div class="booking-details">
                <div class="booking-info-item">
                    <span class="booking-info-label">Check-in</span>
                    <span class="booking-info-value">${checkInDate && !isNaN(checkInDate) ? checkInDate.toLocaleDateString('en-GB') : '-'}</span>
                </div>
                <div class="booking-info-item">
                    <span class="booking-info-label">Check-out</span>
                    <span class="booking-info-value">${checkOutDate && !isNaN(checkOutDate) ? checkOutDate.toLocaleDateString('en-GB') : '-'}</span>
                </div>
                <div class="booking-info-item">
                    <span class="booking-info-label">Guests</span>
                    <span class="booking-info-value">${booking.guests || 0}</span>
                </div>
                <div class="booking-info-item">
                    <span class="booking-info-label">Status</span>
                    <span class="booking-info-value ${statusClass}">${booking.status}</span>
                </div>
            </div>
            <div class="booking-actions">
                ${isUpcoming ? `
                <button class="btn-cancel-booking" data-booking-id="${booking.booking_id}">
                    Cancel Booking
                </button>` : ''}
                ${isCompleted ? `
                <button class="btn-login-style btn-rate-stay" data-booking-id="${booking.booking_id}" 
                data-destination-id="${booking.destination_id}" 
                data-destination-name="${booking.destination_name || ''}">
                    <span class="btn-icon">⭐</span>
                    Rate Stay
                </button>` : ''}
            </div>
        `;
        return { listItem, isUpcoming };
    }

    async function loadBookingHistory(email) {
        if (!upcomingBookingsList || !pastBookingsList) return;
        
        upcomingBookingsList.innerHTML = '<li class="loading-item">Loading upcoming bookings...</li>';
        pastBookingsList.innerHTML = '<li class="loading-item">Loading past bookings...</li>';

        try {
            const response = await fetch('/minimiles/get_bookings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `email=${encodeURIComponent(email)}`
            });
            const text = await response.text();
            console.log('Raw response from get_bookings.php:', text);
            const data = JSON.parse(text);

            upcomingBookingsList.innerHTML = '';
            pastBookingsList.innerHTML = '';
            let hasUpcoming = false, hasPast = false;

            if (data.success && data.upcomingBookings && data.pastBookings) {
                data.upcomingBookings.forEach(booking => {
                    const { listItem } = renderBookingItem(booking);
                    upcomingBookingsList.appendChild(listItem);
                    hasUpcoming = true;
                });
                data.pastBookings.forEach(booking => {
                    const { listItem } = renderBookingItem(booking);
                    pastBookingsList.appendChild(listItem);
                    hasPast = true;
                });
            } else {
                console.error("Failed to retrieve bookings:", data.message);
            }

            if (!hasUpcoming) upcomingBookingsList.innerHTML = '<li class="no-bookings">No upcoming bookings found.</li>';
            if (!hasPast) pastBookingsList.innerHTML = '<li class="no-bookings">No past bookings found.</li>';

        } catch (error) {
            console.error("Error fetching bookings:", error);
            upcomingBookingsList.innerHTML = '<li class="no-bookings">Error loading upcoming bookings.</li>';
            pastBookingsList.innerHTML = '<li class="no-bookings">Error loading past bookings.</li>';
        }
    }
    
    document.addEventListener('click', function(e) {
        const cancelButton = e.target.closest('.btn-cancel-booking');
        if (cancelButton) {
            const bookingId = cancelButton.dataset.bookingId;
            if (confirm('Are you sure you want to cancel this booking?')) {
                cancelBooking(bookingId, cancelButton);
            }
        }

        const rateButton = e.target.closest('.btn-rate-stay');
        if (rateButton) {
            e.stopPropagation();
            console.log('Rate Stay button clicked');
            const bookingId = rateButton.dataset.bookingId;
            const destinationId = rateButton.dataset.destinationId;
            const destinationName = rateButton.dataset.destinationName;

            console.log('Elements:', { ratingModal, modalTitle, modalBookingId, modalDestinationId });
            if (ratingModal && modalTitle && modalBookingId && modalDestinationId) {
                modalTitle.textContent = `Rate Your Stay at ${destinationName}`;
                modalBookingId.value = bookingId;
                modalDestinationId.value = destinationId;
                ratingModal.classList.add('active');
                console.log('Modal should be visible, active class added:', ratingModal.classList.contains('active'));
            } else {
                console.error('One or more modal elements not found');
            }
        }
    });

    if (closeRatingModal && ratingModal) {
        closeRatingModal.addEventListener('click', () => {
            ratingModal.classList.remove('active');
        });

        ratingModal.addEventListener('click', (e) => {
            if (e.target === ratingModal) {
                ratingModal.classList.remove('active');
            }
        });
    }

    const processingCancelButtons = new Set();
    function cancelBooking(bookingId, buttonElement) {
        if (processingCancelButtons.has(buttonElement)) return;
        processingCancelButtons.add(buttonElement);

        buttonElement.disabled = true;
        buttonElement.textContent = 'Cancelling...';

        fetch('/minimiles/cancel_booking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `booking_id=${encodeURIComponent(bookingId)}`
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }
            return response.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error('Invalid JSON response: ' + text);
                }
            });
        })
        .then(data => {
            alert(data.message);
            if (data.success) {
                loadBookingHistory(JSON.parse(sessionStorage.getItem('user') || '{}').email);
            } else {
                buttonElement.disabled = false;
                buttonElement.textContent = 'Cancel Booking';
            }
        })
        .catch(error => {
            console.error('Cancel booking error:', error);
            alert('Failed to cancel booking: ' + error.message);
            buttonElement.disabled = false;
            buttonElement.textContent = 'Cancel Booking';
        })
        .finally(() => {
            processingCancelButtons.delete(buttonElement);
        });
    }

    initializeProfilePage();

    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            console.log("Page loaded from bfcache. Re-initializing.");
            initializeProfilePage();
        }
    });
});