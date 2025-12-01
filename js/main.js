document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const content = document.querySelector('.main-content');
    
    // Initialize Mobile Menu
    initMobileMenu();
    
    // Initialize Theme Toggle
    initThemeToggle();

    // Initialize QQ Link
    initQQLink();

    // Initialize Konami Code Easter Egg
    initKonamiCode();

    // Handle Navigation Clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Ignore external links, anchors, empty links, or special protocols
        if (!href || 
            href.startsWith('#') || 
            href.startsWith('http') || 
            href.startsWith('mailto:') || 
            href.startsWith('tencent:') || 
            href.startsWith('mqqapi:')) return;
        
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

            // Re-initialize Mobile Menu
            initMobileMenu();
            
            // Re-initialize Theme Toggle
            initThemeToggle();

            // Re-initialize QQ Link
            initQQLink();

            // Trigger Prism Syntax Highlighting
            if (window.Prism) {
                window.Prism.highlightAll();
            }

            // Trigger KaTeX Math Rendering
            if (window.renderMathInElement) {
                renderMathInElement(document.body, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false}
                    ]
                });
            }

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
    
    // Initial Math Rendering
    if (window.renderMathInElement) {
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ]
        });
    }

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
                            this.x -= directionX * 1; 
                            this.y -= directionY * 1;
                        }
                    }
                }

                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            }

            draw() {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                ctx.fillStyle = isDark ? 'rgba(161, 196, 253, 0.8)' : '#1e3c72';
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
                if (interactionTimer > 350) { // Reset after cycle
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
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const rgb = isDark ? '161, 196, 253' : '30, 60, 114';

                // Connect to other particles
                particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Shorter connections (80px)
                    if (dist < 80) {
                        ctx.strokeStyle = `rgba(${rgb}, ${0.2 * (1 - dist/80)})`;
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
                        ctx.strokeStyle = `rgba(${rgb}, ${0.4 * (1 - dist/mouse.radius)})`;
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

    function initMobileMenu() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        // Check if button already exists
        if (nav.querySelector('.menu-toggle')) return;

        const button = document.createElement('button');
        button.className = 'menu-toggle';
        button.innerHTML = '☰';
        button.setAttribute('aria-label', 'Toggle navigation');
        
        button.addEventListener('click', () => {
            const ul = nav.querySelector('ul');
            if (ul) {
                ul.classList.toggle('active');
                button.innerHTML = ul.classList.contains('active') ? '✕' : '☰';
            }
        });

        nav.insertBefore(button, nav.firstChild);
    }

    function initThemeToggle() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        // Check if button already exists
        if (nav.querySelector('.theme-toggle')) return;

        const button = document.createElement('button');
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle theme');
        // Styles are handled in CSS
        
        // Function to set theme
        const setTheme = (theme) => {
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                button.innerHTML = '☀️';
                button.style.color = '#ffd700'; // Sun color
            } else {
                document.documentElement.removeAttribute('data-theme');
                button.innerHTML = '🌙';
                button.style.color = '#1e3c72'; // Moon color
            }
        };

        // Load saved theme or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            setTheme(systemDark ? 'dark' : 'light');
        }

        button.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
        
        // Listen for system changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Insert button
        // For mobile, we want it visible. 
        // If we append to nav, it will be after the UL (which is hidden on mobile) and before/after hamburger?
        // Nav structure: [Hamburger] [UL] [ThemeToggle]
        nav.appendChild(button);
    }

    function initQQLink() {
        const qqLink = document.querySelector('.qq-link');
        if (!qqLink) return;

        const uin = '2331952260';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            // Mobile Protocol: Show Profile Card (with Add Friend button)
            qqLink.href = `mqqapi://card/show_pslcard?src_type=internal&version=1&uin=${uin}&card_type=person&source=sharecard`;
        } else {
            // PC Protocol: Add Friend Dialog
            qqLink.href = `tencent://AddContact/?fromId=45&fromSubId=1&subcmd=all&uin=${uin}`;
        }
    }

    function initKonamiCode() {
        const konamiCode = [
            'ArrowUp', 'ArrowUp', 
            'ArrowDown', 'ArrowDown', 
            'ArrowLeft', 'ArrowLeft', 
            'ArrowRight', 'ArrowRight', 
            'b', 'a', 'b', 'a'
        ];
        let cursor = 0;

        document.addEventListener('keydown', (e) => {
            // Check if the key matches the current position in the sequence
            // Use toLowerCase for letters to be case-insensitive if needed, 
            // but Arrow keys are case sensitive.
            // Let's handle 'b' and 'a' specifically or just match key directly.
            
            const key = e.key;
            
            if (key === konamiCode[cursor]) {
                cursor++;
                if (cursor === konamiCode.length) {
                    // Sequence completed
                    window.location.href = 'https://www.locxl.site';
                    cursor = 0; // Reset
                }
            } else {
                cursor = 0; // Reset if wrong key
            }
        });
    }
});
