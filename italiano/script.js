document.addEventListener('DOMContentLoaded', () => {
    // Gestion des points d'intérêt sur la carte
    const pois = document.querySelectorAll('.poi');
    const tooltip = document.getElementById('tooltip');
    const countryMap = document.querySelector('.country-map');

    pois.forEach(poi => {
        poi.addEventListener('mouseenter', (e) => {
            const city = poi.getAttribute('data-city');
            const info = poi.getAttribute('data-info');

            tooltip.innerHTML = `<strong>${city}</strong><br>${info}`;
            tooltip.classList.add('visible');

            // Positionner le tooltip
            const rect = countryMap.getBoundingClientRect();
            const poiRect = poi.getBoundingClientRect();

            tooltip.style.left = (poiRect.left - rect.left + poiRect.width / 2) + 'px';
            tooltip.style.top = (poiRect.top - rect.top - 50) + 'px';
            tooltip.style.transform = 'translateX(-50%)';
        });

        poi.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });

        // Click pour zoom/info supplémentaire
        poi.addEventListener('click', () => {
            const city = poi.getAttribute('data-city');
            const info = poi.getAttribute('data-info');

            // Animation pulse
            poi.style.animation = 'pulse 0.5s ease';
            setTimeout(() => {
                poi.style.animation = '';
            }, 500);
        });
    });

    // Animation d'entrée des cartes
    const cards = document.querySelectorAll('.card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });

    // Animation d'entrée des info cards
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';

        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });

    // Parallax léger sur le hero
    window.addEventListener('scroll', () => {
        const hero = document.querySelector('.hero');
        const scrolled = window.pageYOffset;
        hero.style.backgroundPositionY = scrolled * 0.5 + 'px';
    });
});

// Style pour l'animation pulse
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
    }
`;
document.head.appendChild(style);
