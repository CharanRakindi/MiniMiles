/**
 * Enhanced Rating Handler for Mini Miles
 * Handles the display of ratings and reviews, and form submission
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('rating-handler.js loaded'); // Debug log
    try {
        const ratingForms = document.querySelectorAll('.rating-form, #modalRatingForm'); // Include modal form
        const reviewsContainer = document.getElementById('reviews-container');
        
        console.log('Found forms:', ratingForms.length); // Debug log
        if (reviewsContainer) {
            initializeRatings();
        }

        ratingForms.forEach(form => {
            const ratingMessage = form.closest('.detail-card')?.querySelector('.message') || 
                                 form.closest('.modal-content')?.querySelector('.form-message') || 
                                 document.createElement('div');
            ratingMessage.classList.add(form.closest('.modal-content') ? 'form-message' : 'message');

            form.addEventListener('submit', function(e) {
                console.log('Form submission intercepted'); // Debug log
                e.preventDefault(); // Prevent page refresh

                const formData = new FormData(form);
                const destinationId = formData.get('resort_id');

                fetch('submit_rating.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    console.log('Response status:', response.status);
                    return response.text();
                })
                .then(text => {
                    console.log('Raw response:', text);
                    return JSON.parse(text);
                })
                .then(data => {
                    if (data.success) {
                        ratingMessage.style.display = 'block';
                        ratingMessage.classList.add('success'); // Use class for styling
                        ratingMessage.textContent = 'Review submitted successfully!';
                        form.reset();
                        setTimeout(() => {
                            ratingMessage.style.display = 'none';
                            ratingMessage.classList.remove('success');
                            const modal = form.closest('.modal');
                            if (modal) {
                                modal.classList.remove('active'); // Close modal
                            }
                        }, 3000);
                        if (reviewsContainer && destinationId) {
                            loadDestinationRatings(destinationId);
                        }
                    } else {
                        ratingMessage.style.display = 'block';
                        ratingMessage.classList.add('error'); // Use class for styling
                        ratingMessage.textContent = 'Failed to submit review: ' + (data.message || 'Unknown error');
                        setTimeout(() => {
                            ratingMessage.style.display = 'none';
                            ratingMessage.classList.remove('error');
                        }, 3000);
                    }
                })
                .catch(error => {
                    console.error('Error submitting review:', error);
                    ratingMessage.style.display = 'block';
                    ratingMessage.classList.add('error'); // Use class for styling
                    ratingMessage.textContent = 'An error occurred while submitting your review.';
                    setTimeout(() => {
                        ratingMessage.style.display = 'none';
                        ratingMessage.classList.remove('error');
                    }, 3000);
                });
            });
        });
    } catch (error) {
        console.error('Error in rating-handler.js:', error);
    }
});

// Rest of the script (initializeRatings, loadDestinationRatings, etc.) remains unchanged
function initializeRatings() {
    const urlParams = new URLSearchParams(window.location.search);
    const destinationId = urlParams.get('id');
    
    if (!destinationId) {
        console.error('No destination ID found in URL');
        showRatingError('Missing destination ID');
        return;
    }
    
    const ratingSelect = document.getElementById('rating');
    if (ratingSelect) {
        ratingSelect.addEventListener('change', function() {
            const value = this.value;
            if (value) {
                const stars = getStarDisplay(value);
                
                let visualization = this.nextElementSibling;
                if (!visualization || !visualization.classList.contains('rating-visualization')) {
                    visualization = document.createElement('div');
                    visualization.className = 'rating-visualization';
                    this.parentNode.insertBefore(visualization, this.nextSibling);
                }
                
                visualization.innerHTML = `<span class="stars">${stars}</span> <span class="value">(${value})</span>`;
                visualization.style.color = '#00ddeb';
                visualization.style.fontSize = '1.5rem';
                visualization.style.marginTop = '0.5rem';
                visualization.style.animation = 'fadeIn 0.3s ease-out';
            }
        });
    }
    
    loadDestinationRatings(destinationId);
    
    setInterval(animateStars, 8000);
}

function animateStars() {
    const starElements = document.querySelectorAll('.average-rating-stars, .review-rating');
    starElements.forEach(el => {
        el.classList.add('animated-stars');
        setTimeout(() => {
            el.classList.remove('animated-stars');
        }, 2000);
    });
}

function loadDestinationRatings(destinationId) {
    const reviewsContainer = document.getElementById('reviews-container');
    
    if (!reviewsContainer) return;
    
    reviewsContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading reviews...</p>
        </div>
    `;
    
    const fetchFunction = window.fetchWithAntiBotHandling || fetch;
    
    fetchFunction(`get_rating.php?id=${encodeURIComponent(destinationId)}`)
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    console.error('Non-JSON response:', text.substring(0, 100) + '...');
                    throw new Error('Server returned non-JSON response');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                if (data.ratings && data.ratings.length > 0) {
                    data.ratings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    reviewsContainer.innerHTML = '';
                    
                    data.ratings.forEach(rating => {
                        const reviewItem = createReviewItem(rating);
                        reviewsContainer.appendChild(reviewItem);
                    });
                    
                    const reviewItems = reviewsContainer.querySelectorAll('.review-item');
                    reviewItems.forEach((item, index) => {
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(20px)';
                        item.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, 50);
                    });
                } else {
                    reviewsContainer.innerHTML = `
                        <div class="no-reviews">
                            <p>No reviews yet. Be the first to leave a review!</p>
                            <p>⭐⭐⭐⭐⭐</p>
                        </div>
                    `;
                }
            } else {
                showRatingError(data.message || 'Failed to load ratings.');
            }
        })
        .catch(error => {
            console.error('Error loading ratings:', error);
            showRatingError('An error occurred while loading ratings. Please try again.');
        });
}

function createReviewItem(rating) {
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';
    
    const date = new Date(rating.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const timeAgo = getTimeAgo(date);
    
    reviewItem.innerHTML = `
        <div class="review-header">
            <div class="review-author">${rating.user_name || 'Anonymous'}</div>
            <div class="review-rating">${getStarDisplay(rating.rating)}</div>
        </div>
        <div class="review-date">${formattedDate} <span class="time-ago">(${timeAgo})</span></div>
        ${rating.review ? `<div class="review-text">${rating.review}</div>` : ''}
    `;
    
    return reviewItem;
}

function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return interval === 1 ? '1 year ago' : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval === 1 ? '1 month ago' : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval === 1 ? '1 day ago' : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
    }
    
    return 'just now';
}

function getStarDisplay(rating) {
    rating = parseFloat(rating);
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '★'.repeat(fullStars);
    if (halfStar) stars += '½';
    stars += '☆'.repeat(emptyStars);
    
    return stars;
}

function showRatingError(message) {
    const reviewsContainer = document.getElementById('reviews-container');
    if (reviewsContainer) {
        reviewsContainer.innerHTML = `
            <div class="rating-error">
                <p>${message}</p>
                <button class="retry-button" onclick="loadDestinationRatings('${getDestinationIdFromUrl()}')">
                    Retry
                </button>
            </div>
        `;
    }
}

function getDestinationIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}