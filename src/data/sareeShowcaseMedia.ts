/**
 * Saree homepage video banner — change URLs here only.
 *
 * Local files:
 *   1. Add `public/videos/saree-showcase.mp4` (and optional `saree-showcase.webm`)
 *   2. Keep the paths below as `/videos/saree-showcase.mp4`
 *
 * Cloudinary:
 *   Replace `mp4` / `webm` with full `https://res.cloudinary.com/.../video/upload/...` URLs.
 *
 * Leave `mp4` empty to show the poster still only (no video request).
 */
export const SAREE_SHOWCASE_MEDIA = {
  mp4: '/videos/saree-showcase.mp4',
  webm: '',
  poster: '/collections/featured-saree-collection.jpg',
} as const
