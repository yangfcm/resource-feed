# Feedly Clone — AI News Digest

## Context
Build a minimal Feedly-like RSS reader from scratch. The user wants the most important features first: auth, RSS source following, a two-column layout (sidebar + item list), and a detail page. Tech stack: Next.js (App Router), MongoDB/Mongoose, Tailwind CSS, with dark/light mode support.

---

## Tech Decisions

- **Auth:** NextAuth.js v5 (`next-auth@beta`) with Credentials provider. Future SSO = just add a provider to the array, no architecture change.
- **Database:** MongoDB Atlas (or local). Mongoose singleton to avoid connection exhaustion in dev hot-reloads.
- **RSS parsing:** `rss-parser` npm package, runs in Node.js runtime (not Edge).
- **Styling:** Tailwind v4 + `@tailwindcss/typography` for article content. `next-themes` for dark/light mode.
- **Forms:** `react-hook-form` + `zod` for validation.
- **Toasts:** `sonner`.

---

## File Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx                        # Root: ThemeProvider + Toaster
│   ├── (auth)/                           # Centered layout, no sidebar
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                            # Auth-guarded, two-column layout
│   │   ├── layout.tsx                    # Auth check + sidebar + main slot
│   │   ├── page.tsx                      # Redirect to /feeds
│   │   ├── feeds/
│   │   │   ├── page.tsx                  # Empty state
│   │   │   └── [feedId]/page.tsx         # Item list for selected feed
│   │   └── items/[itemId]/page.tsx       # Article detail (Server Component)
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/route.ts    # NextAuth handler
│       │   └── register/route.ts        # POST: create user
│       ├── feeds/
│       │   ├── route.ts                 # GET: list, POST: follow feed
│       │   └── [feedId]/
│       │       ├── route.ts             # GET: meta, DELETE: unfollow
│       │       ├── items/route.ts       # GET: items paginated
│       │       └── refresh/route.ts    # POST: re-fetch RSS
│       └── items/[itemId]/route.ts      # GET: single item
├── components/
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── features/
│   ├── auth/components/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   └── feeds/components/
│       ├── feed-sidebar.tsx             # Client: list followed feeds
│       ├── feed-sidebar-item.tsx        # Favicon + name + active state
│       ├── add-feed-dialog.tsx          # Modal: add RSS URL
│       ├── feed-items-list.tsx          # Client: items for selected feed
│       ├── feed-item-card.tsx           # Thumbnail + title + desc + time
│       └── empty-feed-state.tsx
├── lib/
│   ├── auth.ts                          # NextAuth config
│   ├── db.ts                            # Mongoose singleton
│   ├── rss.ts                           # rss-parser wrapper
│   └── utils.ts                         # cn(), date helpers
├── models/
│   ├── User.ts
│   ├── Feed.ts
│   └── FeedItem.ts
└── middleware.ts                        # Protect all non-auth routes
```

---

## Mongoose Schemas

**User**
```ts
{ email: String (unique), hashedPassword: String, followedFeeds: [ObjectId ref Feed], createdAt: Date }
```
Future SSO: add optional `oauthProviders` array without breaking existing users.

**Feed** (shared across users — one doc per unique RSS URL)
```ts
{ rssUrl: String (unique), title, description, siteUrl, favicon, lastFetchedAt, createdAt }
```
Favicon resolved via `https://www.google.com/s2/favicons?domain=X&sz=32`.

**FeedItem**
```ts
{ feedId: ObjectId, title, description, content, thumbnail, link, guid, publishedAt, createdAt }
Compound unique index: (feedId, guid) — enables upsert-based deduplication on refresh
Index: (feedId, publishedAt: -1) — primary query pattern
```

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create user, hash password (bcryptjs, 12 rounds) |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth session/signIn/signOut |
| GET | `/api/feeds` | List user's followed feeds |
| POST | `/api/feeds` | Follow feed: parse RSS, upsert Feed + FeedItems, add to user |
| GET | `/api/feeds/[feedId]` | Feed metadata |
| DELETE | `/api/feeds/[feedId]` | Unfollow (removes from user, Feed doc stays shared) |
| GET | `/api/feeds/[feedId]/items` | Paginated items, sorted publishedAt desc |
| POST | `/api/feeds/[feedId]/refresh` | Re-fetch RSS, upsert new items via bulkWrite |
| GET | `/api/items/[itemId]` | Single item for detail page |

