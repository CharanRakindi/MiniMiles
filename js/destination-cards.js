/**
 * Destination Cards Generator - Creates destination cards matching the design in the image
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Destination cards script loaded');
    
    /**
     * Handles image loading errors by setting a fallback image
     * @param {HTMLImageElement} img - The image element
     */
    function handleImageError(img) {
        img.src = '/minimiles/images/placeholder.jpg';
    }
    
    /**
     * Creates a destination card element with the updated design
     * @param {Object} destination - Destination data object
     * @returns {HTMLElement} - Card element
     */
    function createDestinationCard(destination) {
        console.log(`Creating card for destination: ${destination.name}`, destination);
        
        const card = document.createElement('div');
        card.className = 'destination-card';
        card.dataset.id = destination.destination_id || '';
        card.dataset.type = destination.type || 'destination';
        
        const isResort = (destination.type && destination.type.toLowerCase() === 'resort');
        
        let imagePath = destination.image_path || '/minimiles/images/placeholder.jpg';
        if (imagePath.startsWith('/')) {
            imagePath = imagePath.startsWith('/minimiles/') ? imagePath : '/minimiles/' + imagePath.substring(1);
        }
        
        const description = destination.description || 'No description available.';
        
        card.innerHTML = `
            <div class="destination-image-wrapper">
                <img src="${imagePath}" 
                     alt="${destination.name || 'Destination'}" 
                     class="destination-image" 
                     loading="lazy"
                     onerror="handleImageError(this)">
            </div>
            <div class="destination-content">
                <div>
                    <h3 class="destination-name">${destination.name || 'Unnamed Destination'}</h3>
                    <p class="destination-description">${description}</p>
                </div>
                <a href="/minimiles/detail.html?id=${destination.destination_id}" 
                   class="btn-login-style" 
                   data-bookable="${isResort ? 'true' : 'false'}"
                   aria-label="${isResort ? 'Book Now' : 'View More'} about ${destination.name}">
                    ${isResort ? '<span class="btn-icon">🏨</span> Book Now' : 'View More'}
                </a>
            </div>
        `;
        
        if (isResort) {
            const bookBtn = card.querySelector('a[data-bookable="true"]');
            if (bookBtn) {
                bookBtn.addEventListener('click', function(e) {
                    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
                    if (!userData || !userData.id) {
                        e.preventDefault();
                        alert("Login first to book");
                        window.location.href = '/minimiles/login.html';
                    }
                });
            }
        }
        
        return card;
    }
    
    /**
     * Populates a container with destination cards
     * @param {HTMLElement} container - Container element
     * @param {Array} destinations - Array of destination objects
     */
    function populateDestinationCards(container, destinations) {
        if (!container) {
            console.error("Container element not found!");
            return;
        }
        
        console.log(`Attempting to populate ${destinations.length} cards into container:`, container);
        
        container.innerHTML = '';
        
        if (!destinations || destinations.length === 0) {
            container.innerHTML = '<p class="no-destinations">No destinations found</p>';
            return;
        }
        
        console.log(`Container dimensions: ${container.offsetWidth}x${container.offsetHeight}, visibility: ${window.getComputedStyle(container).visibility}`);
        
        destinations.forEach(destination => {
            try {
                const card = createDestinationCard(destination);
                container.appendChild(card);
                console.log(`Card for ${destination.name} appended to container`);
            } catch (error) {
                console.error(`Error creating card for ${destination.name}:`, error);
            }
        });
        
        console.log(`Container now has ${container.children.length} child elements`);
    }
    
    /**
     * Loads destinations from API or uses provided data
     * @param {string} containerId - ID of container element
     * @param {string} type - Type of destinations to load (resort, temple, attraction, camping)
     * @param {Array} [preloadedData] - Optional preloaded destination data
     */
    function loadDestinations(containerId, type, preloadedData) {
        const container = document.getElementById(containerId);
        console.log(`Looking for container with ID: ${containerId}`, container);
        
        if (!container) {
            console.error(`Container with ID '${containerId}' not found!`);
            return;
        }
        
        if (preloadedData) {
            populateDestinationCards(container, preloadedData);
            return;
        }
        
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading destinations...</p>
            </div>
        `;
        
        const apiUrl = `/minimiles/get_destinations.php?type=${type}`;
        console.log(`Fetching destinations from: ${apiUrl}`);
        
        const timeoutId = setTimeout(() => {
            console.warn(`Destination fetch for ${type} taking longer than expected`);
        }, 5000);
        
        const fetchFunction = window.fetchWithAntiBotHandling || fetch;
        
        fetchFunction(apiUrl)
            .then(response => {
                clearTimeout(timeoutId);
                console.log(`Destination fetch response status: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                    return response.text().then(text => {
                        console.error(`Error response: ${text}`);
                        throw new Error(`Server error: ${response.status} ${response.statusText}`);
                    });
                }
                
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    return response.text().then(text => {
                        console.error(`Expected JSON but got: ${contentType}. Response body:`, text);
                        throw new Error('Server returned non-JSON response');
                    });
                }
                
                return response.json();
            })
            .then(data => {
                console.log(`Destination data received for ${type}:`, data);
                
                if (data.success && data.destinations && data.destinations.length > 0) {
                    console.log(`Populating ${data.destinations.length} cards into #${containerId}`);
                    
                    if (container) {
                        container.style.display = 'grid';
                        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
                        container.style.gap = '2rem';
                    }
                    
                    populateDestinationCards(container, data.destinations);
                    
                    setTimeout(() => {
                        const cards = container.querySelectorAll('.destination-card');
                        console.log(`After population, container has ${cards.length} visible cards`);
                    }, 100);
                } else {
                    console.log(`API data not available, checking for fallback data (${type}Data)`);
                    const fallbackData = window[`${type}Data`];
                    if (Array.isArray(fallbackData) && fallbackData.length > 0) {
                        console.log(`Using fallback data for ${type}:`, fallbackData);
                        populateDestinationCards(container, fallbackData);
                    } else {
                        container.innerHTML = `
                            <div class="error-message">
                                <p>${data.message || 'Failed to load destinations'}</p>
                                <button class="retry-button" onclick="window.destinationCards.load('${containerId}', '${type}')">
                                    Retry
                                </button>
                            </div>
                        `;
                    }
                }
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error(`Error loading ${type} destinations:`, error);
                
                console.log(`Fetch error occurred, trying fallback data for ${type}`);
                const fallbackData = window[`${type}Data`];
                if (Array.isArray(fallbackData) && fallbackData.length > 0) {
                    console.log(`Using fallback data for ${type} after fetch error:`, fallbackData);
                    populateDestinationCards(container, fallbackData);
                } else {
                    container.innerHTML = `
                        <div class="error-message">
                            <p>Failed to load destinations. Please try again.</p>
                            <p class="error-details">${error.message}</p>
                            <button class="retry-button" onclick="window.destinationCards.load('${containerId}', '${type}')">
                                Retry
                            </button>
                        </div>
                    `;
                }
            });
    }
    
    window.destinationCards = {
        create: createDestinationCard,
        populate: populateDestinationCards,
        load: loadDestinations
    };
    
    const destinationContainers = document.querySelectorAll('[data-destination-type]');
    destinationContainers.forEach(container => {
        const type = container.dataset.destinationType;
        console.log(`Found container with data-destination-type="${type}", ID="${container.id}"`);
        loadDestinations(container.id, type);
    });
});