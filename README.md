# 🌸 Flower Hour — Spin the Wheel

A beautifully branded name-picker wheel for **Flower Hour** events. Built as a pure HTML/CSS/JS single-page app — no build tools, no dependencies, just open `index.html` in a browser or deploy to any static host.

> *sip your way through spring*

---

## ✨ Features

### Wheel
- Animated spin wheel with smooth cubic ease-out physics
- Each name's slice is weighted by how many times it appears in the list
- Confetti petal burst on every spin result
- Pointer indicator at the top

### Name Management
- Add individual names or bulk-import (one per line)
- Repeat names to increase their odds on the wheel
- Remove one entry or all entries of a name at once
- Per-name tag/group assignment

### Filtering the Pool
| Filter | Options |
|--------|---------|
| Entry count | All / ×1 / ×2+ / ×3+ |
| Sort order | Recently Added · A–Z · Most Entries · Least Entries · Not Yet Picked |
| Search | Live text filter |
| Tag / Group | Filter by custom tag |

### Post-Spin Options
After a winner is selected, choose to:
- **Keep in Pool** — name stays eligible
- **Remove One Entry** — decreases that name's weight by 1
- **Remove All Entries** — removes the name entirely

### History & Stats
- Full spin history with timestamps
- Top-10 pick frequency bar chart
- Clear history + reset picked status

### Tags / Groups
- Create colour-coded tags
- Assign tags to names for group-based filtering
- Manage tags via the modal

### Persistence
All state (names, history, tags, filters) is saved to `localStorage` automatically. Reload the page and everything is right where you left it.

---

## 🚀 Getting Started

### Option 1: Open locally
```bash
git clone https://github.com/krcochran/flower-hour-wheel.git
cd flower-hour-wheel
open index.html   # macOS
# or just double-click index.html in Finder / Explorer
```

### Option 2: Deploy to GitHub Pages
1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set Source to `main` branch, `/ (root)`
4. Your app will be live at `https://krcochran.github.io/flower-hour-wheel/`

### Option 3: Deploy to Netlify / Vercel
Drag the folder into [netlify.com/drop](https://netlify.com/drop) or connect the repo for auto-deploy.

---

## 📁 File Structure

```
flower-hour-wheel/
├── index.html          # App shell & markup
├── css/
│   └── style.css       # All styles (brand tokens, layout, animations)
├── js/
│   ├── data.js         # State management & localStorage persistence
│   ├── wheel.js        # Canvas wheel renderer & spin physics
│   ├── ui.js           # DOM rendering helpers
│   ├── confetti.js     # Petal confetti effect
│   └── app.js          # Main controller (wires everything together)
└── assets/
    ├── logo-text.png   # "flower hour" wordmark
    ├── icon-martini.png
    ├── icon-bouquet.png
    ├── icon-orange-flowers.png
    └── icon-champagne.jpg
```

---

## 🎨 Brand Colours

| Token | Hex | Usage |
|-------|-----|-------|
| Olive | `#3d4a1f` | Primary text, dark wheel slices |
| Peach | `#f4a95a` | Accent, spin button text, wheel ring |
| Navy | `#2d1b69` | Deep UI, outlines, result banner |
| Pink | `#e8637a` | Highlights, pointer, danger buttons |
| Olive Yellow | `#8a7d2a` | Leaves, secondary text |
| Sky | `#a8d4e6` | Tag chips, glass accents |
| Cream | `#fdf8f0` | Background |

---

## 📝 License

Internal tool for Flower Hour use. All brand assets © Flower Hour.