All `/api/feeds` and `/api/items` routes: check session via `auth()`, return 401 if missing.

---

## Key Implementation Details

**Auth guard** — `src/middleware.ts` redirects unauthenticated users to `/login` for all routes except `/login`, `/signup`, `/api/auth/*`.

**`POST /api/feeds` flow:**
1. Validate `rssUrl` with Zod
2. Check user doesn't already follow it
3. `Feed.findOne({ rssUrl })` — reuse existing or create new
4. If new: `fetchAndParseFeed(url)` → create Feed doc + bulk insert FeedItems
5. `User.findByIdAndUpdate(..., { $addToSet: { followedFeeds: feedId } })`

**RSS refresh:** Use `bulkWrite` with `updateOne({ filter: {feedId, guid}, update: {$setOnInsert: {...}}, upsert: true })` to insert only new items without duplicates.

**Item detail page** (`/items/[itemId]/page.tsx`): Server Component that queries DB directly (no API round-trip). Renders content with `dangerouslySetInnerHTML` inside `<div className="prose dark:prose-invert max-w-none">`.

**Dark mode:** `next-themes` ThemeProvider with `attribute="class"`. CSS variables for colors in `globals.css` for both `:root` and `.dark`.

**Two-column layout:**
```tsx
<div className="flex h-screen overflow-hidden">
  <FeedSidebar className="w-64 shrink-0 border-r overflow-y-auto" />
  <main className="flex-1 overflow-y-auto">{children}</main>
</div>
```

---

## Build Order

1. `npx create-next-app@latest` with TypeScript, Tailwind, App Router, src/
2. Install dependencies
3. `.env.local`: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
4. `src/lib/db.ts` — Mongoose singleton
5. `src/models/` — User, Feed, FeedItem schemas
6. `src/lib/auth.ts` + `/api/auth/[...nextauth]/route.ts` + `/api/auth/register/route.ts`
7. `src/middleware.ts` — route protection
8. Auth UI: login + signup pages with react-hook-form/zod
9. All `/api/feeds` and `/api/items` routes
10. `src/lib/rss.ts` — rss-parser wrapper
11. `FeedSidebar` + `AddFeedDialog` + sidebar items
12. `FeedItemsList` + `FeedItemCard`
13. `ItemDetail` page
14. `ThemeProvider` + `ThemeToggle` + dark mode CSS variables
15. Loading skeletons, empty states, polish

---

## Dependencies

```json
{
  "dependencies": {
    "next": "15.x", "react": "19.x", "react-dom": "19.x",
    "next-auth": "beta",
    "mongoose": "^8",
    "bcryptjs": "^2",
    "rss-parser": "^3",
    "next-themes": "^0.4",
    "lucide-react": "latest",
    "clsx": "^2", "tailwind-merge": "^3", "class-variance-authority": "^0.7",
    "zod": "^3", "react-hook-form": "^7", "@hookform/resolvers": "^3",
    "sonner": "^2"
  },
  "devDependencies": {
    "typescript": "^5", "tailwindcss": "^4", "@tailwindcss/postcss": "^4",
    "@tailwindcss/typography": "^0.5",
    "@types/node": "^20", "@types/react": "^19", "@types/bcryptjs": "^2"
  }
}
```

---

## Verification

1. `npm run dev` — app starts without errors
2. Sign up with an email → redirected to app, session persists on refresh
3. Add an RSS URL (e.g. `https://feeds.arstechnica.com/arstechnica/index`) → feed appears in sidebar
4. Click feed → items list loads with thumbnails/titles/timestamps
5. Click item → detail page shows content + original link
6. Refresh feed → new items appear
7. Toggle dark/light mode → all components switch correctly
8. Unfollow a feed → removed from sidebar
9. Log out → redirected to login, protected routes inaccessible
