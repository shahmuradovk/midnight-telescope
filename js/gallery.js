document.addEventListener("DOMContentLoaded", () => {
    const galleryContainer = document.getElementById('gallery-container');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');

    if (!galleryContainer) return;

    let imagesData = JSON.parse(localStorage.getItem('busamania_gallery'));
    if (!imagesData || imagesData.length === 0) {
        imagesData = [
            "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1552309736-ecbf32140bb0?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1582236162386-77864dd1e2db?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=800"
        ];
    }

    galleryContainer.innerHTML = '';
    imagesData.forEach(url => {
        const item = document.createElement('div');
        item.className = 'gallery-item fade-in visible';
        item.innerHTML = `<img src="${url}" alt="Gallery Image">`;

        item.addEventListener('click', () => {
            lightboxImg.src = url;
            lightbox.classList.add('active');
        });

        galleryContainer.appendChild(item);
    });

    closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });

    // Make esc key close lightbox
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
        }
    });
});
