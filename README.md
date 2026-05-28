# ForeverMissed — Memorial About Section Rich Text Editor

A technical assignment implementation: Vue 3 + Laravel 11 full-stack feature.

## Prerequisites

- **Node.js** 18+ (`node --version`)
- **PHP** 8.2+ (`php --version`) — install via `brew install php` if missing
- **Composer** (`composer --version`) — install via `brew install composer` if missing

## Running the App

### 1. Start the backend (Laravel API)

```bash
cd backend
composer install          # first time only
php artisan migrate:fresh --seed  # first time only (creates SQLite DB + seeds data)
php artisan serve         # runs on http://localhost:8000
```

### 2. Start the frontend (Vue 3 + Vite)

```bash
cd frontend
npm install               # first time only
npm run dev               # runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
editor/
├── frontend/                      # Vue 3 + Vite SPA
│   └── src/
│       ├── components/memorial/
│       │   ├── AboutSection.vue   # Main orchestrator
│       │   ├── AboutEditor.vue    # Tiptap editor wrapper
│       │   ├── EditorToolbar.vue  # Toolbar (alignment, size, blockquote, bold/italic/underline)
│       │   └── MobileEditorDialog.vue  # Full-screen dialog for mobile
│       ├── extensions/
│       │   └── FontSize.ts        # Custom Tiptap FontSize extension
│       ├── stores/
│       │   └── aboutStore.ts      # Pinia store (content, draft, editing state)
│       ├── services/
│       │   └── api.ts             # Axios API client
│       ├── types/
│       │   └── memorial.ts        # TypeScript interfaces
│       └── assets/styles/         # SASS (BEM, CSS custom properties)
│
├── backend/                       # Laravel 11 API
│   ├── app/Http/Controllers/Api/
│   │   └── MemorialController.php
│   ├── app/Models/
│   │   ├── Memorial.php
│   │   └── MemorialDraft.php
│   └── routes/api.php
│
└── DECISIONS.md                   # Technical decisions documentation
```

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/memorials/{id}` | Fetch memorial |
| `PATCH` | `/api/memorials/{id}/about` | Save about text (clears draft) |
| `GET` | `/api/memorials/{id}/draft` | Fetch draft (404 if none) |
| `POST` | `/api/memorials/{id}/draft` | Save/update draft |
| `DELETE` | `/api/memorials/{id}/draft` | Delete draft |

## Features

- **Inline rich text editing** — click Edit to switch the text block into a Tiptap editor
- **Toolbar** — text alignment (L/C/J), font size, blockquote, bold, italic, underline
- **Edit button without layout shift** — `position: absolute` with CSS opacity transition
- **Draft autosave** — debounced 2s after typing, saved to localStorage + backend API
- **Draft recovery on refresh** — banner shown with "Unsaved draft" indicator
- **Save/Cancel flow** — Save persists to API and clears draft; Cancel preserves draft
- **Mobile full-screen dialog** — at `<768px`, editor opens in a `<Teleport>`-based overlay
- **TypeScript throughout** — typed store state, API responses, component props
- **BEM + SASS** — `block__element_modifier` convention, CSS custom properties for theming
