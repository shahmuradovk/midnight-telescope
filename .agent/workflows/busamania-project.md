---
description: Load and continue the Busamania RC website project
---

# Busamania RC — Project Workflow

## Project Location
`c:\Users\shahm\.gemini\antigravity\playground\midnight-telescope\`

## Project Stack
- Pure HTML5 + CSS3 + Vanilla JavaScript
- No build tools, no framework — direct file editing
- Multilingual: Azerbaijani (az), English (en), Russian (ru) via `js/i18n.js`

## Key Files
| File | Purpose |
|------|---------|
| `index.html` | Ana səhifə — splash screen + video hero + stats + feature cards |
| `structure.html` | Club Structure — President → VP → Secretary/Mechanic/Treasury → Members |
| `about.html` | Haqqımızda səhifəsi |
| `generations.html` | Hayabusa Generations |
| `charter.html` | Nizamnamə |
| `gallery.html` | Qalereya |
| `components/navbar.html` | İki sıralı header (logo + club name + lang + nav) |
| `css/style.css` | Bütün stillər — dizayn tokenları, header, splash, video hero, responsive |
| `js/main.js` | Navbar loader, splash logic, scroll animations, counters |
| `js/i18n.js` | Bütün dillərin tərcümə açarları |
| `assets/logo.png` | Busamania RC loqosu |

## Current Design State (as of 2026-02-22)

### Header (Two-Row)
- **Top row:** Spinning logo (left) | BUSAMANIA RC centered | 🌐 Lang switcher (right)
- **Bottom row:** Horizontal nav — Haqqımızda | Club Structure | Hayabusa Generations | Nizamnamə | Qalereya
- Color: Black background, gold accents (#d4af37)

### Splash Screen
- Full-screen black overlay with spinning logo + gold ring
- "Giriş üçün klikləyin" hint
- Click → fade out → main content revealed

### Video Hero
- YouTube embed: `zblu-Y652S0` (Suzuki Hayabusa 2021 Official)
- Dark overlay + centered text: eyebrow + tagline + 2 CTA buttons
- To replace with local video: swap iframe for `<video>` tag with `assets/hayabusa.mp4`

### Club Structure Page (`structure.html`)
- Hierarchy: President → Vice President → (Secretary | Mechanic | Treasury) → Members (8 slots)
- VP: **Kənan Şahmuradov** (AZ) / **Kanan Shahmuradov** (EN) / **Канан Шахмурадов** (RU)
- Photo placeholders: Replace `👤` with `<img src="assets/members/filename.jpg">`
- All role labels translated via `data-i18n` attributes

### Responsive Breakpoints
- 1024px — Tablet
- 768px — Large phone (Samsung S, iPhone Pro Max)
- 480px — Medium phone (iPhone 14, Samsung A)
- 375px — Small phone (iPhone SE)

## How to Add a Member
In `structure.html`, find the member card and replace:
```html
<!-- Before -->
<p class="struct-name" data-i18n="structure.placeholder.name">Name</p>
<p class="struct-surname" data-i18n="structure.placeholder.sur">Surname</p>

<!-- After — hardcode the name (no i18n needed for proper names) -->
<p class="struct-name">Əli</p>
<p class="struct-surname">Həsənov</p>
```

If name differs per language, add keys to `js/i18n.js`:
```js
// in az: { ... }
'member1.name': 'Kənan', 'member1.surname': 'Şahmuradov',
// in en: { ... }
'member1.name': 'Kanan', 'member1.surname': 'Shahmuradov',
// in ru: { ... }
'member1.name': 'Канан', 'member1.surname': 'Шахмурадов',
```
Then use `data-i18n="member1.name"` in the card.

## How to Add a Photo
1. Copy photo to `assets/members/name.jpg`
2. In the card, replace the placeholder:
```html
<!-- Before -->
<div class="struct-photo">
    <span class="photo-placeholder">👤</span>
</div>

<!-- After -->
<div class="struct-photo">
    <img src="assets/members/kenan.jpg" alt="Kənan Şahmuradov">
</div>
```

## How to Replace YouTube Video With Local Video
In `index.html`, replace the iframe block with:
```html
<video autoplay muted loop playsinline>
    <source src="assets/hayabusa.mp4" type="video/mp4">
</video>
```
Make sure the video file is in `assets/` folder.

## i18n — Adding New Translation Key
1. Open `js/i18n.js`
2. Add key to ALL THREE languages (`az`, `en`, `ru`)
3. Add `data-i18n="your.key"` to the HTML element
