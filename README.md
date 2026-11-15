# Oleksii Shirokov — portfolio

Static site (GitHub Pages). English at `/`, Ukrainian at `/ua/`.

## Structure
- `index.html`, `ua/index.html` — home pages (generated)
- `projects/food-delivery/`, `ua/projects/food-delivery/` — interactive case study (generated)
- `style.css` — design tokens + components (3 themes: Classic = light, Cyber + Golden = dark)
- `js/site.js` — theme, tabs, count-up, lightbox, menu (no dependencies)
- `tools/build.py` — generator; `tools/content/*.json` — all copy (EN/UA) and case-study data
- `sitemap.xml`, `robots.txt` — generated with hreflang alternates

## Editing
1. Change copy in `tools/content/` (`en.base.json` / `ua.base.json` for existing text, `new_*.json` for new text).
2. Run `python3 tools/build.py` — never edit the generated HTML by hand.

## Adding a case study
Copy `tools/content/food-delivery.json`, translate it, add its slug to `CASE_STUDIES` in `tools/build.py`,
put screens in `projects/<slug>/`, and run the build. Placeholder blocks ("To add") mark missing material.

## Theme & language
Language is the URL. Theme is `localStorage` (`theme`, `darkTheme`). They never touch each other.

## Effects (js/effects.js, js/land.js)
All effects are dependency-free and gated by the active theme; touch devices and `prefers-reduced-motion` get native behaviour.
- Light + Gold: image lens on project cards.
- Light: **scaling cursor** (#16A34A dot → larger, #15803D, ripple waves over interactive elements; sits in the browser top layer via a manual popover).
- Gold: **fluid cursor** (WebGL stable-fluids port, scaled-down gold dye + small golden dot; ripple cursor is the fallback when float WebGL is unavailable).
- Contact section (home) and the CTA card on both About pages — one visual per theme, markup from `contact_visual()` in `tools/build.py`:
  Light = dotted Earth globe (land from `js/land.js`, loaded only in Light), Gold = Plasma Ring, Cyber = Globe Mesh (point cloud in a wireframe cage).
- Cyber: smooth cursor follower, yellow slime hover on project cards, flat Flowbite-style underline on the active nav link.
- Project card images use `aspect-ratio: 4 / 3` with `object-fit: cover`.

## Navigation
Header / burger: Projects · Achievements · Design approach · Skills · Services · Contacts. Footer: Home · Projects · Achievements · Design approach · Services · About · Skills · Contacts.
Header logo "OS" → home page; footer logo "OS" → About page. The About CTA headline rotates through `cta_rotate` in `tools/content/about.json` every 16 s.
