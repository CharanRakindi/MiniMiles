/**
 * Mini Miles - Dynamic Footer Script
 * 
 * This script dynamically creates and inserts the footer content
 * for consistency across all pages.
 */
document.addEventListener('DOMContentLoaded', function() {
    createFooter();
});

/**
 * Creates and inserts the footer content
 */
function createFooter() {
    const footer = document.querySelector('footer');
    if (!footer) {
        console.error("Footer element not found.");
        return;
    }

    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-copyright">
                © ${new Date().getFullYear()} Mini Miles. All rights reserved.
            </div>
            <div class="footer-contact">
                <a href="/minimiles/contact-us.html">Contact Us</a>
            </div>
        </div>
    `;
}

window.updateFooter = createFooter;