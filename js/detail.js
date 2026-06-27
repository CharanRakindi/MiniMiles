document.addEventListener('DOMContentLoaded', function() {
    console.log("Detail page script loaded");

    const urlParams = new URLSearchParams(window.location.search);
    const destinationId = urlParams.get('id');

    if (destinationId) {
        loadDestinationData(destinationId);
        populateDestinationFields(destinationId);
    }

    setMinBookingDate();

    const bookingForm = document.getElementById('booking-form');
    const receiptModal = document.getElementById('receiptModal');
    const roomsFullModal = document.getElementById('roomsFullModal');
    const downloadBtn = document.querySelector('.receipt-btn.primary');
    const closeButtons = document.querySelectorAll('.receipt-close-btn, .receipt-btn.secondary');
    const receiptModalContent = document.querySelector('.receipt-modal-content');
    const getDirectionsBtn = document.getElementById('get-directions-btn');

    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Booking form submit listener triggered');

            const submitButton = document.getElementById('book-now-btn');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Processing...';
            }

            const checkInDate = new Date(document.getElementById('check_in_date').value);
            const checkOutDate = document.getElementById('check_out_date').value;
            if (checkOutDate) {
                const checkOut = new Date(checkOutDate);
                if (checkOut < checkInDate) {
                    document.getElementById('booking-message-error').textContent = 'Check-out date cannot be before check-in date.';
                    document.getElementById('booking-message-error').style.display = 'block';
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Book Now';
                    }
                    return;
                }
            }
            const formData = new FormData(bookingForm);

            fetch('/minimiles/book.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('Response status:', response.status);
                console.log('Response status text:', response.statusText);
                console.log('Response headers:', [...response.headers.entries()]);
                return response.text();
            })
            .then(text => {
                console.log('Raw response:', text);
                try {
                    const data = JSON.parse(text);
                    document.getElementById('booking-message-success').style.display = 'none';
                    document.getElementById('booking-message-error').style.display = 'none';
                    if (data.success) {
                        const bookingData = {
                            bookingId: data.booking_id || 'N/A',
                            destination: document.getElementById('destination-name-main').textContent || 'Unknown Destination',
                            name: formData.get('name'),
                            email: formData.get('email'),
                            checkInDate: checkInDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                            checkOutDate: checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
                            guests: formData.get('guests'),
                            status: 'Confirmed'
                        };
                        showReceiptModal(bookingData);
                    } else if (data.status === 'rooms_full') {
                        roomsFullModal.style.display = 'flex';
                    } else {
                        document.getElementById('booking-message-error').textContent = data.message || 'Booking failed. Please try again.';
                        document.getElementById('booking-message-error').style.display = 'block';
                    }
                } catch (error) {
                    console.error('JSON parse error:', error.message);
                    console.error('Failed response text:', text);
                    throw new Error('Invalid JSON response from server');
                }
            })
            .catch(error => {
                console.error('Booking error:', error);
                document.getElementById('booking-message-error').textContent = 'An error occurred while booking. Please try again.';
                document.getElementById('booking-message-error').style.display = 'block';
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Book Now';
                }
            });
        });
    }

    if (getDirectionsBtn) {
        getDirectionsBtn.addEventListener('click', () => {
            if (!destinationCoords) {
                alert('Map data not loaded. Please try again later.');
                console.error('Destination coordinates not available:', destinationCoords);
                return;
            }

            const origin = '17.385044,78.486671'; // Hyderabad coordinates
            const destination = `${destinationCoords.lat},${destinationCoords.lng}`;
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
            window.open(directionsUrl, '_blank');
        });
    }

    if (downloadBtn && receiptModalContent) {
        downloadBtn.addEventListener('click', () => {
            html2canvas(receiptModalContent, { backgroundColor: null, scale: 2 }).then(canvas => {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = 'booking-receipt.png';
                link.click();
            }).catch(error => {
                console.error('Error generating receipt image:', error);
                alert('Failed to download receipt. Please try again.');
            });
        });
    }

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            receiptModal.style.display = 'none';
            roomsFullModal.style.display = 'none';
        });
    });

    receiptModal.addEventListener('click', (e) => {
        if (e.target === receiptModal) {
            receiptModal.style.display = 'none';
        }
    });

    roomsFullModal.addEventListener('click', (e) => {
        if (e.target === roomsFullModal) {
            roomsFullModal.style.display = 'none';
        }
    });
});

