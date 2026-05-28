# DECISIONS.md

Technical decisions, assumptions, trade-offs, and unfinished items for the ForeverMissed Memorial Rich Text Editor feature.

---

## 1. Rich Text Editor Library: Tiptap v2

### Options Considered

| Library | Pros | Cons |
|---|---|---|
| **Tiptap v2** | Headless, Vue 3 native, TypeScript, composable extensions, ProseMirror-based, active maintenance | More complex setup than drag-and-drop editors |
| **Quill.js** | Mature, well-known | Older API, poor TypeScript support, Vue 3 integration is unofficial, mobile toolbar UX is weaker |
| **CKEditor 5** | Feature-rich, professional | GPL license requires open-sourcing your product (commercial license expensive), heavy bundle |
| **Editor.js** | Clean block-based output | Block paradigm doesn't match the inline paragraph editing expected here; markdown-like output, not HTML |
| **ProseMirror** (raw) | Maximum flexibility | Far too low-level — would need to implement toolbar, marks, and rendering from scratch |
| **Milkdown** | Plugin-based, elegant | Markdown-first, limited production adoption with Vue 3 |

### Why Tiptap

1. **Headless by design** — zero opinion on styling. Perfect for BEM/SASS with CSS custom properties.
2. **Vue 3 native** — `useEditor` composable, `<EditorContent>` component; integrates idiomatically.
3. **TypeScript throughout** — full typings, `Commands` augmentation pattern works cleanly.
4. **ProseMirror foundation** — battle-tested document model (used by Atlassian, GitLab), reliable mobile touch behavior.
5. **Free extensions cover all requirements** — StarterKit (Bold, Italic, Blockquote, Undo/Redo), TextAlign, TextStyle, Underline.

### Trade-offs Accepted

- **No official `FontSize` extension** in the free tier. I implemented a custom extension via `TextStyle` (a mark that sets `style="font-size: Xpx"` on a `<span>`). This is a community-established pattern. See `frontend/src/extensions/FontSize.ts`.
- **Bundle size**: ~480 kB uncompressed, ~160 kB gzipped. Acceptable for a core editing feature but worth code-splitting if this becomes one of many pages.

### Problems Anticipated

- Pasting from Word/Google Docs can bring in dirty HTML. Tiptap has a `transformPastedHTML` hook for sanitization.
- Screen readers: ProseMirror's `contenteditable` has known ARIA quirks. Would need audit for accessibility compliance.
- Mobile soft-keyboard shifts the viewport. The toolbar can scroll behind the keyboard; mitigated here by the full-screen dialog on mobile which gives the editor more room.

---

## 2. Draft Autosave Strategy

### Decision: 2-second debounce, localStorage-first + backend fallback

**Why debounce instead of per-keystroke:**
Saves on every keystroke would fire 50–100 API calls per minute during active editing. Debouncing 2 seconds balances responsiveness (user rarely notices a 2-second window of data loss) against server load.

**Why localStorage-first:**
- Immediate, zero-latency — works even if the network is down
- On page refresh, localStorage is checked first; backend draft is the fallback if localStorage is empty (e.g., different browser/incognito)
- Key: `memorial_draft_{id}`

**Why backend draft at all:**
- Cross-device persistence
- Survives cache/storage clearing
- Backend is the source of truth; localStorage is a cache

**Draft lifecycle:**
```
Edit → debounce(2s) → localStorage.setItem + POST /api/memorials/{id}/draft (silent fail)
Save → PATCH about → localStorage.removeItem + DELETE draft (best-effort)
Cancel → draft is PRESERVED (per spec — user might want to resume later)
F5 refresh → checks localStorage → shows banner if draft found
```

**What Cancel does NOT do:**
Cancel exits edit mode without clearing the draft. This is intentional — the user might want to resume the draft. If the user explicitly wants to discard the draft, they can Save the original content. This could be improved with a "Discard draft" button (noted as future improvement).

---

## 3. Edit Button — No Layout Shift

The edit button uses `position: absolute` on the content wrapper and `opacity: 0 + pointer-events: none` in the default state. It becomes visible via CSS on `:hover` (desktop) or always visible via `@media (hover: none)` (touch devices). No JS involved, so there is zero layout shift.

---

## 4. Mobile vs Desktop: `matchMedia` in JS, not CSS-only

The component that renders differs at `<768px` (inline `<AboutEditor>` vs `<MobileEditorDialog>`). This requires JS-level conditional rendering (`v-if`/`v-else`) to mount the right component, not just CSS hiding. Using `window.matchMedia` with an event listener ensures accuracy and reactivity without SSR complications (this is a client-side SPA).

---

## 5. API Design

