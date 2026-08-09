# 🐈 Our Little World — Build Plan & Agent Instructions

> This file is the single source of truth for building this project. Read it fully before any work session.
> If a decision here conflicts with an improvised idea, **this file wins** unless the user explicitly changes it.

---

## 0. What this is

A private, two-person relationship website. Not a portfolio site, not a SaaS dashboard, not a "romantic template."
It is a **small digital world** that two people (referred to as **Me** and **Her**) keep filling with memories, letters, stars, confessions and dates.

**The success test:** when she opens it, the reaction is
> "He didn't just make me a website. He made us a little world."

If a screen doesn't move toward that feeling, it's wrong — even if it works.

---

## 1. Stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **Vite + React 18 + TypeScript** | SPA, no Next.js |
| Routing | React Router v6 (data routers) | |
| Styling | **Tailwind CSS v3** + CSS custom properties for theming | Tailwind for layout/spacing; CSS vars for scene palettes |
| Animation | **Framer Motion** only | `useScroll` + `useSpring` covers the timeline scrub; GSAP was dropped as an unnecessary dependency |
| 3D / particles | **@react-three/fiber + drei** for Our Universe star field | Instanced points, not DOM nodes |
| State | **TanStack Query** for server state, Zustand for tiny UI state (identity, audio, nav) | No Redux |
| Forms | react-hook-form + zod | Zod schemas shared with backend |
| Backend | **Node 20+ / Express 4 / TypeScript** | REST, `/api/v1` |
| DB | **MongoDB + Mongoose** | Atlas in prod, local in dev |
| Auth | JWT (access in memory + refresh in httpOnly cookie) w/ bcrypt | Only 2 seeded users |
| Media | **Cloudinary** (primary) — local disk fallback in dev | Signed uploads, no public bucket listing |
| Validation | zod on every route | |
| Deploy | Frontend: Vercel/Netlify · Backend: Render/Railway · DB: Atlas | |

**Package manager:** npm. **Monorepo:** simple two-folder repo, no workspaces tooling needed.

```
her/
├─ CLAUDE.md
├─ README.md
├─ .gitignore
├─ client/          # Vite + React
└─ server/          # Express + Mongoose
```

---

## 2. Design system — the non-negotiable part

### 2.1 Rules

**Never do:**
- Rounded-2xl white cards on gray-50 backgrounds (the "AI website" look)
- Purple→pink 45° gradient buttons
- **Emoji. Anywhere.** Not in nav, not in labels, not in seed data. Emoji reads
  as vibe-coded. Everything is a hand-drawn SVG from `components/Icon.tsx`.
- Centered hero + 3 feature columns
- Generic shadows (`shadow-lg` everywhere)
- Bootstrap-ish navbars with a logo left and links right

### 2.1a Her motifs — use these, they are the point

She loves **tulips** and she is a **biotechnology** student (chemistry, lab work).
Both are woven into the visual language rather than mentioned:

| Motif | Where it lives |
|---|---|
| Tulip | The Reasons section icon and its bloom animation; the Our Story hero; loading flourishes. `components/motifs/Tulip.tsx` animates closed→open. |
| DNA double helix | The Our Story timeline spine. `components/motifs/HelixSpine.tsx` — two sine strands with base-pair rungs, revealed by scroll. |
| Benzene ring | The node marking each memory on the timeline. |
| Molecule / bond | Constellation links between related stars in Our Universe. |
| Flask, petri dish | Admin and empty-state flourishes. |

Keep it structural, not decorative-literal — a helix as the spine of the story is
right; a cartoon test tube saying "science!" is not.

**Always do:**
- Every section has its **own world**: own palette, own background behavior, own typography rhythm, own sound of motion
- Depth via **layered parallax + light**, not drop shadows
- Text sits *inside* the scene, not on top of a card
- Empty states are written as if the cat is talking, never "No data found"
- Motion has weight — things ease out slowly (`[0.16, 1, 0.3, 1]`), never linear

### 2.2 Palette tokens (CSS vars, swapped per section)

```css
:root {
  /* base ink & paper */
  --ink:        #1a1520;
  --paper:      #fdf6ec;
  /* accents */
  --blush:      #e8a0a8;
  --rose:       #c9566b;
  --gold:       #e6bb6a;
  --lilac:      #9b8bd4;
  --deep:       #14101f;
  --star:       #f4efe4;
  --mist:       rgba(255,255,255,0.06);
}
```

Section overrides:
| Section | Mood | Dominant |
|---|---|---|
| Our Story | warm → shifts per scene | `--paper` → scene-driven |
| Reasons | soft daylight, blush | `--blush` / `--paper` |
| Our Universe | deep night | `--deep` / `--star` |
| Open When | aged letter paper, candlelight | `--paper` / `--gold` |
| Confessions | dim, single spotlight | near-black / `--lilac` |
| Important Dates | dusk, brass numerals | `--deep` → `--gold` |

