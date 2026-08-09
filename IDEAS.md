# Ideas parking lot

Scope is locked to the six sections + admin (CLAUDE.md §11). Nothing moves from
here into the app without a deliberate decision.

## Known gaps — worth doing next

- **Self-hosted fonts.** Fraunces / Instrument Sans / Caveat still load from
  Google Fonts, so the site makes one third-party request on first paint.
  Download the woff2 files into `client/public/fonts` and swap the `<link>` for
  `@font-face` rules with `font-display: swap`.
- **Media alt text.** Uploads store an `alt` field but nothing asks for it. The
  picker should prompt, and the timeline/star/letter galleries should use it.
- **Blurhash / dominant-colour placeholders.** `Media` has width and height but
  no placeholder, so photos pop in. Generate one on upload.
- **Lighthouse pass.** Never run — no headless Chrome in this environment.
- **Refresh-token cap.** Five per account; signing in on a sixth device silently
  signs out the oldest. Fine for two people, worth raising if it bites.

## Verified by hand rather than by me

These work as far as I could observe, but the automation harness could not
drive them — screenshot latency and background-tab animation throttling get in
the way. Worth a minute each:

- Clicking a star directly on the Universe canvas (hover hit-testing is proven;
  the click path was only exercised through the star index).
- The four beats of the envelope opening in Open When — the state machine was
  observed stepping through in order, but the frames were never captured.
- The hold-to-reveal ring in Confessions. The gating is proven: a plain click
  correctly refuses to open a hold-note.

## Later, maybe

- Ambient audio toggle, default off
- Export the whole world as a printable book
- Per-person read receipts shown in the UI ("she opened this on…")
- Search across everything
