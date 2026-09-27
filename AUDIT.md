# AUDIT.md

## What's real vs. what's a placeholder in this file

I (the AI assistant) could not run Lighthouse or WAVE myself — both require
a real browser, and this build environment has no installable Chrome and no
network access to Google's PageSpeed API. Everything below marked ✅ is
genuine, machine-verified evidence from this repo. Everything marked ⬜ is a
number **you** need to fill in after deploying, by actually running the
tools. Do not invent numbers to fill these in — an unfilled ⬜ with an honest
note is worth more than a fabricated 95.

## Automated accessibility evidence (✅ real, run in this repo)

`npm test` includes `src/accessibility.test.tsx`, which renders the app and
the flashcard results through `axe-core` (via `vitest-axe`) and asserts zero
violations. This is not the same as WAVE (axe-core can't evaluate real
rendered color contrast in jsdom the way a browser can), but it does
genuinely check: label associations, ARIA validity, landmark structure,
list semantics, and duplicate IDs — and both tests pass with **zero
violations** as of this commit. See `TEST-RESULTS.png` for the full run.

## Accessibility choices made, and why

| Choice | Why |
|---|---|
| Flashcards use native `<details>`/`<summary>`, not a custom "flip card" | Native disclosure widgets are keyboard-operable (Enter/Space) and screen-reader-announced with zero extra ARIA |
| Loading state is `role="status"` + `aria-live="polite"` | Screen reader users get told generation is happening without an interrupting alert |
| Errors are `role="alert"` | Announced immediately, unlike `status`, which is appropriate since it needs the user's attention |
| `:focus-visible` outlines defined on every interactive element, never `outline: none` | Keyboard users always see where focus is |
| `App` uses real `<header>`/`<main>`/`<footer>` landmarks | Screen reader users can jump between regions instead of reading linearly |
| Colors use `color-scheme: light dark` + `Canvas`/`CanvasText` system colors, plus explicit dark-mode overrides for secondary text/errors | Avoids a light-mode-only page with poor contrast in dark mode |

## Lighthouse (mobile) — ⬜ fill in after you deploy

Run: open the deployed URL in Chrome → DevTools (F12) → **Lighthouse** tab
→ check **Mobile** → check **Performance** + **Accessibility** → Analyze.

| Metric | Before (first deploy) | After (post-fixes) |
|---|---|---|
| Performance | ⬜ | ⬜ |
| Accessibility | ⬜ | ⬜ |
| LCP | ⬜ | ⬜ |
| CLS | ⬜ | ⬜ |
| INP | ⬜ | ⬜ |

Screenshot both runs and save them as `lighthouse-before.png` /
`lighthouse-after.png` in this repo.

**What I already did in the code to help these numbers, before you've even
measured:**
- No web fonts loaded (`system-ui` stack) → no font-swap layout shift, no
  render-blocking font request
- No client-side router, no unused UI framework — the whole bundle is this
  one small app
- No images on the page at all (nothing to size incorrectly or cause CLS)
- Single, small CSS file, no CSS-in-JS runtime cost

## WAVE — ⬜ fill in after you deploy

Run: go to [wave.webaim.org](https://wave.webaim.org), paste your deployed
URL.

| | Before | After |
|---|---|---|
| Errors | ⬜ | ⬜ |
| Contrast errors | ⬜ | ⬜ |
| Alerts | ⬜ | ⬜ |

If WAVE flags anything the axe-core test didn't catch (most likely: a real
contrast ratio issue, since jsdom can't check that), paste me the specific
flag and I'll fix the CSS and you re-run.

## Keyboard-only pass — do this yourself, it's fast

1. Load the deployed page. Don't touch the mouse.
2. Tab to the textarea, type notes, Tab to the button, Enter.
3. While it's loading, confirm you can still Tab away (nothing should trap
   focus).
4. Once flashcards appear, Tab to each `<summary>` and press Enter/Space —
   it should expand, and Tab should move to the next card afterward.
5. Confirm you never lose visible focus (a blue outline should always be
   visible on whatever's focused).

Record: ⬜ pass / ⬜ found an issue (describe it here if so).
