/**
 * Mini Miles - Utility Functions
 * 
 * This file contains utility functions used throughout the Mini Miles application.
 * It handles common tasks like image error handling and form validation.
 * 
 * Table of Contents:
 * 1. Image Error Handling
 * 2. Form Validation
 * 3. General Utility Functions
 */

/**
 * ======================================
 * 1. IMAGE ERROR HANDLING
 * ======================================
 */

// Cache to track images that have already been processed to prevent infinite loops
const processedImages = new Set();
const ABSOLUTE_PLACEHOLDER_PATH = '/minimiles/images/default-avatar.png'; // Updated to match app

function handleImageError(imgElement) {
    const currentSrc = imgElement.src;
    const placeholderSrc = ABSOLUTE_PLACEHOLDER_PATH;

    // If current src is already the placeholder, stop.
    if (currentSrc.endsWith(placeholderSrc)) {
        console.warn("Image is already placeholder, stopping error handling for:", currentSrc);
        imgElement.onerror = null; // Prevent further error events on the placeholder
        return;
    }

    // Check if we've already tried to process this image
    if (processedImages.has(currentSrc)) {
        console.warn("Already processed this image source, setting to placeholder:", currentSrc);
        imgElement.src = placeholderSrc;
        imgElement.onerror = null;
        return;
    }
    
    // Add current src to processed set to prevent infinite loops
    processedImages.add(currentSrc);
    console.warn("Image failed to load:", currentSrc);

    // Handle localhost URLs (similar to domain URLs)
    if ((currentSrc.includes('localhost') || currentSrc.includes('minimiles.wuaze.com')) && !currentSrc.endsWith(placeholderSrc)) {
        console.log("Handling localhost/domain URL, setting to placeholder:", currentSrc);
        
        // Update session storage if it's a profile picture
        try {
            const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
            if (userData && userData.profilePic && userData.profilePic === currentSrc) {
                // For localhost, convert to relative path; for domain, keep as is
                const relativePath = currentSrc.includes('localhost') 
                    ? currentSrc.replace(/https?:\/\/localhost\/minimiles\//, '')
                    : currentSrc.replace(/https?:\/\/minimiles\.wuaze\.com\//, '');
                userData.profilePic = relativePath;
                sessionStorage.setItem('user', JSON.stringify(userData));
                console.log("Updated profile pic path in session storage to:", relativePath);
            }
        } catch (e) {
            console.error("Error updating session storage:", e);
        }
        
        // Set directly to placeholder to prevent circular references
        imgElement.src = placeholderSrc;
        imgElement.onerror = null;
        return; 
    }
    
    // Direct fallback to placeholder
    imgElement.src = placeholderSrc;
    imgElement.onerror = null;
}

document.addEventListener('DOMContentLoaded', function() {
    const processedImageElements = new WeakSet();
    
    function setupImageErrorHandlers() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (processedImageElements.has(img)) {
                return;
            }
            
            // Store the original src if it's not already the placeholder and not yet set
            if (img.src && !img.src.includes('default-avatar.png') && !img.hasAttribute('data-original-src')) {
                img.setAttribute('data-original-src', img.src);
            }
            
            if (!img.dataset.triedExtensions) {
                img.dataset.triedExtensions = JSON.stringify([]);
            }
            
            // Remove any existing error handler to prevent multiple bindings
            img.onerror = null;
            img.onerror = function() { handleImageError(this); };
            processedImageElements.add(img);
            
            // Check if image is already broken
            if (img.complete && img.naturalHeight === 0 && img.src && !img.src.includes('default-avatar.png') && !img.src.startsWith('data:')) {
                console.log('Image already broken, handling:', img.src);
                if (!img.hasAttribute('data-original-src')) {
                    img.setAttribute('data-original-src', img.src);
                }
                handleImageError(img);
            }
        });
    }
    
    setupImageErrorHandlers();
    // Don't add any more interval or mutation observers that would 
    // continuously reprocess images
});

/**
 * Implements lazy loading for images to improve page load times
 */
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

document.addEventListener('DOMContentLoaded', setupLazyLoading);

/**
 * ======================================
 * 2. FORM VALIDATION
 * ======================================
 */

/**
 * Validates a form by checking all required fields
 * Adds error styling to invalid fields
 * 
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} - Whether the form is valid
 */
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

/**
 * Validates check-in and check-out dates
 * @param {string} checkin - YYYY-MM-DD
 * @param {string} checkout - YYYY-MM-DD
 * @returns {boolean}
 */
function validateBookingDates(checkin, checkout) {
    if (!checkin) return false;
    // If checkout is missing, treat as single-day booking (allow)
    if (!checkout) return true;
    const inDate = new Date(checkin);
    const outDate = new Date(checkout);
    // Allow same day or later checkout
    return inDate <= outDate;
}

/**
 * Utility to enable copying content (for debugging or admin use)
 */
function enableCopyContent() {
    if (!document.body) {
        console.warn("enableCopyContent called before document.body is available. Deferring.");
        document.addEventListener('DOMContentLoaded', enableCopyContent);
        return;
    }

    document.addEventListener('copy', function(e) {
        if (window.getSelection) {
            const selectedText = window.getSelection().toString();
            if (selectedText) {
                e.clipboardData.setData('text/plain', selectedText);
                e.preventDefault();
                console.log('Copy event: content copied');
            }
        }
    });
    document.body.style.userSelect = 'auto';
    console.log('Copy content enabled');
}