### 2.3 Typography

- Display / headings: **Fraunces** (variable, optical size) — warm, slightly quirky serif
- Body: **Instrument Sans** or **General Sans**
- Handwritten (letters, confessions, cat speech): **Caveat** — used sparingly, never for long paragraphs
- Numerals in countdowns: tabular figures, generous letter-spacing

Self-host fonts in `client/public/fonts` with `font-display: swap`. No Google Fonts CDN call at runtime.

### 2.4 Motion vocabulary (shared constants)

```ts
export const EASE = { soft:[0.16,1,0.3,1], swift:[0.4,0,0.2,1], bounce:[0.34,1.56,0.64,1] };
export const DUR  = { fast:0.25, base:0.5, slow:0.9, scene:1.4 };
```
Everything respects `prefers-reduced-motion`: swap transforms for opacity fades, freeze particles, disable scroll-scrub.

---

## 3. The cat mascot 🐈

One SVG character, componentized with named poses so it can be reused everywhere.

```
<Cat pose="walk" | "sit" | "peek" | "hold-heart" | "hold-envelope" | "float" | "sleep" | "point" mood="happy|shy|curious|sleepy" />
```

- Built as inline SVG with separate groups (`#body #head #tail #ears #eyes`) so Framer Motion can animate parts independently
- Idle loop always running: tail sway + blink at random 3–7s intervals
- Appears in: timeline (walking down), universe (floating in a tiny helmet), reasons (holds heart, reacts), open-when (delivers envelope), confessions (peeks from behind card), dates (sits on calendar)
- The cat is also the **loading state** and the **empty state** across the whole app

---

## 4. Sections — implementation detail

### 4.1 🏠 Our Story — cinematic scroll timeline

- Full-height scroll canvas. GSAP ScrollTrigger drives a normalized `progress 0→1`.
- A fixed background layer renders the **current scene** and cross-fades between scenes as progress crosses event thresholds.
- Scene types (admin picks one per event): `sunrise | blossom | sky | night | rain | snow | city | beach | glow | cozy`
  - each scene = gradient stack + particle system + light overlay; implemented as a registry `scenes/index.ts`
- The cat walks down a curved SVG path (`getPointAtLength`) tied to scroll progress, flipping direction at curve bends.
- Events alternate left/right on desktop, single column on mobile. Reveal: blur(8px)+y(40px)+opacity → clear, staggered children.
- Photo groups: 1 photo = framed polaroid; 2–3 = fanned stack, click to spread; 4+ = grid → lightbox.
- Video: lazy `<video>` with poster, plays on intersect (muted, loop) unless it has audio → click to play.
- `specialMessage` renders as handwriting that draws in with SVG stroke-dashoffset when present.

### 4.2 🌹 Reasons

- Gate screen: "Who are you?" → two large tactile choices (Her ❤️ / Me ❤️). Stored in Zustand + localStorage; changeable from a small corner control.
- Copy flips by identity: picking "Me" asks **"Why do you love her?"**, picking "Her" asks **"Why do you love him?"**
- Big pull-the-string button. On click: card flies in with a rotate+settle, cat holds up a heart, soft particle burst.
- No-repeat: keep a client-side ring buffer of last `min(10, floor(total/2))` ids; server endpoint `GET /reasons/random?exclude=id,id,...`
- Categories are colored ribbons on the card, not chips.
- "Written by her ❤️" in handwriting at the card's bottom edge.

### 4.3 🌌 Our Universe

- R3F canvas: ~1200 decorative stars as a single `<Points>` with an instanced shader (twinkle via time uniform + per-star phase attribute).
- Meaningful stars are separate meshes with a soft glow sprite, slightly larger, slow pulse.
- Camera: gentle drift + parallax on pointer/gyro. Pinch/scroll to zoom within clamped range.
- Click a meaningful star → camera eases toward it → modal blooms open from the star's screen position.
- Star types map to hue + sprite: memory ⭐, date 🌙, love 💫, moment ❤️, secret 🎁, photo 📸, funny 😂, letter 💌, place 🗺️, note 📝
- Visibility: `visible | hidden | unlock_at(date)`. Locked stars render dim & unclickable with a lock hint; server never sends the payload of a locked star — only its position/type.
- Secret stars: only appear after a discovery condition (e.g. dwelling in a region); they shimmer once then stay.
- Constellation lines optionally connect stars sharing a `groupKey`.
- Mobile: reduce to ~500 stars, disable gyro if not permitted, tap targets get an invisible 44px hit sphere.

