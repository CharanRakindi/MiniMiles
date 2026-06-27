/**
 * Form Manager
 * Handles form submissions and validation consistently across the site
 */
class FormManager {
    constructor(formId, submitUrl, options = {}) {
        this.form = document.getElementById(formId);
        this.submitUrl = submitUrl;
        this.options = {
            successMessage: 'Operation completed successfully!',
            errorMessage: 'An error occurred. Please try again.',
            redirectUrl: null,
            redirectDelay: 2000,
            ...options
        };
        
        this.messageElementId = `${formId}-message`;
        
        if (this.form) {
            this.init();
        } else {
            console.error(`Form with ID ${formId} not found`);
        }
    }
    
    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        this.clearMessages();
        
        if (!this.validateForm()) {
            this.showError('Please fill in all required fields.');
            return;
        }
        
        const formData = new FormData(this.form);
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        fetch(this.submitUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.handleSuccess(data, formData);
            } else {
                this.handleError(data);
            }
        })
        .catch(error => {
            console.error('Form submission error:', error);
            this.showError(this.options.errorMessage);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
    }
    
    validateForm() {
        let isValid = true;
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        return isValid;
    }
    
    handleSuccess(data, formData) {
        this.showSuccess(data.message || this.options.successMessage);
        
        if (this.options.onSuccess) {
            this.options.onSuccess(data, formData);
        }
        
        if (this.options.redirectUrl) {
            setTimeout(() => {
                window.location.href = this.options.redirectUrl;
            }, this.options.redirectDelay);
        }
        
        if (this.form.id === 'booking-form') {
            this.showBookingSuccess(data, formData);
        }
        
        const userNameInput = this.form.querySelector('#user-name');
        const userName = userNameInput ? userNameInput.value : null;
        this.form.reset();
        if (userNameInput && userName) userNameInput.value = userName;
    }
    
    handleError(data) {
        this.showError(data.message || this.options.errorMessage);
        
        if (this.options.onError) {
            this.options.onError(data);
        }
    }
    
    showSuccess(message) {
        const messageElement = document.getElementById(this.messageElementId);
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = 'message success-message';
            messageElement.style.display = 'block';
            
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 5000);
        } else {
            console.log('Success:', message);
        }
    }
    
    showError(message) {
        const messageElement = document.getElementById(this.messageElementId);
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = 'message error-message';
            messageElement.style.display = 'block';
            
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 5000);
        } else {
            console.error('Error:', message);
        }
    }
    
    clearMessages() {
        const messageElement = document.getElementById(this.messageElementId);
        if (messageElement) {
            messageElement.style.display = 'none';
        }
    }
    
    showBookingSuccess(data, formData) {
        console.log('Booking success:', data);
        
        const receiptData = {
            bookingId: data.bookingId || ('TEMP' + Date.now().toString().slice(-6)),
            destination: formData.get('destination') || window.destinationData?.name || 'N/A',
            name: formData.get('name') || 'N/A',
            email: formData.get('email') || 'N/A',
            checkInDate: formData.get('check_in_date') || 'N/A',
            checkOutDate: formData.get('check_out_date') || 'Same day',
            guests: formData.get('guests') || '1',
            status: data.status || 'Confirmed'
        };
        
        if (typeof showReceiptModal === 'function') {
            showReceiptModal(receiptData);
        } else {
            console.warn('showReceiptModal function not found. Make sure detail.js is included.');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const bookingFormManager = new FormManager('booking-form', 'book.php', {
        successMessage: 'Booking successful!',
        errorMessage: 'Try booking again!',
        redirectUrl: null,
        redirectDelay: 2000
    });

    const ratingFormManager = new FormManager('rating-form', 'rate.php', {
        successMessage: 'Review submitted successfully!',
        redirectUrl: null,
        redirectDelay: 2000,
        onSuccess: (data, formData) => {
            const ratingForm = document.getElementById('rating-form');
            const destinationId = new URLSearchParams(window.location.search).get('id');
            
            const visualization = ratingForm.querySelector('.rating-visualization');
            if (visualization) visualization.remove();
            
            ratingForm.classList.add('success-animation');
            setTimeout(() => {
                ratingForm.classList.remove('success-animation');
            }, 3000);
            
            if (destinationId && typeof loadDestinationRatings === 'function') {
                setTimeout(() => {
                    loadDestinationRatings(destinationId);
                }, 1000);
            }
            
            setTimeout(() => {
                const reviewsSection = document.querySelector('.reviews-list-container');
                if (reviewsSection) {
                    reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 1200);
        }
    });
});