// Run only once when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableCopyContent);
} else {
    enableCopyContent();
}

/**
 * ======================================
 * 3. GENERAL UTILITY FUNCTIONS
 * ======================================
 */

/**
 * Handles InfinityFree's anti-bot protection
 * This function fetches from an API endpoint and detects if anti-bot protection is triggered
 * If detected, it extracts the redirect URL and retries the fetch
 * 
 * @param {string} url - The API endpoint URL to fetch from
 * @param {Object} options - Fetch options (optional)
 * @returns {Promise<Response>} - The fetch response
 */
async function fetchWithAntiBotHandling(url, options = {}) {
    try {
        // First attempt to fetch the URL
        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type') || '';
        
        // Check if the response is HTML (potential anti-bot protection)
        if (contentType.includes('text/html')) {
            // Get the HTML content
            const htmlContent = await response.text();
            
            // Check if it contains the anti-bot script
            if (htmlContent.includes('slowAES.decrypt') && htmlContent.includes('location.href')) {
                console.log('Anti-bot protection detected, extracting redirect URL...');
                
                // Extract the redirect URL using regex
                const redirectMatch = htmlContent.match(/location\.href\s*=\s*["']([^"']+)["']/);
                if (redirectMatch && redirectMatch[1]) {
                    const redirectUrl = redirectMatch[1];
                    console.log('Extracted redirect URL:', redirectUrl);
                    
                    // Wait a short time before retrying (simulate script execution)
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Retry the fetch with the redirect URL
                    console.log('Retrying fetch with redirect URL...');
                    return fetch(redirectUrl, options);
                }
            }
            
            // If we couldn't extract a redirect URL, throw an error with the HTML content
            throw new Error('Received HTML response instead of expected data: ' + htmlContent.substring(0, 100) + '...');
        }
        
        // Return the original response if it's not an HTML anti-bot page
        return response;
    } catch (error) {
        console.error('Error in fetchWithAntiBotHandling:', error);
        throw error;
    }
}

// Make the function available globally
window.fetchWithAntiBotHandling = fetchWithAntiBotHandling;

/**
 * Safely parse JSON responses with enhanced error handling
 * 
 * @param {Response} response 
 * @returns {Promise<any>} JSON data if valid, otherwise throws an error with more details
 */
function handleJsonResponse(response) {
    if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
    }
    return response.json();
}

/**
 * Enhanced fetch with better error handling and debugging
 * Handles both JSON and non-JSON responses gracefully
 * 
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Parsed response or error details
 */
async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        // Get response text first to check what we actually received
        const responseText = await response.text();
        
        // Log the raw response for debugging
        console.log(`Response from ${url}:`, {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 200)
        });
        
        // If it's not a successful response, throw with details
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}\nResponse: ${responseText}`);
        }
        
        // Try to parse as JSON
        try {
            const jsonData = JSON.parse(responseText);
            return jsonData;
        } catch (jsonError) {
            // If JSON parsing fails, check if it's HTML (server error page)
            if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
                throw new Error(`Server returned HTML instead of JSON. This usually indicates a server error.\nResponse preview: ${responseText.substring(0, 300)}...`);
            }
            
            // If it's not HTML, it might be plain text error
            throw new Error(`Server returned invalid JSON.\nResponse: ${responseText}`);
        }
        
    } catch (error) {
        // Network error or other fetch error
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error(`Network error: Could not connect to ${url}. Check if the server is running.`);
        }
        
        // Re-throw our custom errors
        throw error;
    }
}

/**
 * Debug utility to log detailed information about failed requests
 * 
 * @param {string} operation - Description of what operation failed
 * @param {Error} error - The error that occurred
 * @param {Object} context - Additional context information
 */
function logDetailedError(operation, error, context = {}) {
    console.group(`❌ ${operation} Failed`);
    console.error('Error:', error.message);
    console.error('Full error:', error);
    
    if (context.url) {
        console.log('URL:', context.url);
    }
    
    if (context.data) {
        console.log('Request data:', context.data);
    }
    
    if (context.response) {
        console.log('Response details:', context.response);
    }
    
    console.groupEnd();
}

// Make utilities available globally
window.fetchWithErrorHandling = fetchWithErrorHandling;
window.logDetailedError = logDetailedError;

/**
 * Applies appropriate page-specific classes to the body element
 * Used to enable different styling between main page and inner pages
 */
function applyPageClasses() {
    const body = document.body;
    const currentPath = window.location.pathname;
    
    // Clear existing page-type classes (except those we want to preserve)
    const preserveClasses = ['loading-profile']; // Classes we don't want to remove
    const classesToRemove = [];
    
    for (let i = 0; i < body.classList.length; i++) {
        const cls = body.classList[i];
        if (!preserveClasses.includes(cls)) {
            classesToRemove.push(cls);
        }
    }
    
    classesToRemove.forEach(cls => body.classList.remove(cls));
    
    // Apply homepage class only to main page
    if (currentPath === '/' || 
        currentPath === '/index.html' || 
        currentPath === '/index.php') {
        body.classList.add('homepage');
    } else {
        // For inner pages, add appropriate page-specific class
        const pageName = currentPath.replace(/\/$/, '').replace(/^\//, '').replace(/\.html$|\.php$/, '');
        if (pageName) {
            body.classList.add(pageName + '-page');
        }
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', applyPageClasses);
// Also run on popstate (for single-page apps or history navigation)
window.addEventListener('popstate', applyPageClasses);