### 4.4 💌 Open When…

- Envelopes laid out as a slightly messy stack/scatter (rotations ±4°), not a grid.
- Hover: wax seal glints, envelope lifts.
- Open sequence (the signature interaction, ~2.2s total):
  1. Seal cracks (SVG mask split) + tiny particle dust
  2. Flap rotates open in 3D (`rotateX`, `transform-style: preserve-3d`)
  3. Letter slides up out of the envelope
  4. Letter scales to a full reading view; background dims to candlelight; paper has subtle grain + fold creases
  5. Cat sits at the corner of the page
- Close: letter folds back down, reversed.
- Opened state persists per user (`openedBy: []`) — a first-open is special (extra shimmer), reopens are quicker.
- Unlock conditions: `always | after_date | count_limit` (e.g. one-time-only letters).

### 4.5 🫣 Confessions

- Deliberately different from Reasons: near-black room, one moving spotlight following the pointer.
- Confessions are folded paper notes. Blurred/illegible until clicked → unfolds and blur-to-focus resolves the text.
- Prompt line appears first in small caps, then the confession in handwriting, then attribution.
- Cat peeks from behind the note, ears only, and hides when the text is revealed.
- Ambient: very slow dust motes, faint vignette breathing.
- Optional "locked" confessions requiring a date or a tap-and-hold (3s) to reveal — hold builds a glow ring.

### 4.6 🗓️ Important Dates

- Two views: **Orbit** (default) and **List**.
  - Orbit: dates arranged on a slow-rotating ring around a central "days together" counter; nearest upcoming date glows.
  - List: vertical, grouped by year, with a "days since / days until" pill.
- Live countdown ticking to the second, tabular numerals, digits roll on change.
- Central widget: `N days together ❤️` computed from the date flagged `isAnchor`.
- Recurring dates (anniversary, birthdays) auto-roll to the next occurrence via `recurrence: none | yearly`.
- Milestone confetti when a countdown hits zero while the page is open.

---

## 5. Data model (Mongoose)

All documents share: `createdBy: 'me'|'her'|'both'`, `createdAt`, `updatedAt`, `isDeleted` (soft delete).

```ts
User          { _id, email, passwordHash, displayName, role:'me'|'her', avatarUrl, lastLoginAt }

Media         { _id, url, publicId, provider:'cloudinary'|'local', type:'image'|'video',
                width, height, blurhash, bytes, alt, uploadedBy }

StoryEvent    { _id, date, endDate?, title, description, location?,
                sceneType, photos:[MediaRef], video?:MediaRef, specialMessage?,
                order, createdBy }

Reason        { _id, text, category, createdBy, timesShown }

UniverseStar  { _id, type, title, message?, photos:[MediaRef], date?,
                position:{ x,y,z }, colorSeed, groupKey?,
                visibility:'visible'|'hidden'|'unlock_at', unlockAt?, isSecret,
                createdBy }

OpenWhenLetter{ _id, situation, body, photos:[MediaRef], audio?:MediaRef,
                unlockRule:'always'|'after_date'|'once', unlockAt?,
                openedBy:[{ role, at }], sealColor, createdBy }

Confession    { _id, prompt, text, photo?:MediaRef, date?,
                lockRule:'none'|'after_date'|'hold', unlockAt?,
                revealedBy:[{ role, at }], createdBy }

ImportantDate { _id, title, date, description?, location?, message?,
                photo?:MediaRef, recurrence:'none'|'yearly',
                isAnchor, emoji, createdBy }

AppSetting    { key, value }   // anchor date, site title, ambient audio toggle, etc.
```

Indexes: `StoryEvent.date`, `UniverseStar.visibility`, `ImportantDate.date`, text index on `Reason.text`.

---

## 6. API surface (`/api/v1`)

```
POST   /auth/login              { email, password } → { user, accessToken } + refresh cookie
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

GET    /story                   public-to-authed, sorted by date
POST   /story                   admin
PATCH  /story/:id               admin
DELETE /story/:id               admin

GET    /reasons/random?exclude=
GET    /reasons                 admin list (paginated)
POST|PATCH|DELETE /reasons

GET    /stars                   returns locked stars WITHOUT payload
GET    /stars/:id               403 if locked
POST|PATCH|DELETE /stars

GET    /letters                 list w/ locked flags, body omitted if locked
POST   /letters/:id/open        marks opened, returns body
POST|PATCH|DELETE /letters

GET    /confessions
POST   /confessions/:id/reveal
POST|PATCH|DELETE /confessions

GET    /dates
POST|PATCH|DELETE /dates

POST   /media/sign              → Cloudinary signed params
POST   /media                   register uploaded asset
DELETE /media/:id

GET    /admin/stats             counts for the dashboard
GET    /settings  PATCH /settings
```

