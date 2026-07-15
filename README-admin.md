Admin panel setup
=================

Quick steps to enable full admin features (uploads, Firebase Auth/Firestore):

1. Create a copy of `.env.example` as `.env.local` in the project root and fill Firebase + Cloudinary values.

2. Cloudinary uploads require:
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET` (unsigned upload preset)

3. Install dependencies and run dev server:

```bash
npm install
npm run dev
```

4. Admin routes:
- Login: `/shis-admin/login`
- Dashboard: `/shis-admin/dashboard`

Demo credentials (works when Firebase is not configured):
- Email: `admin@shisfashion.com`
- Password: `luxury123`

Troubleshooting:
- If uploads fail, verify Cloudinary cloud name and upload preset values.
- If auth/data fails, verify all `VITE_FIREBASE_*` values.
