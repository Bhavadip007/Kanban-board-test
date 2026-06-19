# Kanban Board

Real-time collaborative task board — MERN stack with Socket.io.

## Setup

**Requirements:** Node 18+, MongoDB

```bash
# From project root (installs deps, copies .env, seeds DB)
npm run setup

# For seeds DB - Root
npm run seed 

# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

Or manually:

```bash
docker compose up -d   # optional replica set for transactions
cd backend && cp .env.example .env && npm install && npm run seed && npm run dev
cd frontend && cp .env.example .env && npm install && npm run dev
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:5050 |

**Demo accounts:**

| Role | Email | Password |
|------|-------|----------|
| Manager | `manager@kanban.app` | `password123` |
| User | `user@kanban.app` | `password123` |

Managers create boards, manage columns, and assign users. Assigned users see only their boards and can manage cards (including drag-and-drop). Real-time updates sync to all assigned members via Socket.io.

Postman: `backend/postman/collection.json` (run Login before Refresh; enable cookie jar)

---

## Spec Coverage

| Area | Status |
|------|--------|
| JWT auth (15m access / 7d refresh, rotation, httpOnly cookie) | Done |
| bcrypt password hashing (cost 12) | Done |
| Protected routes, 401 vs 403 | Done |
| Auth input sanitization, unique email | Done |
| @dnd-kit drag-and-drop, configurable columns | Done |
| Card fields: title, description, assignee, due date, priority | Done |
| Zustand state, Auth Context only | Done |
| Role-based access (manager vs user, board assignment) | Done |
| Optimistic UI + rollback (moves, card CRUD) | Done |
| Memoized card sorting (`useSortedCards`) | Done |
| Responsive layout (desktop + tablet) | Done |
| Socket.io board rooms, live card + column sync | Done |
| Events: card CRUD/move, column CRUD, user join/leave | Done |
| Reconnect, duplicate event dedup, out-of-order handling | Done |
| Server-authoritative conflict resolution | Done |
| REST API (all required endpoints) | Done |
| Joi validation, rate limiting, JSON request logging | Done |
| Global error handler (no stack traces in production) | Done |
| MongoDB schemas, indexes, transactions, soft delete | Done |
| Seed: manager + user, 2 boards, 3 columns each, 11 cards | Done |

---

## Architecture Notes

### Conflict resolution

**Server-authoritative.** Mutations go through REST. Socket events broadcast persisted state. Clients skip own events via `X-Event-Id`. Failed moves and card edits roll back to a snapshot. Concurrent edits: last successful write wins.

### Real-time edge cases

| Case | Handling |
|------|----------|
| Reconnect | Socket re-authenticates and re-joins board room |
| Duplicate events | `X-Event-Id` + client processed-event set |
| Out-of-order delivery | Cards keyed by `_id`, repositioned by server `position` |
| Multi-tab | `BroadcastChannel` syncs logout and token refresh across tabs |

### Memoization

`useSortedCards` memoizes column card sorting. During drag operations columns re-render frequently — this avoids redundant sorts when the cards array reference is unchanged.

---

## Database Indexes

| Collection | Index | Why |
|------------|-------|-----|
| User | `{ email: 1 }` unique, partial on `deletedAt: null` | Login lookup |
| Board | `{ owner: 1, deletedAt: 1 }` | List boards by owner |
| Board | `{ members: 1, deletedAt: 1 }` | List shared boards |
| Column | `{ board: 1, deletedAt: 1, position: 1 }` | Load columns in order |
| Card | `{ column: 1, deletedAt: 1, position: 1 }` | Render cards in order |
| Card | `{ board: 1, deletedAt: 1 }` | Board-level queries |

Soft delete via `deletedAt`. Transactions used for card moves, column deletes, and board creation.

---

## API

**Auth:** `POST /register` · `POST /login` · `POST /refresh` · `POST /logout` · `GET /me`

**Users:** `GET /users` (manager only — list assignable users)

**Boards:** `GET /boards` · `POST /boards` · `GET /boards/:id` · `PATCH /boards/:id` · `DELETE /boards/:id`

**Columns:** `POST /boards/:id/columns` · `PATCH /columns/:id` · `DELETE /columns/:id`

**Cards:** `POST /columns/:id/cards` · `PATCH /cards/:id` · `DELETE /cards/:id` · `POST /cards/:id/move`

---

## Socket Events

Auth: `socket.auth = { token: accessToken }`

| Event | Direction |
|-------|-----------|
| `user:join` / `user:leave` | Client ↔ Server |
| `card:create` / `card:update` / `card:delete` / `card:move` | Server → Client |
| `column:create` / `column:update` / `column:delete` | Server → Client |

Scoped to `board:<boardId>` rooms.

---

## Project Layout

```
backend/src/   config, controllers, middleware, models, routes, services, socket, validators
frontend/src/  components, context, hooks, pages, services, store, utils
```