```
GET    /api/memorials/{memorial}          — fetch memorial (id, name, aboutHtml)
PATCH  /api/memorials/{memorial}/about   — save about text, clears draft, returns updated memorial
GET    /api/memorials/{memorial}/draft   — fetch draft or 404
POST   /api/memorials/{memorial}/draft   — upsert draft (unique index on memorial_id)
DELETE /api/memorials/{memorial}/draft   — delete draft
```

**Route model binding** — Laravel resolves `{memorial}` to a `Memorial` model automatically, returns 404 if not found.

**`JsonResource::withoutWrapping()`** — disabled the default `{"data": {...}}` wrapping in `AppServiceProvider::boot()`. For a real public API this would be wrong (envelope is useful for pagination metadata), but for a simple SPA consuming a known API, flat responses are easier to type and consume.

**`updateOrCreate` for drafts** — The `memorial_drafts` table has a `UNIQUE` constraint on `memorial_id`. This ensures `updateOrCreate(['memorial_id' => $id], ['content_html' => ...])` behaves as a true upsert without creating duplicate draft rows.

---

## 6. State Management (Pinia)

Composition API store (`defineStore` with `() => {...}` setup function) was chosen over Options API style because:
- Closer to how TypeScript types integrate (`ref<T>`, `computed<T>`)
- Easier to share and compose logic
- Feels native alongside `<script setup>` in components

The store holds both `savedContent` (from API) and `draftContent` (from draft). A `currentContent` computed returns the draft if `hasDraft`, else saved. This is the single source of truth for what the editor and static view display.

---

## 7. BEM / SASS

Using BEM with underscore modifier syntax (`block__element_modifier`) and SASS `@use`/`@forward` (not deprecated `@import`).

CSS custom properties (via SASS variables) are defined in `_variables.scss`. Each partial `@use './variables' as *` explicitly — Sass deduplicates `@use` of the same canonical URL, so no redundant loads occur.

Note: `additionalData` in `vite.config.ts` was initially used to auto-inject variables but was removed because it only applies to root SCSS files (files passed directly to Vite's preprocessor), not to `@use`-loaded partials, which Sass processes directly.

---

## 8. HTML Sanitization (Skipped)

The `about_html` field is stored and rendered via `v-html` without sanitization. In production, the backend should sanitize HTML through a library like [ezyang/htmlpurifier](https://github.com/ezyang/htmlpurifier) (`mews/purifier` Laravel package) before persisting. Without this, a malicious user could store XSS payloads. Noted as a production TODO in the controller.

---

## 9. No Authentication

All API routes are open (no `auth:sanctum` middleware). In production, routes would be protected and the controller would check ownership: `$memorial->user_id === auth()->id()`. For the demo, this is out of scope.

---

## 10. What Was Skipped / Future Work

| Item | Status | Notes |
|---|---|---|
| Pixel-perfect Figma toolbar styling | Skipped (Figma file wasn't accessible via API) | Toolbar direction matches spec requirements |
| Automated tests | Skipped | Would add: Vitest + Vue Testing Library for components, PHPUnit for API endpoints |
| Full auth middleware | Skipped | Out of scope for demo |
| Per-user draft ownership | Skipped | Production: `user_id` on `memorial_drafts` table |
| HTML sanitization (HTMLPurifier) | Skipped | Noted as TODO in controller |
| "Discard draft" explicit action | Skipped | Currently Cancel preserves draft; could add a UI affordance to discard it |
| Draft banner "dismiss" | Skipped | Banner persists; could be dismissible |
| Undo/Redo keyboard shortcuts visible in toolbar | Skipped | StarterKit includes History extension so Ctrl+Z/Ctrl+Y work natively |
| Image uploads in editor | Out of scope | Tiptap Image extension + backend file upload endpoint |
| Offline support / service worker | Out of scope | localStorage draft provides basic offline resilience |
| Content versioning | Out of scope | Would need a `memorial_content_history` table |

---

## 11. Architecture Notes

- **Monorepo layout**: `frontend/` (Vite + Vue 3 SPA) and `backend/` (Laravel 11 API) are peers. Each has its own `package.json` / `composer.json` and runs independently. Vite proxies `/api/*` to `localhost:8000` in dev.
- **TypeScript**: All frontend files are `.ts`/`.vue` with `<script setup lang="ts">`. No `any` types used; API responses are typed via interfaces.
- **Component architecture**: `AboutSection` orchestrates; `AboutEditor` owns the Tiptap instance; `EditorToolbar` is purely presentational (receives `editor` as a prop); `MobileEditorDialog` wraps `AboutEditor` in a `<Teleport>`-based fullscreen overlay.
