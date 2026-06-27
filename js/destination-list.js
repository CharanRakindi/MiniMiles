/**
 * Mini Miles - Destination List Page Handler
 */
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize destination list for specific pages, not the homepage
    const isHomepage = window.location.pathname === '/' || 
                      window.location.pathname === '/index.html' ||
                      window.location.pathname === '/index.php';
    
    if (isHomepage) {
        console.log('Homepage detected - skipping destination list initialization');
        return; // Exit early on homepage
    }
    
    // The rest of the initialization code for other pages
    console.log('Initializing destination list for non-homepage');

    // Get destination cards with location data
    const destinationCards = document.querySelectorAll('.destination-card[data-lat][data-lng]');
    
    // If Google Maps is loaded and cards exist, initialize preview maps
    if (window.google && window.google.maps && destinationCards.length > 0) {
        // Use the map handler function to initialize preview maps
        initPreviewMaps('.destination-card[data-lat][data-lng]');
    }
});
