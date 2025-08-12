# Pokédex App

A simple Pokémon browser built with **Next.js**, **Tailwind CSS**, and **PokéAPI**.  
Includes search, filtering by type, sorting, favorites with optimistic UI updates, and a light/dark mode toggle that persists across sessions.

---

## 🚀 Run Instructions

1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/pokedex-app.git
cd pokedex-app
2️⃣ Install Dependencies
bash
Copy
Edit
npm install
# or
yarn install
3️⃣ Run Development Server
bash
Copy
Edit
npm run dev
# or
yarn dev
Visit http://localhost:3000 in your browser.

4️⃣ Build for Production
bash
Copy
Edit
npm run build
npm run start
🏗 Architecture Notes
Framework

Next.js 14 App Router for routing and SSR/SSG capabilities.

React 18 with functional components and hooks.

Styling

Tailwind CSS with dark mode support via class strategy (dark: variants).

Global styles are in globals.css.

State Management

React useState/useEffect for local UI state.

LocalStorage for favorites and theme persistence.

Optimistic UI updates for favorite toggles — UI updates instantly before API confirmation.

Networking

Uses native fetch API to call PokéAPI.

Abort controllers prevent race conditions when switching filters quickly.

Filters by type fetch an additional endpoint /type/{type}.

Features Implemented

Search Pokémon by name.

Filter by type.

Sort A→Z or Z→A.

Pagination (36 Pokémon per page when not searching).

Favorites with optimistic updates and rollback on failure.

Dark/Light Mode toggle with persistence and cross-tab sync.

Skeleton loading states for better UX during fetches.

Error handling with retry button.