function setMinBookingDate() {
    const today = new Date().toISOString().split('T')[0];
    const checkInInput = document.getElementById('check_in_date');
    const checkOutInput = document.getElementById('check_out_date');

    if (checkInInput) {
        checkInInput.min = today;
        checkInInput.addEventListener('change', function() {
            if (checkOutInput) {
                checkOutInput.min = this.value || today;
                if (checkOutInput.value && checkOutInput.value < this.value) {
                    checkOutInput.value = '';
                }
            }
        });
    }
}

function populateDestinationFields(destinationId) {
    const destinationField = document.getElementById('destination-field');
    if (destinationField) destinationField.value = destinationId;

    const destinationIdField = document.getElementById('destination-id-field');
    if (destinationIdField) destinationIdField.value = destinationId;
}

function loadDestinationData(destinationId) {
    fetch(`/minimiles/get_destination.php?id=${encodeURIComponent(destinationId)}`)
    .then(response => response.json())
    .then(data => {
        if (data.success && data.destination) {
            window.destinationData = data.destination;
            console.log("Destination data:", data.destination);
            updateHeroSection(data.destination);

            const isBookable = parseInt(data.destination.bookable) === 1;
            console.log("isBookable:", isBookable);
            const price = data.destination.price ? parseFloat(String(data.destination.price).replace(/[^0-9.]/g, '')) : null;
            console.log("Raw price:", data.destination.price);
            console.log("Raw price type:", typeof data.destination.price);
            console.log("Parsed price:", price);
            console.log("Parsed price type:", typeof price);
            const priceCard = document.querySelector('.destination-price-card');

            if (priceCard) {
                if (isBookable && price && price > 0) {
                    priceCard.classList.add('visible');
                    const priceValue = document.getElementById('destination-price');
                    if (priceValue) priceValue.textContent = price.toLocaleString('en-IN');
                    console.log("Price card should be visible. Classes:", priceCard.className);
                } else {
                    priceCard.classList.remove('visible');
                    console.log("Price card hidden. Reason:", {
                        isBookable,
                        priceExists: !!price,
                        priceGreaterThanZero: price > 0
                    });
                }
            } else {
                console.error("priceCard element not found in the DOM");
            }

            const bookingCard = document.querySelector('.booking-card');
            const nonBookableCard = document.querySelector('.non-bookable-card');
            const ratingCard = document.querySelector('.rating-card');
            const bookableRatingCard = document.querySelector('.bookable-rating-card');

            if (isBookable) {
                if (bookingCard) bookingCard.classList.add('is-bookable');
                if (nonBookableCard) nonBookableCard.style.display = 'none';
                if (ratingCard) ratingCard.style.display = 'none';
                if (bookableRatingCard) bookableRatingCard.style.display = 'block';
            } else {
                if (bookingCard) bookingCard.style.display = 'none';
                if (nonBookableCard) nonBookableCard.style.display = 'block';
                if (ratingCard) ratingCard.style.display = 'block';
                if (bookableRatingCard) bookableRatingCard.style.display = 'none';
            }

            console.log(`Destination ${destinationId} is bookable. UI updated.`);

            const fetchFunction = window.fetchWithAntiBotHandling || fetch;
            fetchFunction(`/minimiles/get_rating.php?id=${encodeURIComponent(destinationId)}`)
            .then(response => response.json())
            .then(ratingData => {
                if (ratingData.success) {
                    const ratingValue = document.getElementById('rating-value');
                    const numReviews = document.getElementById('num-reviews');
                    if (ratingValue) {
                        ratingValue.textContent = ratingData.average_rating.toFixed(1);
                    }
                    if (numReviews) {
                        numReviews.textContent = `(${ratingData.count} reviews)`;
                    }
                    const starsContainer = document.querySelector('.stars');
                    if (starsContainer) {
                        const rating = parseFloat(ratingData.average_rating);
                        const fullStars = Math.floor(rating);
                        const halfStar = rating % 1 >= 0.5;
                        const starIcons = starsContainer.querySelectorAll('.star-icon');
                        starIcons.forEach((star, index) => {
                            if (index < fullStars) {
                                star.classList.remove('half-star');
                            } else if (index === fullStars && halfStar) {
                                star.classList.add('half-star');
                            } else {
                                star.style.fill = 'grey';
                            }
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error loading ratings:', error);
            });
        } else {
            console.error('Failed to load destination data:', data.message);
            showErrorCard('Failed to load destination information.');
        }
    })
    .catch(error => {
        console.error('Error loading destination data:', error);
        showErrorCard('An error occurred while loading destination details.');
    });
}

function showErrorCard(message) {
    const detailSection = document.querySelector('.detail-section');
    if (detailSection) {
        detailSection.innerHTML = `
        <div class="detail-card error-card">
        <div class="card-header">
        <h2><span class="card-icon">⚠️</span>Error</h2>
        </div>
        <div class="card-content">
        <p>${message}</p>
        <button onclick="window.location.reload()" class="btn-register-style" style="max-width: 200px;">
        <span class="btn-icon">🔄</span>
        Retry
        </button>
        </div>
        </div>
        `;
    }
}

function updateHeroSection(destination) {
    const heroImage = document.getElementById('destination-image-main');
    if (heroImage && destination.image_path) {
        // Ensure image path starts with /minimiles/
        const imagePath = destination.image_path.startsWith('/minimiles/') 
            ? destination.image_path 
            : `/minimiles/${destination.image_path.startsWith('/') ? destination.image_path.slice(1) : destination.image_path}`;
        heroImage.src = imagePath;
        heroImage.alt = destination.name || 'Destination Image';
        // Add error handling for the image
        heroImage.onerror = function() {
            console.warn(`Failed to load image: ${imagePath}. Using placeholder.`);
            this.src = '/minimiles/images/placeholder.jpg';
        };
    }

    const heroName = document.getElementById('destination-name-main');
    if (heroName && destination.name) heroName.textContent = destination.name;

    const heroDescription = document.getElementById('destination-description-main');
    if (heroDescription && destination.description) heroDescription.textContent = destination.description;

    const heroType = document.querySelector('.destination-type-badge');
    if (heroType && destination.type) {
        console.log("Setting type badge to:", destination.type);
        heroType.textContent = destination.type.charAt(0).toUpperCase() + destination.type.slice(1);
    } else {
        console.error("Type badge element not found or type missing:", destination.type);
    }

    const heroLocation = document.getElementById('destination-location');
    if (heroLocation && destination.location) heroLocation.textContent = destination.location;

    const overviewElement = document.getElementById('destination-overview');
    if (overviewElement && destination.description) overviewElement.textContent = destination.description;
}

function showReceiptModal(bookingData) {
    const modal = document.getElementById('receiptModal');
    if (!modal) {
        console.error("Receipt modal not found in the DOM.");
        return;
    }

    const bookingIdElement = document.getElementById('receipt-booking-id');
    const bookingIdDisplayElement = document.getElementById('receipt-booking-id-display');
    const destinationElement = document.getElementById('receipt-destination');
    const guestNameElement = document.getElementById('receipt-guest-name');
    const emailElement = document.getElementById('receipt-guest-email');
    const checkInElement = document.getElementById('receipt-check-in-date');
    const checkOutElement = document.getElementById('receipt-check-out-date');
    const nightsElement = document.getElementById('receipt-nights');
    const guestsElement = document.getElementById('receipt-guests');
    const pricePerNightElement = document.getElementById('receipt-price-per-night');
    const subtotalElement = document.getElementById('receipt-subtotal');
    const taxElement = document.getElementById('receipt-tax');
    const totalCostElement = document.getElementById('receipt-total-cost');
    const bookingDateElement = document.getElementById('receipt-booking-date');
    const paymentMethodElement = document.getElementById('receipt-payment-method');
    const contactElement = document.getElementById('receipt-contact');
    const statusElement = document.getElementById('receipt-status');

    // Calculate number of nights
    const checkInDate = new Date(bookingData.checkInDate);
    const checkOutDate = bookingData.checkOutDate !== 'N/A' ? new Date(bookingData.checkOutDate) : null;
    const nights = checkOutDate ? Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) : 1;

    // Get price per night from destinationData
    const pricePerNight = window.destinationData && window.destinationData.price
        ? parseFloat(String(window.destinationData.price).replace(/[^0-9.]/g, ''))
        : 0;

    // Calculate costs
    const subtotal = pricePerNight * nights;
    const taxRate = 0.05; // 5% tax
    const tax = subtotal * taxRate;
    const totalCost = subtotal + tax;

    // Format today's date as booking date
    const today = new Date();
    const bookingDate = today.toISOString().split('T')[0];

    if (bookingIdElement) bookingIdElement.value = bookingData.bookingId;
    if (bookingIdDisplayElement) bookingIdDisplayElement.textContent = bookingData.bookingId;
    if (destinationElement) destinationElement.textContent = bookingData.destination;
    if (guestNameElement) guestNameElement.textContent = bookingData.name;
    if (emailElement) emailElement.textContent = bookingData.email;
    if (checkInElement) checkInElement.textContent = bookingData.checkInDate;
    if (checkOutElement) checkOutElement.textContent = bookingData.checkOutDate;
    if (nightsElement) nightsElement.textContent = nights;
    if (guestsElement) guestsElement.textContent = bookingData.guests;
    if (pricePerNightElement) pricePerNightElement.textContent = pricePerNight.toLocaleString('en-IN');
    if (subtotalElement) subtotalElement.textContent = subtotal.toLocaleString('en-IN');
    if (taxElement) taxElement.textContent = tax.toLocaleString('en-IN');
    if (totalCostElement) totalCostElement.textContent = totalCost.toLocaleString('en-IN');
    if (bookingDateElement) bookingDateElement.textContent = bookingDate;
    if (paymentMethodElement) paymentMethodElement.textContent = 'Credit Card'; // Placeholder
    if (contactElement) contactElement.textContent = '+91 123-456-7890'; // Placeholder
    if (statusElement) statusElement.textContent = bookingData.status;

    modal.style.display = 'flex';

    const closeBtn = modal.querySelector('.receipt-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.style.display = 'none';
    });
}

async function initializeMap(destinationData) {
    console.log("Initializing map for:", destinationData ? destinationData.name : 'undefined');

    const defaultLat = 17.3850;
    const defaultLng = 78.4867;

    const fallbackCoordinates = {
        'alankrita_resort': { latitude: 17.630489, longitude: 78.440247 },
        'charminar': { latitude: 17.3616, longitude: 78.4747 },
        'golconda_fort': { latitude: 17.3833, longitude: 78.4011 },
        'birla_mandir': { latitude: 17.4062, longitude: 78.4691 }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const destinationId = urlParams.get('id');

    let lat, lng, locationName;

    if (destinationData && destinationData.latitude && destinationData.longitude) {
        lat = parseFloat(destinationData.latitude);
        lng = parseFloat(destinationData.longitude);
        locationName = destinationData.location || 'Location';
    } else if (destinationId && fallbackCoordinates[destinationId]) {
        lat = fallbackCoordinates[destinationId].latitude;
        lng = fallbackCoordinates[destinationId].longitude;
        locationName = destinationData ? destinationData.location : 'Location';
    } else {
        lat = defaultLat;
        lng = defaultLng;
        locationName = 'Hyderabad (Default Location)';
    }

    // Set coordinates for "Get Directions" button
    const coords = { lat, lng };
    window.setDestinationCoords(coords);

    const mapElement = document.getElementById('destination-map');
    if (!mapElement) {
        console.log("Map element not found on page");
        return;
    }

    mapElement.innerHTML = '';

    try {
        const mapOptions = {
            center: { lat, lng },
            zoom: 13,
            mapId: '36823e4af3921b9f58d140f9',
            mapTypeControl: false,
            fullscreenControl: true,
            streetViewControl: false
        };

        const map = new google.maps.Map(mapElement, mapOptions);

        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        const marker = new AdvancedMarkerElement({
            position: { lat, lng },
            map: map,
            title: destinationData ? destinationData.name : (destinationId ? destinationId.replace(/_/g, ' ') : 'Destination'),
        });

        const infoContent = `
        <div class="info-window">
        <h3>${destinationData ? destinationData.name : destinationId}</h3>
        <p>${locationName}</p>
        </div>
        `;

        const infoWindow = new google.maps.InfoWindow({ content: infoContent });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        window.destinationMap = map;
        window.destinationMarker = marker;
    } catch (error) {
        console.error("Error initializing map:", error);
        mapElement.innerHTML = `<div class="map-error">Map could not be loaded. Please try again later.</div>`;
    }
}

function calculateDistance(destinationData, attempt = 1) {
    const defaultLat = 17.3850;
    const defaultLng = 78.4867;

    let destLat = defaultLat;
    let destLng = defaultLng;

    console.log("Calculating distance with destinationData:", destinationData);
    if (destinationData && destinationData.latitude && destinationData.longitude) {
        destLat = parseFloat(destinationData.latitude);
        destLng = parseFloat(destinationData.longitude);
        console.log("Parsed coordinates:", { destLat, destLng });
    } else {
        console.log("Latitude or longitude missing in destinationData");
    }

    if (destLat === defaultLat && destLng === defaultLng) {
        const distanceElement = document.getElementById('distance-value');
        if (distanceElement) {
            distanceElement.textContent = 'In Hyderabad City';
            console.log("Distance set to 'In Hyderabad City'");
        } else if (attempt <= 3) {
            console.warn(`distance-value not found on attempt ${attempt}. Retrying...`);
            setTimeout(() => calculateDistance(destinationData, attempt + 1), 100);
        }
        return;
    }

    const R = 6371;
    const dLat = (destLat - defaultLat) * Math.PI / 180;
    const dLon = (destLng - defaultLng) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(defaultLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    const distanceElement = document.getElementById('distance-value');
    if (distanceElement) {
        if (distance < 1) {
            distanceElement.textContent = `${Math.round(distance * 1000)} meters`;
        } else {
            distanceElement.textContent = `${distance.toFixed(1)} km`;
        }
        console.log("Calculated distance:", distanceElement.textContent);
    } else if (attempt <= 3) {
        console.warn(`distance-value not found on attempt ${attempt}. Retrying...`);
        setTimeout(() => calculateDistance(destinationData, attempt + 1), 100);
    }
}

function onGoogleMapsApiReady() {
    console.log("Google Maps API ready");
    if (window.destinationData) {
        initializeMap(window.destinationData);
        calculateDistance(window.destinationData);
    } else {
        console.warn("Destination data not available yet. Waiting for data to load...");
        const mapElement = document.getElementById('destination-map');
        if (mapElement) {
            mapElement.innerHTML = `<div class="map-loading">Loading map...</div>`;
        }
        // Poll for destinationData
        const checkDataInterval = setInterval(() => {
            if (window.destinationData) {
                clearInterval(checkDataInterval);
                initializeMap(window.destinationData);
                calculateDistance(window.destinationData);
            }
        }, 500);
        // Timeout after 10 seconds
        setTimeout(() => {
            if (!window.destinationData) {
                clearInterval(checkDataInterval);
                console.error("Destination data not loaded in time.");
                if (mapElement) {
                    mapElement.innerHTML = `<div class="map-error">Failed to load map data. Please refresh the page.</div>`;
                }
            }
        }, 10000);
    }
}