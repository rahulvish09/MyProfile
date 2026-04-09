document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const navItems = document.querySelectorAll('.nav-item');
    const panels = document.querySelectorAll('.standard-panel');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const std = item.getAttribute('data-std');

            // Update Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update Panels
            panels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.id === `std-${std}`) {
                    panel.classList.add('active');
                }
            });

            // Re-render Mermaid diagrams if needed (Mermaid usually handles this on load, 
            // but since panels are hidden, we might need a nudge if they don't render right)
            // mermaid.init();
        });
    });

    // Particle-like background effect for the detail page
    const bg = document.getElementById('detail-bg');
    if (bg) {
        // Simple subtle mouse move effect
        window.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            bg.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, #1a2233 0%, #0a0e17 100%)`;
        });
    }

    // Scroll reveal logic (similar to main page for consistency)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.clause-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
        observer.observe(card);
    });
});
