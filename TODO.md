# Task: Fix Hero Video Not Showing/Playing on Homepage

## Diagnosis
- **Firestore field name `heroVideo` is consistent** across all files (adminService.ts, AdminPage.tsx, HomePage.tsx) — no mismatch.
- **Root cause**: Both `<video>` elements used `preload="metadata"` which prevents browsers from downloading enough video data to start autoplay.
- **Fix**: Changed `preload="metadata"` → `preload="auto"` in both video components.

## Files Changed
- [x] `src/components/HeroVideo.tsx` — Changed `preload="metadata"` → `preload="auto"` (standalone HeroVideo component)
- [x] `src/pages/HomePage.tsx` — Changed `preload="metadata"` → `preload="auto"` (inline video in hero section)

