/* =============================================================
   Busamania RC — admin.js
   Modules: Auth | UI | AboutManager | MembersManager |
            GalleryManager | CharterManager | HeroManager
   ============================================================= */

'use strict';

/* ══════════════════════════════════════════════════════════════
   AUTH
══════════════════════════════════════════════════════════════ */
const Auth = {
    SESSION_KEY: 'bm_admin_session',
    PW_HASH_KEY: 'bm_admin_pw_hash',

    isLoggedIn() {
        return !!localStorage.getItem(this.SESSION_KEY);
    },

    async sha256(str) {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async getStoredHash() {
        let h = localStorage.getItem(this.PW_HASH_KEY);
        if (!h) {
            h = await this.sha256('busamania2017');
            localStorage.setItem(this.PW_HASH_KEY, h);
        }
        return h;
    },

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        window.location.href = 'login.html';
    }
};

/* ══════════════════════════════════════════════════════════════
   UI HELPERS
══════════════════════════════════════════════════════════════ */
const UI = {
    /** Toast notification */
    toast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        t.textContent = `${icons[type] || ''} ${message}`;
        container.appendChild(t);
        setTimeout(() => {
            t.style.animation = 'toastOut 0.35s forwards';
            t.addEventListener('animationend', () => t.remove());
        }, duration);
    },

    /** Confirm modal */
    confirm(title, msg) {
        return new Promise(resolve => {
            const modal = document.getElementById('confirm-modal');
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-msg').textContent = msg;
            modal.classList.add('open');
            const ok = document.getElementById('confirm-ok');
            const cancel = document.getElementById('confirm-cancel');
            const close = () => { modal.classList.remove('open'); };
            ok.onclick = () => { close(); resolve(true); };
            cancel.onclick = () => { close(); resolve(false); };
        });
    },

    /** Switch active panel */
    showPanel(name) {
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const panel = document.getElementById(`panel-${name}`);
        const nav = document.querySelector(`.nav-item[data-panel="${name}"]`);
        if (panel) panel.classList.add('active');
        if (nav) nav.classList.add('active');
        const titles = {
            overview: 'Ümumi Baxış', about: 'Haqqımızda', members: 'Üzvlər',
            gallery: 'Qalereya', charter: 'Nizamnamə', hero: 'Hero Statistika', settings: 'Parametrlər'
        };
        document.getElementById('topbar-title').textContent = titles[name] || name;
    },

    /** Read file as base64 data URL */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    /** Live clock */
    startClock() {
        const el = document.getElementById('topbar-time');
        const tick = () => {
            const now = new Date();
            el.textContent = now.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                + ' · ' + now.toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' });
        };
        tick();
        setInterval(tick, 1000);
    }
};

/* ══════════════════════════════════════════════════════════════
   ABOUT MANAGER
══════════════════════════════════════════════════════════════ */
const AboutManager = {
    KEY: 'busamania_about',

    DEFAULTS: {
        'about-intro': 'Busamania RC Azərbaycandakı elit motosiklet sürücülərinin eksklüziv bir birliyidir. Biz yalnız sürət üçün deyil, hörmət, intizam və birlik üçün sürürük.',
        'about-mission': 'Azərbaycanda Hayabusa və yüksək performans motosiklet həvəskarlarını bir qardaşlıq altında birləşdirmək, təhlükəsiz sürüşü, hörmeti və elit performansı təşviq etmək.',
        'about-vision': 'Regionun ən hörmətli və tanınan elit motosiklet klubu olmaq, sürücü yoldaşlığı və ictimai xidmət üçün standart qoymaq.'
    },

    load() {
        const data = JSON.parse(localStorage.getItem(this.KEY)) || {};
        ['about-intro', 'about-mission', 'about-vision'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = data[id] || this.DEFAULTS[id] || '';
        });
    },

    save() {
        const data = {};
        ['about-intro', 'about-mission', 'about-vision'].forEach(id => {
            const el = document.getElementById(id);
            if (el) data[id] = el.value.trim();
        });
        localStorage.setItem(this.KEY, JSON.stringify(data));
        UI.toast('Haqqımızda mətni yadda saxlandı!');
        DeployManager.autoDeploy();
    }
};

