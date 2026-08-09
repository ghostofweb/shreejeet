# 🐈 Our Little World

A private, two-person relationship website. See [CLAUDE.md](./CLAUDE.md) for the full plan.

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
