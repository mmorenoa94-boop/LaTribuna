# La Tribuna — Logo & Brand Guidelines

Reference document for designing the project logo. All values are extracted from the current codebase design system.

---

## 1. Brand Identity

- **Name:** La Tribuna
- **Tagline:** "El juego de los que sí saben"
- **Audience:** Colombian football fans (hinchas), sports bars and venues (negocios)
- **Personality:** Bold, competitive, energetic, street-smart, nocturnal
- **Categories:** Games, Sports, Entertainment

---

## 2. Color Palette

### Primary Colors (must appear in the logo)

| Name | Hex | Usage |
|------|-----|-------|
| **LT Green** | `#00E676` | Primary accent, CTAs, brand highlight — the signature color |
| **LT Black** | `#0A0C0F` | Background, dark base — used as the app's background everywhere |

### Secondary Colors (optional in logo, useful for variations)

| Name | Hex | Usage |
|------|-----|-------|
| LT Green Dark | `#00C853` | Gradient companion to LT Green |
| LT White | `#F0F2F5` | Text on dark backgrounds |
| LT Amber | `#FFB300` | Rewards, highlights, energy accents |
| LT Orange | `#FF6D00` | Warnings, intensity |
| LT Red | `#FF4444` | Errors, live/urgent states |

### Key Gradients Used in the App

- **Green glow:** `radial-gradient(ellipse, rgba(0,230,118,0.12), transparent)`
- **Green bar:** `linear-gradient(to right, #00E676, #00E676/60%, transparent)`
- **Shadow glow:** `0 0 20px rgba(0,230,118,0.15)`

### Color Rules

- The logo must be legible on `#0A0C0F` (near-black) backgrounds — this is the primary context
- A monochrome (white-only) version is needed for dark surfaces
- A dark version is needed for light surfaces (print, light mode contexts)
- The green (`#00E676`) should be the dominant accent, not used for large filled areas — it works best as outlines, strokes, or highlights

---

## 3. Typography

### Fonts Used in the App

| Font | Weight(s) | Role |
|------|-----------|------|
| **Bebas Neue** | 400 | Headings, brand name, large display text |
| **Barlow** | 300, 400, 500, 600 | Body text, descriptions |
| **Barlow Condensed** | 600, 700, 800 | Buttons, labels, stats, uppercase UI elements |

### Typography Rules for the Logo

- **Bebas Neue** is the brand font — the logo wordmark should use it or something very close to it
- Bebas Neue is all-caps by nature, which fits the bold/competitive tone
- The brand name in the app is rendered as: `font-bebas text-4xl text-lt-green tracking-wider`
- Letter-spacing is wide (`tracking-wider` = 0.05em) — keep generous spacing
- Consider **Barlow Condensed Bold/ExtraBold** for the tagline if included in the logo lockup

---

## 4. Logo Requirements

### Versions Needed

1. **Full logo** — Icon + wordmark ("La Tribuna")
2. **Icon only** — For app icon, favicon, small contexts
3. **Wordmark only** — Text-only version for inline use

### Size Contexts

| Context | Size | Notes |
|---------|------|-------|
| PWA icon | 192x192, 512x512 | Must work as `maskable` icon (safe zone = inner 80%) |
| Favicon | 32x32, 16x16 | Icon-only, must be recognizable at tiny sizes |
| In-app header | ~40px height | Wordmark or icon, displayed on dark backgrounds |
| Splash/onboarding | Full screen | Large format, can use full logo + tagline |
| Social sharing (OG) | 1200x630 | Used in Open Graph previews |

### Design Constraints

- Must read clearly at 32px (favicon) and 512px (PWA splash)
- The icon should be simple enough to work as a silhouette
- Avoid fine details that collapse at small sizes
- The 512px PWA icon is `maskable` — critical content must stay within the center 80% circle

---

## 5. Visual Language & Motifs

### From the App's Design System

- **Dark-first:** The entire app is dark mode — deep blacks with vibrant accents
- **Cards:** Rounded corners (14px on cards, 10px on buttons)
- **Borders:** Subtle white borders at 7-12% opacity (`rgba(255,255,255,0.07)`)
- **Glow effects:** Green radial glows behind key elements
- **Animations:** Energetic — pulse dots, slide-ups, ticker scrolls

### Thematic Elements to Consider

- Football/soccer iconography (pitch lines, ball, goal, stadium)
- "Tribuna" = the stands/bleachers in a stadium — the crowd section
- Gamification: points, leaderboards, competition
- Colombian football culture: passion, barras (fan groups), local venues
- The pitch grid pattern used in the background: subtle repeating vertical lines

### What to Avoid

- Generic sports logos (swooshes, generic balls)
- Overly corporate or clean aesthetics — the brand is street-level, fan-culture
- Light/white backgrounds as the primary context
- Serif fonts or script fonts — doesn't match the bold condensed UI tone
- Too many colors at once — the palette is green-on-black with selective accents

---

## 6. Reference: How the Brand Name Appears Today

In the invite page (the most "branded" screen):
```
font-bebas text-4xl text-lt-green tracking-wider
→ "La Tribuna" in Bebas Neue, green (#00E676), wide letter spacing
```

In the profile footer:
```
"La Tribuna v1.0 · El juego de los que sí saben"
```

In the onboarding screen:
```
"LA TRIBUNA" — all caps, large, center-aligned
```

---

## 7. File Deliverables

When the logo is ready, provide:

- [ ] SVG (vector, scalable)
- [ ] PNG at 192x192 (PWA icon) — transparent background
- [ ] PNG at 512x512 (PWA maskable icon) — with background color `#0A0C0F`
- [ ] PNG at 1200x630 (Open Graph social preview)
- [ ] Favicon ICO or PNG at 32x32
- [ ] Monochrome white version (SVG + PNG)

Place files in `/public/icons/` and update `manifest.json` and `layout.tsx` references.
