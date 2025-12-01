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
        
        // Convert relative path to absolute URL based on current location BEFORE pushState
        const targetUrl = new URL(href, window.location.href).href;
        navigateTo(targetUrl);
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
            // Update Header State (Collapse/Expand)
            updateHeaderState(url);

            // Start Transition
            if (animate) {
                const currentContent = document.querySelector('.main-content');
                if (currentContent) currentContent.classList.add('fade-out');
            }

            // Fetch New Content
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Wait for fade out
            if (animate) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Update Title
            document.title = doc.title;

            // Update Nav
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
                currentContent.className = newContent.className;
                
                currentContent.classList.remove('fade-out');
                currentContent.classList.add('fade-in');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Re-highlight active link
            updateActiveLink();

        } catch (error) {
            console.error('Error loading page:', error);
            // If SPA load fails, fallback to full reload
            window.location.href = url; 
        }
    }

    function updateHeaderState(url) {
        const urlObj = new URL(url, window.location.href);
        const path = urlObj.pathname;
        const header = document.querySelector('header');
        
        if (!header) return;

        // Check if it's home page
        const isHomePage = path.endsWith('index.html') || path.endsWith('/') || path.split('/').pop() === '';

        if (isHomePage) {
            header.classList.remove('collapsed');
        } else {
            header.classList.add('collapsed');
        }
    }

    function updateActiveLink() {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('nav ul li a');
        
        links.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (!href) return;

            try {
                // Resolve link href to absolute path to compare correctly
                const linkUrl = new URL(href, window.location.href);
                
                // Compare pathnames
                if (linkUrl.pathname === currentPath) {
                    link.classList.add('active');
                } else if (currentPath.endsWith('/') && (linkUrl.pathname.endsWith('index.html') || linkUrl.pathname.endsWith('/'))) {
                     // Handle root path matching index.html
                     link.classList.add('active');
                }
            } catch (e) {
                // Ignore invalid URLs
            }
        });
    }
    
    // Initial active state
    updateActiveLink();
    // Initial header state
    updateHeaderState(window.location.href);
    
    // Initialize Particles
    initParticles();

    function initParticles() {
        const canvas = document.createElement('canvas');
        canvas.id = 'global-particles';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];
        
        // Mouse interaction
        let mouse = { x: null, y: null, radius: 200 };
        let interactionTimer = 0;

        window.addEventListener('mousemove', (event) => {
            mouse.x = event.x;
            mouse.y = event.y;
        });

        window.addEventListener('mouseout', () => {
            mouse.x = undefined;
            mouse.y = undefined;
        });
        
        // Resize Canvas
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        // Initial resize
        resize();

        // Particle Class
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 1.5; // Faster movement
                this.vy = (Math.random() - 0.5) * 1.5;
                this.size = Math.random() * 2 + 1;
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 30) + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Mouse interaction (Repulsion/Attraction)
                if (mouse.x != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx*dx + dy*dy);
                    let forceDirectionX = dx / distance;
                    let forceDirectionY = dy / distance;
                    let maxDistance = mouse.radius;
                    let force = (maxDistance - distance) / maxDistance;
                    let directionX = forceDirectionX * force * this.density;
                    let directionY = forceDirectionY * force * this.density;

                    if (distance < mouse.radius) {
                        if (interactionTimer < 150) {
                            // Attraction
                            this.x += directionX * 0.5; 
                            this.y += directionY * 0.5;
                        } else {
                            // Scatter (Repulsion)
                            this.x -= directionX * 2; 
                            this.y -= directionY * 2;
                        }
                    }
                }

                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            }

            draw() {
                // Use theme blue color for particles on light background
                ctx.fillStyle = '#1e3c72'; 
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Init Particles
        function createParticles() {
            particles = [];
            const particleCount = Math.floor(canvas.width * canvas.height / 12000); // More particles
            for (let i = 0; i < Math.min(particleCount, 200); i++) {
                particles.push(new Particle());
            }
        }
        createParticles();
        window.addEventListener('resize', createParticles);

        // Animation Loop
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update interaction timer
            if (mouse.x != null) {
                interactionTimer++;
                if (interactionTimer > 200) { // Reset after cycle
                    interactionTimer = 0;
                }
            } else {
                interactionTimer = 0;
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });
            
            // Draw connections
            particles.forEach((p1, i) => {
                // Connect to other particles
                particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Shorter connections (80px)
                    if (dist < 80) {
                        ctx.strokeStyle = `rgba(30, 60, 114, ${0.2 * (1 - dist/80)})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });

                // Connect to mouse
                if (mouse.x != undefined) {
                    const dx = p1.x - mouse.x;
                    const dy = p1.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < mouse.radius) {
                        // Stronger connection to mouse
                        ctx.strokeStyle = `rgba(30, 60, 114, ${0.4 * (1 - dist/mouse.radius)})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(animate);
        }
        animate();
    }
});
