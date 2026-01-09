document.addEventListener('DOMContentLoaded', () => {
    const pois = document.querySelectorAll('.poi');
    const tooltip = document.getElementById('tooltip');
    const countryMap = document.querySelector('.country-map');
    pois.forEach(poi => {
        poi.addEventListener('mouseenter', () => {
            tooltip.innerHTML = `<strong>${poi.getAttribute('data-city')}</strong><br>${poi.getAttribute('data-info')}`;
            tooltip.classList.add('visible');
            const rect = countryMap.getBoundingClientRect();
            const poiRect = poi.getBoundingClientRect();
            tooltip.style.left = (poiRect.left - rect.left + poiRect.width / 2) + 'px';
            tooltip.style.top = (poiRect.top - rect.top - 50) + 'px';
            tooltip.style.transform = 'translateX(-50%)';
        });
        poi.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
    });
    document.querySelectorAll('.card').forEach((card, i) => {
        card.style.opacity = '0'; card.style.transform = 'translateY(30px)'; card.style.transition = 'all 0.6s';
        new IntersectionObserver(entries => { if (entries[0].isIntersecting) setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, i * 100); }).observe(card);
    });
    document.querySelectorAll('.info-card').forEach((c, i) => {
        c.style.opacity = '0'; c.style.transform = 'translateY(20px)';
        setTimeout(() => { c.style.transition = 'all 0.5s'; c.style.opacity = '1'; c.style.transform = 'translateY(0)'; }, 300 + i * 100);
    });
});