/* ══════════════════════════════════════════════════════════════
   MEMBERS MANAGER
══════════════════════════════════════════════════════════════ */
const MembersManager = {
    KEY: 'busamania_members',
    pendingImg: null, // base64 or null

    DEFAULTS: [
        { name: 'Elnur H.', bike: 'Suzuki Hayabusa Gen 3', role: 'President', bio: 'Qurucu & Prezident', img: '' },
        { name: 'Rauf A.', bike: 'Suzuki Hayabusa Gen 2', role: 'Vitse-President', bio: 'Yol Kapitanı', img: '' },
        { name: 'Kamran M.', bike: 'Suzuki Hayabusa Gen 1', role: 'Mexanik', bio: 'Baş Mexanik', img: '' },
    ],

    load() {
        return JSON.parse(localStorage.getItem(this.KEY)) || this.DEFAULTS;
    },

    save(members) {
        localStorage.setItem(this.KEY, JSON.stringify(members));
        OverviewManager.refresh();
        DeployManager.autoDeploy();
    },

    render() {
        const members = this.load();
        const list = document.getElementById('members-list');
        if (!list) return;
        list.innerHTML = '';

        if (!members.length) {
            list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem 0;">Heç bir üzv tapılmadı.</p>';
            return;
        }

        members.forEach((m, i) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.draggable = true;
            item.dataset.index = i;

            const imgSrc = m.img || '';
            const thumbHTML = imgSrc
                ? `<img src="${imgSrc}" class="list-item-thumb" alt="${m.name}" onerror="this.style.display='none'">`
                : `<div class="list-item-thumb-placeholder">🏍️</div>`;

            item.innerHTML = `
                <span class="drag-handle" title="Sürükləyin">⠿</span>
                ${thumbHTML}
                <div class="list-item-info">
                    <div class="list-item-name">${m.name}</div>
                    <div class="list-item-sub">${m.bike || '—'} &nbsp;·&nbsp; <span class="badge">${m.role || 'Üzv'}</span></div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-outline btn-sm btn-icon" title="Redaktə et" data-action="edit" data-index="${i}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                    </button>
                    <button class="btn btn-danger btn-sm btn-icon" title="Sil" data-action="delete" data-index="${i}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                </div>
            `;

            // Actions
            item.querySelector('[data-action="edit"]').addEventListener('click', () => this.openEditModal(i));
            item.querySelector('[data-action="delete"]').addEventListener('click', async () => {
                const ok = await UI.confirm('Üzvü silmək istəyirsiniz?', `"${m.name}" silinəcək. Bu əməliyyat geri alına bilməz.`);
                if (ok) { const ms = this.load(); ms.splice(i, 1); this.save(ms); this.render(); UI.toast('Üzv silindi.', 'info'); }
            });

            // Drag to reorder
            item.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', i); item.classList.add('dragging'); });
            item.addEventListener('dragend', () => item.classList.remove('dragging'));
            item.addEventListener('dragover', e => { e.preventDefault(); item.classList.add('drag-over-top'); });
            item.addEventListener('dragleave', () => { item.classList.remove('drag-over-top'); item.classList.remove('drag-over-bottom'); });
            item.addEventListener('drop', e => {
                e.preventDefault();
                item.classList.remove('drag-over-top');
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                const toIdx = parseInt(item.dataset.index);
                if (fromIdx === toIdx) return;
                const ms = this.load();
                const [moved] = ms.splice(fromIdx, 1);
                ms.splice(toIdx, 0, moved);
                this.save(ms);
                this.render();
            });

            list.appendChild(item);
        });
    },

    async addMember() {
        const name = document.getElementById('mem-name').value.trim();
        const role = document.getElementById('mem-role').value;
        const bike = document.getElementById('mem-bike').value.trim();
        const bio = document.getElementById('mem-bio').value.trim();
        const imgUrl = document.getElementById('mem-img-url').value.trim();

        if (!name) { UI.toast('Ad daxil edin!', 'error'); return; }

        const img = this.pendingImg || imgUrl || '';
        const members = this.load();
        members.push({ name, bike, role, bio, img });
        this.save(members);
        this.render();

        // Reset form
        ['mem-name', 'mem-bike', 'mem-bio', 'mem-img-url'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('mem-role').value = 'Üzv';
        this.pendingImg = null;
        document.getElementById('mem-preview-wrap').style.display = 'none';
        UI.toast(`"${name}" üzv kimi əlavə edildi!`);
    },

    openEditModal(index) {
        const members = this.load();
        const m = members[index];
        document.getElementById('edit-mem-index').value = index;
        document.getElementById('edit-mem-name').value = m.name || '';
        document.getElementById('edit-mem-role').value = m.role || 'Üzv';
        document.getElementById('edit-mem-bike').value = m.bike || '';
        document.getElementById('edit-mem-bio').value = m.bio || '';
        document.getElementById('edit-mem-img-url').value = (m.img && !m.img.startsWith('data:')) ? m.img : '';
        const prev = document.getElementById('edit-mem-preview-wrap');
        const prevImg = document.getElementById('edit-mem-img-preview');
        if (m.img) { prevImg.src = m.img; prev.style.display = 'block'; }
        else { prev.style.display = 'none'; }
        this._editPendingImg = null;
        document.getElementById('edit-member-modal').classList.add('open');
    },

    saveEditModal() {
        const index = parseInt(document.getElementById('edit-mem-index').value);
        const members = this.load();
        const imgUrl = document.getElementById('edit-mem-img-url').value.trim();
        const img = this._editPendingImg || imgUrl || members[index].img || '';
        members[index] = {
            name: document.getElementById('edit-mem-name').value.trim(),
            role: document.getElementById('edit-mem-role').value,
            bike: document.getElementById('edit-mem-bike').value.trim(),
            bio: document.getElementById('edit-mem-bio').value.trim(),
            img
        };
        this.save(members);
        this.render();
        document.getElementById('edit-member-modal').classList.remove('open');
        UI.toast('Üzv məlumatları yeniləndi!');
    },

    setupFileInput(inputId, previewImgId, previewWrapId, storeKey) {
        const input = document.getElementById(inputId);
        if (!input) return;
        input.addEventListener('change', async () => {
            const file = input.files[0];
            if (!file) return;
            try {
                const dataURL = await UI.readFileAsDataURL(file);
                document.getElementById(previewImgId).src = dataURL;
                document.getElementById(previewWrapId).style.display = 'block';
                this[storeKey] = dataURL;
            } catch { UI.toast('Şəkil oxunarkən xəta baş verdi.', 'error'); }
        });
    }
};

