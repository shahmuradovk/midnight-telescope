/* =============================================================
   Busamania RC — main.js
   A) IntersectionObserver   B) Shared Navigation + i18n
   D) Counter Animation      E) Page Transitions
   ============================================================= */

document.addEventListener('DOMContentLoaded', async () => {
    // Splash screen (only on index page)
    initSplash();

    // B) Load navbar
    await loadNavbar();

    // Apply translations AFTER navbar is in DOM
    applyTranslations();

    // E) Fade page in
    document.body.classList.add('loaded');

    // A) Scroll animations
    initScrollAnimations();

    // D) Counter animation
    initCounters();

    // Page-specific data loaders
    const page = document.body.dataset.page;
    if (page === 'about') loadAboutData();
    if (page === 'members') loadMembersData();
    if (page === 'charter') { loadCharterData(); setTimeout(initAccordion, 150); }
});

/* ── SPLASH SCREEN ───────────────────────────────── */
function initSplash() {
    const splash = document.getElementById('splash');
    const content = document.getElementById('main-content');
    if (!splash) return;

    // Prevent page scroll while splash is visible
    document.body.style.overflow = 'hidden';

    // Create gold sparks
    for (let i = 0; i < 18; i++) {
        const s = document.createElement('div');
        s.className = 'spark';
        const angle = Math.random() * 360;
        const dist = 140 + Math.random() * 60;
        const x = 50 + dist * Math.cos(angle * Math.PI / 180) * 0.065;
        const y = 50 + dist * Math.sin(angle * Math.PI / 180) * 0.065;
        s.style.cssText = `--x:${x}%;--y:${y}%;--dur:${2 + Math.random() * 2}s;--delay:${Math.random() * 2}s;--tx:${(Math.random() - 0.5) * 60}px;--ty:${-40 - Math.random() * 60}px;`;
        splash.appendChild(s);
    }

    // Click to enter
    splash.addEventListener('click', () => {
        splash.classList.add('leaving');
        splash.addEventListener('animationend', () => {
            splash.style.display = 'none';
            document.body.style.overflow = '';
            if (content) {
                content.style.opacity = '1';
                content.style.pointerEvents = 'all';
            }
        }, { once: true });
    });

    // Initially hide main content
    if (content) {
        content.style.opacity = '0';
        content.style.pointerEvents = 'none';
        content.style.transition = 'opacity 0.6s ease';
    }
}

/* ── B) SHARED NAVBAR LOADER ──────────────────────────────── */
async function loadNavbar() {
    const placeholder = document.getElementById('nav-placeholder');
    if (!placeholder) return;

    let html = '';

    if (location.protocol !== 'file:') {
        try {
            const res = await fetch('components/navbar.html');
            if (res.ok) html = await res.text();
        } catch (e) { /* fall through to inline */ }
    }

    // Inline fallback (always on file://)
    if (!html) {
        html = `<header class="site-header">
            <div class="header-top">
                <div class="header-logo-wrap">
                    <div class="header-logo-spinner">
                        <img src="assets/logo.png" alt="Busamania RC" class="spinner-front">
                        <img src="assets/logo.png" alt="Busamania RC" class="spinner-back">
                    </div>
                </div>
                <div class="header-club-name">
                    <a href="index.html">
                        <h2 class="club-title">BUSAMANIA <span style="-webkit-text-fill-color:var(--accent-gold)">RC</span></h2>
                        <p class="club-tagline" data-i18n="hero.eyebrow">Azərbaycan · 2017-dən</p>
                    </a>
                </div>
                <div class="lang-switcher" id="lang-switcher">
                    <button class="lang-current" id="lang-current-btn">
                        <span class="lang-globe">🌐</span>
                        <span id="lang-current-label">AZ</span>
                        <span class="lang-arrow">▾</span>
                    </button>
                    <div class="lang-dropdown" id="lang-dropdown">
                        <button class="lang-option" data-lang="az">🇦🇿 Azərbaycanca</button>
                        <button class="lang-option" data-lang="en">🇬🇧 English</button>
                        <button class="lang-option" data-lang="ru">🇷🇺 Русский</button>
                    </div>
                </div>
            </div>
            <nav class="header-nav">
                <ul class="nav-links" id="nav-links">
                    <li><a href="about.html"       data-i18n="nav.about">Haqqımızda</a></li>
                    <li><a href="structure.html" data-i18n="nav.structure">Club Structure</a></li>
                    <li><a href="generations.html" data-i18n="nav.generations">Hayabusa Generations</a></li>
                    <li><a href="charter.html"     data-i18n="nav.charter">Nizamnamə</a></li>
                    <li><a href="gallery.html"     data-i18n="nav.gallery">Qalereya</a></li>
                </ul>
            </nav>
        </header>`;
    }

    placeholder.innerHTML = html;

    // Mark active nav link
    const current = location.pathname.split('/').pop() || 'index.html';
    placeholder.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === current) link.classList.add('active');
    });

    // E) Page fade transition on nav link click
    placeholder.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#')) return;
            e.preventDefault();
            document.body.classList.remove('loaded');
            setTimeout(() => { window.location.href = href; }, 320);
        });
    });

    // Language dropdown
    initLangDropdown(placeholder);
}