Every mutation requires a valid access token. **Authorization is enforced server-side on every route** — never by hiding UI.

---

## 7. Security requirements

- Only two users; created by a seed script reading `SEED_*` env vars. No public signup route, ever.
- bcrypt cost 12. Access token 15m, refresh token 7d rotating, refresh stored hashed.
- Cookies: `httpOnly`, `sameSite:'lax'` (or `'none'; secure` cross-origin), `secure` in prod.
- helmet, CORS allowlist from env, rate limit on `/auth/*` (5/min) and mutations (60/min).
- zod validation on body/params/query for every route; strip unknown keys.
- Uploads: signed Cloudinary uploads only; validate mime + size (img ≤10MB, video ≤100MB) server-side on registration.
- Media delivered via Cloudinary with unguessable public IDs; private-mode delivery URLs for anything marked hidden.
- Never log tokens or bodies containing them. Secrets only in `.env` (git-ignored); commit `.env.example`.
- Locked content payloads are filtered **in the query/serializer**, not in React.

---

## 8. Build order (phases)

Each phase ends with: it runs, it's responsive, it's committed.

**Phase 1 — Foundation**
Repo scaffold, TS configs, Tailwind + tokens, fonts, Express skeleton, Mongo connection, User model + seed, auth flow end-to-end, protected route wrapper, app shell + navigation, Cat component with poses, motion constants, media upload pipeline.

**Phase 2 — Admin CMS**
Login page, dashboard with live counts, generic resource table + form system (driven by zod schemas so each entity is ~50 lines), media picker/uploader with drag-drop and preview, CRUD for all six entities. Admin styled as a warm "control room," not a SaaS panel — but clarity beats theme here.

**Phase 3 — Our Story** — scene registry, scroll engine, cat path, event reveals, galleries, lightbox.

**Phase 4 — Reasons** — identity gate, generator, no-repeat, card animation, cat reaction.

**Phase 5 — Our Universe** — R3F field, shader twinkle, meaningful stars, camera focus, modal, locking, secrets.

**Phase 6 — Open When** — envelope stack, the open sequence, letter reading view, unlock rules, persistence.

**Phase 7 — Confessions** — spotlight room, fold/unfold, blur-to-focus, hold-to-reveal, peeking cat.

**Phase 8 — Important Dates** — orbit + list views, live countdowns, anchor counter, recurrence, confetti.

**Phase 9 — Polish**
Page transitions, route-level code splitting, image blurhash placeholders + responsive srcset, skeletons, empty/error states in the cat's voice, a11y pass (focus rings, keyboard nav for stars/letters, aria-live for countdowns, alt text), Lighthouse ≥90 mobile, reduced-motion audit, 60fps check on a mid-range phone, optional ambient audio toggle (default off), favicon + OG image + install-able PWA manifest.

---

## 9. Working agreements for the agent (auto mode)

1. **Work phase by phase.** Don't scaffold half of Phase 5 while Phase 2 is unfinished.
2. **After each phase**, print a short summary: what's built, how to run it, what's next. Then continue.
3. **Commit** at the end of each phase with a clear message (`git init` on first run; branch `main` is fine here since it's a solo private project).
4. **Never invent content.** All copy about the relationship comes from the DB. Seed data uses obvious placeholders (`"Placeholder — replace in admin"`), never fabricated memories or dates presented as real.
5. **Ask the user only for:** MongoDB URI, Cloudinary credentials, the two accounts' emails/passwords/names, and the anchor date. Everything else: decide and move on.
6. Until credentials exist, use a **local Mongo / in-memory fallback and local disk uploads** so development never blocks.
7. **Verify before claiming done:** run the dev servers, hit the endpoints, check the page renders. Report failures with the actual output.
8. Keep components under ~200 lines; extract scenes, animations, and hooks.
9. TypeScript strict. No `any` without a comment explaining why.
10. Mobile is checked **during** each phase, not in Phase 9.

---

## 10. Environment variables

`server/.env`
```
PORT=4000
NODE_ENV=development
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLIENT_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SEED_ME_EMAIL=      SEED_ME_PASSWORD=      SEED_ME_NAME=
SEED_HER_EMAIL=     SEED_HER_PASSWORD=     SEED_HER_NAME=
ANCHOR_DATE=
```

`client/.env`
```
VITE_API_URL=http://localhost:4000/api/v1
```

---

## 11. Scope lock

Six user sections + admin. **Do not add a seventh navbar section.** Depth over breadth: a better envelope animation beats a new page.

Ideas that come up mid-build go into `IDEAS.md`, not into the app.