/* ══════════════════════════════════════════════════════════════
   GALLERY MANAGER
══════════════════════════════════════════════════════════════ */
const GalleryManager = {
    KEY: 'busamania_gallery',

    DEFAULTS: [
        { url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80', caption: 'Hayabusa' },
        { url: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80', caption: 'Gece Sürüşü' },
        { url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80', caption: 'Klub' }
    ],

    load() {
        const raw = JSON.parse(localStorage.getItem(this.KEY));
        if (!raw) return this.DEFAULTS;
        // Support both old (string[]) and new ({url,caption}[]) format
        return raw.map(item => typeof item === 'string' ? { url: item, caption: '' } : item);
    },

    save(gallery) {
        localStorage.setItem(this.KEY, JSON.stringify(gallery));
        OverviewManager.refresh();
        DeployManager.autoDeploy();
    },

    render() {
        const gallery = this.load();
        const grid = document.getElementById('gallery-grid');
        const count = document.getElementById('gallery-count');
        if (!grid) return;
        if (count) count.textContent = gallery.length;
        grid.innerHTML = '';

        gallery.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'gallery-preview-item';
            div.innerHTML = `
                <img src="${item.url}" alt="${item.caption || 'Şəkil ' + (i + 1)}" loading="lazy" onerror="this.parentElement.style.display='none'">
                ${item.caption ? `<div class="gal-caption">${item.caption}</div>` : ''}
                <div class="gal-overlay">
                    <button class="btn btn-danger btn-sm btn-icon" title="Sil" data-gal-del="${i}">
                        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                </div>
            `;
            div.querySelector(`[data-gal-del="${i}"]`).addEventListener('click', async () => {
                const ok = await UI.confirm('Şəkli silmək istəyirsiniz?', 'Bu şəkil qalereyadan silinəcək.');
                if (ok) { const g = this.load(); g.splice(i, 1); this.save(g); this.render(); UI.toast('Şəkil silindi.', 'info'); }
            });
            grid.appendChild(div);
        });
    },

    async addFromURL() {
        const url = document.getElementById('gal-url').value.trim();
        const caption = document.getElementById('gal-caption').value.trim();
        if (!url) { UI.toast('URL daxil edin!', 'error'); return; }
        const gallery = this.load();
        gallery.push({ url, caption });
        this.save(gallery);
        this.render();
        document.getElementById('gal-url').value = '';
        document.getElementById('gal-caption').value = '';
        UI.toast('Şəkil əlavə edildi!');
    },

    async addFromFiles(files) {
        const gallery = this.load();
        const caption = document.getElementById('gal-caption').value.trim();
        let added = 0;
        for (const file of files) {
            try {
                const dataURL = await UI.readFileAsDataURL(file);
                gallery.push({ url: dataURL, caption: caption || file.name.replace(/\.[^.]+$/, '') });
                added++;
            } catch { /* skip */ }
        }
        if (added) {
            this.save(gallery);
            this.render();
            UI.toast(`${added} şəkil əlavə edildi!`);
        }
    }
};

/* ══════════════════════════════════════════════════════════════
   CHARTER MANAGER
══════════════════════════════════════════════════════════════ */
const CharterManager = {
    KEY: 'busamania_rules',

    DEFAULTS: [
        { title: 'Maddə 1: Hörmət və Qardaşlıq', content: 'Hər bir üzv digər üzvlərə ən yüksək hörmətlə yanaşmalıdır. Qardaşlıq hər şeydən üstündür.' },
        { title: 'Maddə 2: Sürüş Təhlükəsizliyi', content: 'Qrup sürüşlərində tam avadanlıq məcburidir. Ehtiyatsız sürüş dayandırmaya səbəb ola bilər.' },
        { title: 'Maddə 3: Toplantılara İştirak', content: 'Üzvlər rəsmi toplantı və tədbirlərin minimum 70%-inə iştirak etməlidir.' }
    ],

    load() {
        return JSON.parse(localStorage.getItem(this.KEY)) || this.DEFAULTS;
    },

    save(rules) {
        localStorage.setItem(this.KEY, JSON.stringify(rules));
        OverviewManager.refresh();
        DeployManager.autoDeploy();
    },

    render() {
        const rules = this.load();
        const list = document.getElementById('charter-list');
        if (!list) return;
        list.innerHTML = '';

        if (!rules.length) {
            list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem 0;">Heç bir qayda tapılmadı.</p>';
            return;
        }

        rules.forEach((rule, i) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-thumb-placeholder">⚖️</div>
                <div class="list-item-info">
                    <div class="list-item-name">${rule.title}</div>
                    <div class="list-item-sub" style="whitespace:normal;">${rule.content.substring(0, 80)}${rule.content.length > 80 ? '...' : ''}</div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-danger btn-sm btn-icon" title="Sil" data-charter-del="${i}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                </div>
            `;
            item.querySelector(`[data-charter-del="${i}"]`).addEventListener('click', async () => {
                const ok = await UI.confirm('Qaydanı silmək istəyirsiniz?', `"${rule.title}" silinəcək.`);
                if (ok) { const rs = this.load(); rs.splice(i, 1); this.save(rs); this.render(); UI.toast('Qayda silindi.', 'info'); }
            });
            list.appendChild(item);
        });
    },

    addRule() {
        const title = document.getElementById('charter-title').value.trim();
        const content = document.getElementById('charter-content').value.trim();
        if (!title || !content) { UI.toast('Başlıq və məzmun daxil edin!', 'error'); return; }
        const rules = this.load();
        rules.push({ title, content });
        this.save(rules);
        this.render();
        document.getElementById('charter-title').value = '';
        document.getElementById('charter-content').value = '';
        UI.toast(`Qayda əlavə edildi!`);
    }
};



/* ══════════════════════════════════════════════════════════════
   OVERVIEW MANAGER
══════════════════════════════════════════════════════════════ */
const OverviewManager = {
    refresh() {
        const members = MembersManager.load().length;
        const gallery = GalleryManager.load().length;
        const charter = CharterManager.load().length;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        set('ov-members', members);
        set('ov-gallery', gallery);
        set('ov-charter', charter);
    }
};

/* ══════════════════════════════════════════════════════════════
   USERS MANAGER
══════════════════════════════════════════════════════════════ */
const UsersManager = {
    KEY: 'bm_admin_users',

    async sha256(str) {
        const buf = new TextEncoder().encode(str);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async ensureDefault() {
        if (!localStorage.getItem(this.KEY)) {
            const hash = await this.sha256('busamania2017');
            localStorage.setItem(this.KEY, JSON.stringify([
                { username: 'admin', passwordHash: hash, role: 'superadmin' }
            ]));
        }
    },

    load() {
        return JSON.parse(localStorage.getItem(this.KEY)) || [];
    },

    save(users) {
        localStorage.setItem(this.KEY, JSON.stringify(users));
    },

    getCurrentUsername() {
        try {
            const s = localStorage.getItem(Auth.SESSION_KEY);
            if (!s) return null;
            return JSON.parse(atob(s)).username || null;
        } catch { return null; }
    },

    render() {
        const users = this.load();
        const list = document.getElementById('users-list');
        if (!list) return;
        list.innerHTML = '';

        if (!users.length) {
            list.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem 0;">Heç bir istifadəçi tapılmadı.</p>';
            return;
        }

        const roleColors = {
            superadmin: 'rgba(255,180,0,0.15)',
            admin: 'rgba(201,168,76,0.12)',
            moderator: 'rgba(100,150,255,0.12)'
        };
        const roleLabels = { superadmin: '⭐ Superadmin', admin: '🔑 Admin', moderator: '📋 Moderator' };

        users.forEach((u, i) => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.style.cssText = `background:${roleColors[u.role] || 'transparent'};`;
            const isSuperAdmin = u.role === 'superadmin';
            item.innerHTML = `
                <div class="list-item-thumb-placeholder">👤</div>
                <div class="list-item-info">
                    <div class="list-item-name">${u.username}</div>
                    <div class="list-item-sub"><span class="badge">${roleLabels[u.role] || u.role}</span></div>
                </div>
                <div class="list-item-actions">
                    ${!isSuperAdmin ? `
                    <button class="btn btn-danger btn-sm btn-icon" title="Sil" data-user-del="${i}">
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                    </button>` : '<span style="font-size:0.7rem;color:var(--text-muted);">qorunur</span>'}
                </div>
            `;
            if (!isSuperAdmin) {
                item.querySelector(`[data-user-del="${i}"]`).addEventListener('click', async () => {
                    const ok = await UI.confirm('İstifadəçini silmək istəyirsiniz?', `"${u.username}" silinəcək.`);
                    if (ok) {
                        const users = this.load();
                        users.splice(i, 1);
                        this.save(users);
                        this.render();
                        UI.toast(`"${u.username}" silindi.`, 'info');
                    }
                });
            }
            list.appendChild(item);
        });
    },

    async addUser() {
        const username = document.getElementById('new-user-name').value.trim();
        const password = document.getElementById('new-user-pw').value;
        const role = document.getElementById('new-user-role').value;

        if (!username) { UI.toast('İstifadəçi adı daxil edin!', 'error'); return; }
        if (password.length < 6) { UI.toast('Şifrə minimum 6 simvol olmalıdır!', 'error'); return; }

        const users = this.load();
        const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
        if (exists) { UI.toast('Bu istifadəçi adı artıq mövcuddur!', 'error'); return; }

        const passwordHash = await this.sha256(password);
        users.push({ username, passwordHash, role });
        this.save(users);
        this.render();

        document.getElementById('new-user-name').value = '';
        document.getElementById('new-user-pw').value = '';
        UI.toast(`"${username}" əlavə edildi!`);
    }
};

/* ══════════════════════════════════════════════════════════════
   SETTINGS MANAGER
══════════════════════════════════════════════════════════════ */
const SettingsManager = {
    async changePassword() {
        const current = document.getElementById('pw-current').value;
        const next = document.getElementById('pw-new').value;
        const confirm = document.getElementById('pw-confirm').value;

        if (!current || !next || !confirm) { UI.toast('Bütün sahələri doldurun!', 'error'); return; }
        if (next.length < 6) { UI.toast('Yeni şifrə minimum 6 simvol olmalıdır!', 'error'); return; }
        if (next !== confirm) { UI.toast('Şifrələr uyğun deyil!', 'error'); return; }

        const currentHash = await Auth.sha256(current);
        const storedHash = await Auth.getStoredHash();

        if (currentHash !== storedHash) { UI.toast('Mövcud şifrə yanlışdır!', 'error'); return; }

        const newHash = await Auth.sha256(next);
        localStorage.setItem(Auth.PW_HASH_KEY, newHash);
        ['pw-current', 'pw-new', 'pw-confirm'].forEach(id => document.getElementById(id).value = '');
        UI.toast('Şifrə uğurla yeniləndi! 🎉');
    },

    async resetData() {
        const ok = await UI.confirm(
            '⚠️ Bütün məlumatları sıfırla',
            'Bu əməliyyat üzvlər, qalereya, nizamnamə və haqqımızda məlumatlarını default vəziyyətinə qaytaracaq. Admin şifrəsi dəyişməyəcək.'
        );
        if (!ok) return;
        ['busamania_about', 'busamania_members', 'busamania_gallery', 'busamania_rules', 'busamania_hero_stats']
            .forEach(k => localStorage.removeItem(k));
        AboutManager.load();
        MembersManager.render();
        GalleryManager.render();
        CharterManager.render();
        HeroManager.init();
        OverviewManager.refresh();
        UI.toast('Bütün məlumatlar sıfırlandı.', 'info');
    }
};

/* ══════════════════════════════════════════════════════════════
   DEPLOY MANAGER — GitHub API → Netlify Auto-Deploy
══════════════════════════════════════════════════════════════ */
const DeployManager = {
    CONFIG_KEY: 'bm_deploy_config',
    _timer: null,

    getConfig() {
        return JSON.parse(localStorage.getItem(this.CONFIG_KEY)) || {
            githubToken: '',
            repoOwner: '',
            repoName: '',
            branch: 'main',
            autoDeploy: true
        };
    },

    saveConfig(config) {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    },

    collectSiteData() {
        return {
            about: JSON.parse(localStorage.getItem('busamania_about')) || AboutManager.DEFAULTS,
            members: JSON.parse(localStorage.getItem('busamania_members')) || MembersManager.DEFAULTS,
            gallery: JSON.parse(localStorage.getItem('busamania_gallery')) || GalleryManager.DEFAULTS,
            charter: JSON.parse(localStorage.getItem('busamania_rules')) || CharterManager.DEFAULTS,
            heroStats: JSON.parse(localStorage.getItem('busamania_hero_stats')) || null,
            _lastUpdated: new Date().toISOString()
        };
    },

    autoDeploy() {
        const config = this.getConfig();
        if (!config.autoDeploy || !config.githubToken || !config.repoOwner || !config.repoName) return;

        // Debounce — wait 2 seconds after last change before deploying
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this.deploy(), 2000);
    },

    async deploy() {
        const config = this.getConfig();
        if (!config.githubToken || !config.repoOwner || !config.repoName) {
            UI.toast('Deploy ayarları tamamlanmayıb! Parametrlər → Deploy bölməsinə keçin.', 'error');
            return;
        }

        const statusEl = document.getElementById('deploy-status');
        const statusDot = document.getElementById('deploy-dot');
        if (statusEl) statusEl.textContent = 'Deploying...';
        if (statusDot) { statusDot.style.background = 'var(--warning)'; statusDot.style.boxShadow = '0 0 8px var(--warning)'; }

        try {
            const siteData = this.collectSiteData();
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(siteData, null, 2))));
            const filePath = 'data/site-data.json';
            const apiBase = `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${filePath}`;

            // Get current file SHA (if exists)
            let sha = null;
            try {
                const getRes = await fetch(`${apiBase}?ref=${config.branch}`, {
                    headers: { 'Authorization': `token ${config.githubToken}` }
                });
                if (getRes.ok) {
                    const data = await getRes.json();
                    sha = data.sha;
                }
            } catch { /* file may not exist yet */ }

            // Commit the file
            const body = {
                message: `Admin panel update — ${new Date().toLocaleString('az-AZ')}`,
                content: content,
                branch: config.branch
            };
            if (sha) body.sha = sha;

            const putRes = await fetch(apiBase, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (putRes.ok) {
                UI.toast('✅ Deploy uğurla göndərildi! Netlify avtomatik yenilənəcək.', 'success');
                if (statusEl) statusEl.textContent = 'Deploy uğurlu';
                if (statusDot) { statusDot.style.background = 'var(--success)'; statusDot.style.boxShadow = '0 0 8px var(--success)'; }
                // Update last deploy time
                const timeEl = document.getElementById('last-deploy-time');
                if (timeEl) timeEl.textContent = new Date().toLocaleString('az-AZ');
            } else {
                const err = await putRes.json();
                throw new Error(err.message || 'GitHub API xətası');
            }
        } catch (e) {
            UI.toast(`❌ Deploy xətası: ${e.message}`, 'error');
            if (statusEl) statusEl.textContent = 'Deploy uğursuz';
            if (statusDot) { statusDot.style.background = 'var(--error)'; statusDot.style.boxShadow = '0 0 8px var(--error)'; }
        }
    },

    initUI() {
        const config = this.getConfig();
        const fields = {
            'deploy-token': 'githubToken',
            'deploy-owner': 'repoOwner',
            'deploy-repo': 'repoName',
            'deploy-branch': 'branch'
        };
        Object.entries(fields).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el) el.value = config[key] || '';
        });
        const autoCheck = document.getElementById('deploy-auto');
        if (autoCheck) autoCheck.checked = config.autoDeploy !== false;
    },

    saveSettings() {
        const config = {
            githubToken: (document.getElementById('deploy-token')?.value || '').trim(),
            repoOwner: (document.getElementById('deploy-owner')?.value || '').trim(),
            repoName: (document.getElementById('deploy-repo')?.value || '').trim(),
            branch: (document.getElementById('deploy-branch')?.value || 'main').trim(),
            autoDeploy: document.getElementById('deploy-auto')?.checked !== false
        };
        this.saveConfig(config);
        UI.toast('Deploy ayarları yadda saxlandı!');
    }
};

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

    // ── Auth guard ──
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // ── Nav ──
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const panel = item.dataset.panel;
            UI.showPanel(panel);
            // Close mobile sidebar
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // ── Logout ──
    document.getElementById('logout-btn').addEventListener('click', Auth.logout.bind(Auth));

    // ── Clock ──
    UI.startClock();

    // ── Load all data ──
    AboutManager.load();
    MembersManager.render();
    GalleryManager.render();
    CharterManager.render();
    OverviewManager.refresh();
    await UsersManager.ensureDefault();
    UsersManager.render();


    // ── About save ──
    document.getElementById('save-about').addEventListener('click', () => AboutManager.save());

    // ── Members ──
    MembersManager.setupFileInput('mem-img-file', 'mem-img-preview', 'mem-preview-wrap', 'pendingImg');
    MembersManager.setupFileInput('edit-mem-img-file', 'edit-mem-img-preview', 'edit-mem-preview-wrap', '_editPendingImg');

    document.getElementById('add-member').addEventListener('click', () => MembersManager.addMember());

    // Edit modal
    document.getElementById('save-edit-member').addEventListener('click', () => MembersManager.saveEditModal());
    document.getElementById('cancel-edit-member').addEventListener('click', () =>
        document.getElementById('edit-member-modal').classList.remove('open'));
    document.getElementById('close-edit-member').addEventListener('click', () =>
        document.getElementById('edit-member-modal').classList.remove('open'));

    // ── Gallery ──
    document.getElementById('add-gallery').addEventListener('click', async () => {
        const files = document.getElementById('gal-img-file').files;
        if (files.length > 0) {
            await GalleryManager.addFromFiles(files);
            document.getElementById('gal-img-file').value = '';
        } else {
            await GalleryManager.addFromURL();
        }
    });

    // Drag & drop on gallery upload area
    const galArea = document.getElementById('gal-upload-area');
    galArea.addEventListener('dragover', e => { e.preventDefault(); galArea.classList.add('drag-over'); });
    galArea.addEventListener('dragleave', () => galArea.classList.remove('drag-over'));
    galArea.addEventListener('drop', async e => {
        e.preventDefault(); galArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length) await GalleryManager.addFromFiles(files);
    });

    // ── Charter ──
    document.getElementById('add-charter').addEventListener('click', () => CharterManager.addRule());

    // ── Hero ──
    document.getElementById('save-hero').addEventListener('click', () => HeroManager.save());

    // ── Settings ──
    document.getElementById('change-pw').addEventListener('click', () => SettingsManager.changePassword());
    document.getElementById('reset-data').addEventListener('click', () => SettingsManager.resetData());

    // ── Deploy ──
    DeployManager.initUI();
    const saveDeployBtn = document.getElementById('save-deploy-settings');
    if (saveDeployBtn) saveDeployBtn.addEventListener('click', () => DeployManager.saveSettings());
    const manualDeployBtn = document.getElementById('manual-deploy-btn');
    if (manualDeployBtn) manualDeployBtn.addEventListener('click', () => DeployManager.deploy());
    const topbarDeploy = document.getElementById('manual-deploy');
    if (topbarDeploy) topbarDeploy.addEventListener('click', () => DeployManager.deploy());

    // ── Users ──
    document.getElementById('add-user').addEventListener('click', () => UsersManager.addUser());


    // ── Close modals on backdrop click ──
    document.getElementById('edit-member-modal').addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('open');
    });
    document.getElementById('confirm-modal').addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('open');
    });
});
