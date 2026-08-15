# Our Little World

A private, two-person relationship website. See [CLAUDE.md](./CLAUDE.md) for the
design rules and [IDEAS.md](./IDEAS.md) for what is deliberately left undone.

All six sections are built:

| Section | What it is |
|---|---|
| **Our Story** | A scroll-driven timeline on a DNA helix. Ten scene worlds cross-fade as you pass each memory; the cat walks down the spine. Arrow keys, prev/next and a dot rail move between memories. |
| **Reasons** | Pick who you are, then pull one reason at a time from what the other person wrote. A tulip garden blooms with each. Either of you can add one inline. |
| **Our Universe** | A canvas night sky. Your stars burn by type, constellations join as chemical bonds, secret stars reveal when you get close. Every star is also in a keyboard-reachable index. |
| **Open When…** | Envelopes on a desk. Opening one cracks the wax, folds the flap back, slides the page out and hands it to you. Bodies never leave the server until opened. |
| **Confessions** | A dark room with a light that follows you. The words are on the note but out of focus until you tap — or hold — to read. |
| **Important Dates** | Days-together counter, a live countdown to whatever is next, and every date on a slow orbit or in a list. |

## The intro

Armed from the admin dashboard, plays once per person, and never fires unless
you switch it on. Four beats, about ninety seconds:

1. **The cord** — the site opens pitch black with one cord hanging. She pulls
   it and gets a candle. Any drag anywhere works; two taps also work.
2. **The room** — a dark room that wakes wherever the candle goes. Nothing is
   hidden and nothing can be missed. Three envelopes are lying about with a
   line each, and the light leaves a trail, so by the end the room holds the
   path she walked.
3. **The wish** — a cake rises with its candles lit. Press and hold; the dark
   closes in, the flames gutter, and they go out one after another.
4. **The finale** — a beat of complete black, then her name written on in
   handwriting, then the warmth, the photos and the way in.

**All the words live in one file: `client/src/intro/config.ts`.** Nothing else
needs touching.

## Running it

```bash
# 1. backend
cd server
cp .env.example .env      # then fill it in (see below)
npm install
npm run seed              # creates the two accounts
npm run dev               # → http://localhost:4000/api/v1

# 2. frontend (second terminal)
cd client
npm install
npm run dev               # → http://localhost:5173
```

### Before you have credentials

The API can run against a throwaway in-memory database so the front end works
straight away:

```bash
cd server && npm run dev:memory
# sign in with  dev@example.com  /  devpassword
# ⚠️ everything is wiped on restart — never put real content in it
```

## What you need to fill into `server/.env`

| Variable | Where it comes from |
|---|---|
| `MONGODB_URI` | MongoDB Atlas (free tier is plenty) or a local `mongod` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` — run it twice |
| `MEDIA_PROVIDER` | `local` for development, `cloudinary` for production |
| `CLOUDINARY_*` | Cloudinary dashboard |
| `SEED_ME_*` / `SEED_HER_*` | The two accounts — email, password (8+ chars), display name |
| `ANCHOR_DATE` | `YYYY-MM-DD`, the date the "days together" counter runs from |

After editing `.env`, run `npm run seed` again to apply account changes.

## Scripts

**server**
| | |
|---|---|
| `npm run dev` | API with hot reload (needs a real `MONGODB_URI`) |
| `npm run dev:memory` | API against a throwaway in-memory DB |
| `npm run seed` | Create/update the two accounts from `.env` |
| `npm run seed:demo` | Fill every section with placeholder content |
| `npm run seed:demo -- --clear` | Wipe **all** content (accounts are kept) |
| `npm run smoke` | End-to-end API test on a temporary DB |
| `npm run build` / `start` | Production |

**client**
| | |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | Types only |

## Demo content

Every section is currently filled with **placeholder text** so the site has
something to render while it is being built. None of it is real. When you are
ready to put your own content in:

```bash
cd server && npm run seed:demo -- --clear
```

That empties every content collection (and the media library) but leaves both
accounts alone.

## Structure

```
client/src
├─ components/     Cat, Nav, Layout, ui/, admin/
├─ pages/          the six sections + admin
├─ lib/            api client, motion constants, types, helpers
├─ store/          auth (zustand), identity
└─ styles/         design tokens + base CSS

server/src
├─ config/         env, db
├─ models/         User, Media, content
├─ routes/         auth, content, media, admin, crudFactory, zod schemas
├─ middleware/     auth, validate, error
└─ scripts/        seed, smoke, devMemory
```

## Security notes

- No signup route exists. Accounts only come from `npm run seed`.
- Access tokens live in memory; the refresh token is an httpOnly, rotating cookie.
- Every content route requires auth — nothing is protected by URL obscurity alone.
- Locked stars, letters and confessions are filtered **server-side**; their
  content never reaches the browser until they unlock.
- Deletes are soft — nothing is ever actually thrown away.
# shreejeet
