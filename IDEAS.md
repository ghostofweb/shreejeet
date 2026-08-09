# Ideas parking lot

Things that came up mid-build but are **out of scope** for now. Scope is locked
to the six sections + admin (see CLAUDE.md §11). Nothing moves from here into the
app without a deliberate decision.

## Deferred from Phase 1–2

- **Self-hosted fonts.** Fraunces / Instrument Sans / Caveat currently load from
  Google Fonts. Phase 9 should download the woff2 files into `client/public/fonts`
  so the site makes no third-party request at runtime.
- **Mobile visual verification.** The responsive classes and mobile nav are built,
  but the layouts have not been eyeballed on a real narrow viewport yet. Do this
  properly during each remaining phase, not only in Phase 9.
- **Login field-level errors.** A zod failure on login currently shows the generic
  "Some fields need fixing". Worth surfacing which field.
- **Media alt text.** The upload flow stores `alt` but the picker doesn't ask for it.
  Needed for the accessibility pass.
- **Blurhash placeholders.** `Media.blurhash` is in the plan but not yet generated
  on upload.

## Later, maybe

- Ambient audio toggle (default off)
- PWA manifest / installable
- Export the whole world as a printable book
- Per-person read receipts on letters ("she opened this on…")
