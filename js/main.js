document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const content = document.querySelector('.main-content');
    
    // Handle Navigation Clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Ignore external links, anchors, or empty links
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
        
        e.preventDefault();
        navigateTo(href);
    });

    // Handle Back/Forward Browser Buttons
    window.addEventListener('popstate', () => {
        loadPage(window.location.href, false);
    });

    async function navigateTo(url) {
        // Update URL
        history.pushState(null, null, url);
        await loadPage(url, true);
    }

    async function loadPage(url, animate = true) {
        try {
            // Start Transition
            if (animate) {
                const currentContent = document.querySelector('.main-content');
                currentContent.classList.add('fade-out');
            }

            // Fetch New Content
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Wait for fade out
            if (animate) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Update Title
            document.title = doc.title;

            // Update Nav (to keep links relative to new URL correct and update active state)
            const newNav = doc.querySelector('.nav-container');
            const currentNav = document.querySelector('.nav-container');
            if (newNav && currentNav) {
                currentNav.innerHTML = newNav.innerHTML;
            }

            // Update Main Content
            const newContent = doc.querySelector('.main-content');
            const currentContent = document.querySelector('.main-content');
            
            if (newContent && currentContent) {
                currentContent.innerHTML = newContent.innerHTML;
                
                // Update classes for grid layout (home vs subpages)
                // Check if new content has home-grid structure or just standard
                // Actually, we can just replace the class list too
                currentContent.className = newContent.className;
                
                // Remove fade-out and add fade-in
                currentContent.classList.remove('fade-out');
                currentContent.classList.add('fade-in');
                
                // Scroll to top of content
                // container.scrollIntoView({ behavior: 'smooth' });
            }

            // Re-highlight active link based on current URL
            updateActiveLink();

        } catch (error) {
            console.error('Error loading page:', error);
            window.location.href = url; // Fallback to full reload
        }
    }

    function updateActiveLink() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const links = document.querySelectorAll('nav ul li a');
        
        links.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            // Simple check: if href ends with the current filename
            if (href && href.endsWith(currentPath)) {
                link.classList.add('active');
            } else if (currentPath === 'index.html' && (href === '#' || href === 'index.html' || href === './')) {
                 // Special case for home
                 if (link.textContent.includes('首页')) link.classList.add('active');
            }
        });
    }
    
    // Initial active state
    updateActiveLink();
});
