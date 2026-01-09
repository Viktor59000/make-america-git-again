document.addEventListener('DOMContentLoaded', () => {
    const pois = document.querySelectorAll('.poi');
    const tooltip = document.getElementById('tooltip');
    const countryMap = document.querySelector('.country-map');

    pois.forEach(poi => {
        poi.addEventListener('mouseenter', (e) => {
            const city = poi.getAttribute('data-city');
            const info = poi.getAttribute('data-info');
            tooltip.innerHTML = `<strong>${city}</strong><br>${info}`;
            tooltip.classList.add('visible');
            const rect = countryMap.getBoundingClientRect();
            const poiRect = poi.getBoundingClientRect();
            tooltip.style.left = (poiRect.left - rect.left + poiRect.width / 2) + 'px';
            tooltip.style.top = (poiRect.top - rect.top - 50) + 'px';
            tooltip.style.transform = 'translateX(-50%)';
        });

        poi.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
    });

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
});
