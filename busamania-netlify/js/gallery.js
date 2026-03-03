document.addEventListener("DOMContentLoaded", async () => {
    const galleryContainer = document.getElementById('gallery-container');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');

    if (!galleryContainer) return;

    // Support both old (string[]) and new ({url,caption}[]) format
    function normalizeGallery(raw) {
        if (!raw || !raw.length) return null;
        return raw.map(item => typeof item === 'string' ? { url: item, caption: '' } : item);
    }

    const DEFAULTS = [
        { url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800", caption: "Hayabusa" },
        { url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800", caption: "" },
        { url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800", caption: "Klub" },
        { url: "https://images.unsplash.com/photo-1552309736-ecbf32140bb0?auto=format&fit=crop&q=80&w=800", caption: "" },
        { url: "https://images.unsplash.com/photo-1582236162386-77864dd1e2db?auto=format&fit=crop&q=80&w=800", caption: "" },
        { url: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=800", caption: "Gece Sürüşü" }
    ];

    // Try fetching from JSON first (works on Netlify), fallback to localStorage
    let imagesData = null;
    try {
        const res = await fetch('data/site-data.json?_=' + Date.now());
        if (res.ok) {
            const siteData = await res.json();
            imagesData = normalizeGallery(siteData.gallery);
        }
    } catch { /* fetch may fail on file:// */ }

    if (!imagesData) {
        const raw = JSON.parse(localStorage.getItem('busamania_gallery'));
        imagesData = normalizeGallery(raw) || DEFAULTS;
    }

    // Lightbox caption element (create if not exists)
    let lightboxCaption = document.getElementById('lightbox-caption');
    if (!lightboxCaption) {
        lightboxCaption = document.createElement('p');
        lightboxCaption.id = 'lightbox-caption';
        lightboxCaption.style.cssText = 'color:#E8C96A;text-align:center;margin-top:0.75rem;font-size:0.9rem;';
        lightbox.appendChild(lightboxCaption);
    }

    galleryContainer.innerHTML = '';
    imagesData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-item fade-in visible';
        div.innerHTML = `
            <img src="${item.url}" alt="${item.caption || 'Qalereya Şəkli'}" loading="lazy">
            ${item.caption ? `<span class="gallery-caption">${item.caption}</span>` : ''}
        `;

        div.addEventListener('click', () => {
            lightboxImg.src = item.url;
            lightboxCaption.textContent = item.caption || '';
            lightbox.classList.add('active');
        });

        galleryContainer.appendChild(div);
    });

    closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('active');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) lightbox.classList.remove('active');
    });
});
