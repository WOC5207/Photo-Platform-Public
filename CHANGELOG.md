# Changelog

## v1.0.0

First tagged release. Everything below has been running end-to-end and is
considered stable enough for real use on a self-hosted NAS.

### Features

- **Photo gallery** grouped by event/album: bulk upload, reordering,
  per-language captions, cover selection, publish/unpublish. Thumbnails are
  pre-generated at upload time; all EXIF (including GPS) is stripped from
  every displayed image, with an option to also scrub stored originals.
  Credited people's social links are remembered across photos and offered as
  autofill.
- **Booking system** with configurable time slots, an unguessable shareable
  link per event (no visitor account needed), transactional capacity checks,
  and a visitor-facing manage/cancel link. Optional per-event prize-draw
  ("lottery") tool built around bookings, with a "check your booking" lookup
  flow.
- **Contact us**: an admin-configurable button in the site header and
  footer that opens a card with a title, link, and/or QR code (e.g. a chat
  app add-friend code).
- **Resource monitor**: an admin tab showing real disk usage — photos (per
  event), site images, and the database — read straight off disk.
- **Fully brandable, no code changes needed**: site title, homepage text,
  background color/image, logo, and photo-credit vocabulary are all edited
  from Admin → Settings (organized by where each setting shows up on the
  site: Header, Background, Homepage, Contact us, Booking, Lottery, Credits)
  and take effect immediately.
- **First-run setup wizard** to pick which optional features (booking,
  lottery, credit-profile management) are enabled before the site goes
  live, plus feature toggles reachable any time afterward.
- **Bilingual everywhere**: locale-prefixed URLs (`/zh/...`, `/en/...`),
  language switcher, and per-language content fields with fallback to the
  other language when one is empty.
- **Single admin account**, seeded from environment variables on first
  login, with session-cookie auth, bcrypt-hashed password, and rate-limited
  login attempts.
- Modest resource use: one container, SQLite, no runtime image optimizer —
  built to run comfortably on a NAS.

### Deployment

- Docker image + `docker-compose.yml` tuned for Synology Container Manager,
  with automatic database migrations on container start.
- New in this release: **[docs/DEPLOY_SYNOLOGY.md](docs/DEPLOY_SYNOLOGY.md)**
  — a detailed, start-to-finish deployment tutorial covering everything from
  first upload to connecting a custom domain with HTTPS (DDNS, DNS records,
  router port forwarding, Let's Encrypt, and DSM's reverse proxy).