function initLangDropdown(scope) {
    const switcher = scope.querySelector('#lang-switcher');
    const currentBtn = scope.querySelector('#lang-current-btn');
    const dropdown = scope.querySelector('#lang-dropdown');
    const label = scope.querySelector('#lang-current-label');
    if (!switcher || !currentBtn || !dropdown) return;

    // Set initial label
    const langNames = { az: 'AZ', en: 'EN', ru: 'RU' };
    if (label) label.textContent = langNames[getLang()] || 'AZ';

    // Toggle open
    currentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        switcher.classList.toggle('open');
    });

    // Close on outside click
    document.addEventListener('click', () => switcher.classList.remove('open'));

    // Option click
    scope.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = opt.dataset.lang;
            setLang(lang);
            if (label) label.textContent = langNames[lang];
            switcher.classList.remove('open');
            applyTranslations();

            // Re-render data-driven content with new language
            const page = document.body.dataset.page;
            if (page === 'about') loadAboutData();
            if (page === 'members') loadMembersData();
            if (page === 'charter') { loadCharterData(); setTimeout(initAccordion, 150); }
        });
    });
}


/* ── A) INTERSECTIONOBSERVER ──────────────────────────────── */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in, .fade-up').forEach(el => observer.observe(el));
}

/* ── D) COUNTER ANIMATION ─────────────────────────────────── */
function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    if (!counters.length) return;

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const end = parseInt(el.dataset.count, 10);
            let cur = 0;
            const step = end / (1800 / 16);
            const tick = () => {
                cur += step;
                if (cur < end) { el.textContent = Math.floor(cur); requestAnimationFrame(tick); }
                else { el.textContent = end; }
            };
            requestAnimationFrame(tick);
            obs.unobserve(el);
        });
    }, { threshold: 0.5 });

    counters.forEach(el => obs.observe(el));
}

/* ── ACCORDION ────────────────────────────────────────────── */
function initAccordion() {
    const items = document.querySelectorAll('.accordion-item');
    items.forEach(item => {
        const header = item.querySelector('.accordion-header');
        if (!header) return;
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            items.forEach(i => {
                i.classList.remove('active');
                const c = i.querySelector('.accordion-content');
                if (c) c.style.maxHeight = null;
            });
            if (!isActive) {
                item.classList.add('active');
                const c = item.querySelector('.accordion-content');
                if (c) c.style.maxHeight = c.scrollHeight + 'px';
            }
        });
    });
}

/* ── DATA LOADERS (use i18n translations) ─────────────────── */
function loadAboutData() {
    const stored = JSON.parse(localStorage.getItem('busamania_about')) || {};
    const set = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.textContent = stored[id] || t(key);
    };
    set('about-intro', 'about.intro.text');
    set('about-mission', 'about.mission.text');
    set('about-vision', 'about.vision.text');
}

function loadMembersData() {
    const container = document.getElementById('members-container');
    if (!container) return;

    let members = JSON.parse(localStorage.getItem('busamania_members'));
    const roles = [t('member.role1'), t('member.role2'), t('member.role3')];

    if (!members || !members.length) {
        members = [
            { name: "John Doe", bike: "Suzuki Hayabusa Gen 3", roleKey: 0, img: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400" },
            { name: "Ali M.", bike: "Suzuki Hayabusa Gen 2", roleKey: 1, img: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=400" },
            { name: "Tariq H.", bike: "Yamaha R1M", roleKey: 2, img: "https://images.unsplash.com/photo-1552309736-ecbf32140bb0?auto=format&fit=crop&q=80&w=400" }
        ];
    }

    container.innerHTML = '';
    members.forEach((m, i) => {
        const bio = m.bio || roles[m.roleKey] || roles[i] || '';
        const imgSrc = (!m.img || m.img.includes('placeholder'))
            ? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400'
            : m.img;
        const card = document.createElement('div');
        card.className = 'card fade-in';
        card.innerHTML = `
            <div class="member-img-wrap"><img src="${imgSrc}" alt="${m.name}" loading="lazy"></div>
            <h3 class="member-name">${m.name}</h3>
            <p class="member-bike">${m.bike}</p>
            <p>${bio}</p>
        `;
        container.appendChild(card);
    });
    initScrollAnimations();
}

function loadCharterData() {
    const container = document.getElementById('charter-container');
    if (!container) return;

    let rules = JSON.parse(localStorage.getItem('busamania_rules'));
    if (!rules || !rules.length) {
        rules = [
            { titleKey: 'rule1.title', contentKey: 'rule1.content' },
            { titleKey: 'rule2.title', contentKey: 'rule2.content' },
            { titleKey: 'rule3.title', contentKey: 'rule3.content' }
        ];
    }

    container.innerHTML = '';
    rules.forEach(rule => {
        const acc = document.createElement('div');
        acc.className = 'accordion-item fade-in';
        const title = rule.titleKey ? t(rule.titleKey) : rule.title;
        const content = rule.contentKey ? t(rule.contentKey) : rule.content;
        acc.innerHTML = `
            <div class="accordion-header">${title}<span>+</span></div>
            <div class="accordion-content"><p><br>${content}</p></div>
        `;
        container.appendChild(acc);
    });
    initScrollAnimations();
}
