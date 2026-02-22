// This is a front-end demo admin. Production requires backend.
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('admin_logged_in') !== 'true') {
        window.location.href = 'login.html';
    }

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('admin_logged_in');
        window.location.href = 'login.html';
    });

    // Tab switching
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.admin-section');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // --- Data Management ---
    // About
    const aboutData = JSON.parse(localStorage.getItem('busamania_about')) || {
        mission: "To unite Hayabusa and performance motorcycle enthusiasts in Azerbaijan under one brotherhood, promoting safe riding, respect, and elite performance on the roads.",
        vision: "To become the most respected and recognized elite motorcycle club in the region, setting the standard for rider camaraderie and public service.",
        intro: "Busamania RC is an exclusive brotherhood of elite riders who share a passion for the legendary Hayabusa and high-performance superbikes. Founded in Azerbaijan, we ride not just for speed, but for respect, discipline, and unity."
    };
    document.getElementById('edit-mission').value = aboutData.mission;
    document.getElementById('edit-vision').value = aboutData.vision;
    document.getElementById('edit-intro').value = aboutData.intro;

    document.getElementById('save-about').addEventListener('click', () => {
        const newData = {
            mission: document.getElementById('edit-mission').value,
            vision: document.getElementById('edit-vision').value,
            intro: document.getElementById('edit-intro').value
        };
        localStorage.setItem('busamania_about', JSON.stringify(newData));
        alert('About info saved!');
    });

    // Members
    let membersData = JSON.parse(localStorage.getItem('busamania_members')) || [
        { name: "John Doe", bike: "Suzuki Hayabusa Gen 3", bio: "Founder & President", img: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400" },
        { name: "Ali M.", bike: "Suzuki Hayabusa Gen 2", bio: "Road Captain. Speed enthusiast.", img: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=400" },
        { name: "Tariq H.", bike: "Yamaha R1M", bio: "Sergeant at Arms.", img: "https://images.unsplash.com/photo-1552309736-ecbf32140bb0?auto=format&fit=crop&q=80&w=400" }
    ];

    function renderMembers() {
        const list = document.getElementById('members-list');
        list.innerHTML = '';
        membersData.forEach((m, i) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<span>${m.name} - ${m.bike}</span> <button class="delete-btn" onclick="deleteMember(${i})">Delete</button>`;
            list.appendChild(div);
        });
        localStorage.setItem('busamania_members', JSON.stringify(membersData));
    }
    renderMembers();

    document.getElementById('add-member').addEventListener('click', () => {
        const name = document.getElementById('mem-name').value;
        const bike = document.getElementById('mem-bike').value;
        const bio = document.getElementById('mem-bio').value;
        const img = document.getElementById('mem-img').value || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400';
        if (name && bike) {
            membersData.push({ name, bike, bio, img });
            renderMembers();
            document.getElementById('mem-name').value = '';
            document.getElementById('mem-bike').value = '';
            document.getElementById('mem-bio').value = '';
            document.getElementById('mem-img').value = '';
        }
    });

    window.deleteMember = (index) => {
        membersData.splice(index, 1);
        renderMembers();
    };

    // Gallery
    let galleryData = JSON.parse(localStorage.getItem('busamania_gallery')) || [
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1552309736-ecbf32140bb0?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1582236162386-77864dd1e2db?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=800"
    ];

    function renderGallery() {
        const list = document.getElementById('gallery-list');
        list.innerHTML = '';
        galleryData.forEach((url, i) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<span><img src="${url}" style="height:40px; border-radius:4px; margin-right:10px; vertical-align:middle;"> Image ${i + 1}</span> <button class="delete-btn" onclick="deleteGallery(${i})">Delete</button>`;
            list.appendChild(div);
        });
        localStorage.setItem('busamania_gallery', JSON.stringify(galleryData));
    }
    renderGallery();

    document.getElementById('add-gallery').addEventListener('click', () => {
        const url = document.getElementById('gal-url').value;
        if (url) {
            galleryData.push(url);
            renderGallery();
            document.getElementById('gal-url').value = '';
        }
    });

    window.deleteGallery = (index) => {
        galleryData.splice(index, 1);
        renderGallery();
    };

    // Charter
    let charterData = JSON.parse(localStorage.getItem('busamania_rules')) || [
        { title: "Article 1: Respect & Brotherhood", content: "Every member to treat each other with utmost respect. Brotherhood above all." },
        { title: "Article 2: Riding Safety", content: "Gear is mandatory. Reckless riding during group rides will result in suspension." },
        { title: "Article 3: Meeting Attendance", content: "Members must attend minimum 70% of official club meetings and events." }
    ];

    function renderCharter() {
        const list = document.getElementById('charter-list');
        list.innerHTML = '';
        charterData.forEach((rule, i) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<span>${rule.title}</span> <button class="delete-btn" onclick="deleteCharter(${i})">Delete</button>`;
            list.appendChild(div);
        });
        localStorage.setItem('busamania_rules', JSON.stringify(charterData));
    }
    renderCharter();

    document.getElementById('add-charter').addEventListener('click', () => {
        const title = document.getElementById('charter-title').value;
        const content = document.getElementById('charter-content').value;
        if (title && content) {
            charterData.push({ title, content });
            renderCharter();
            document.getElementById('charter-title').value = '';
            document.getElementById('charter-content').value = '';
        }
    });

    window.deleteCharter = (index) => {
        charterData.splice(index, 1);
        renderCharter();
    };

});
