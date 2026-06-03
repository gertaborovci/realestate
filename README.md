# KosovaNest — Real Estate Platform

A full-stack real estate web application built for Kosovo's property market.  
Academic project — Lab Course 1, 2025/2026.

---

## Overview

KosovaNest is a premium real estate platform that connects buyers, renters, agents and administrators. It covers the full property lifecycle from listing to contract, with a rich feature set including interactive maps, neighbourhood profiles, rental calendars, property reviews, agent Q&A, search alerts with notifications, and a comprehensive admin analytics dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Tailwind CSS |
| Maps | React-Leaflet + OpenStreetMap / Nominatim |
| Backend | Node.js + Express.js |
| Database | MySQL (MariaDB) via `mysql2` |
| File uploads | Multer |
| Auth | JWT access token (15 min) + httpOnly cookie refresh token (30 days), role-based (admin / agent / user) |
| Charts | Custom SVG (no external chart library) |

---

## Features by Role

### Public (not logged in)
- Browse properties with fuzzy search, home-type filters, price slider, BUY/RENT toggle
- Property detail page with gallery, features, agent card, location map, neighbourhood scores, Q&A accordion, reviews
- Browse agents with city / min-rating / certification-trust filters
- Browse neighbourhood profiles with score bars and property scroll panels
- "Start Your Next Chapter" wizard on the hero page

### User (logged in)
- All public features plus: Schedule visits, initiate purchases, rent properties (with check-in/check-out calendar)
- User Dashboard: Profile, Favourites, My Requests (visits + rentals), Contracts, Stories (with photos), Ratings, Alerts, Support
- Leave and edit property reviews (one per property, with Verified badge if visit/contract confirmed)
- Search Alerts — get notified when a matching property is listed

### Agent
- Agent Dashboard: Profile, Properties, Contracts, Payments, Visits, Certifications, Contact Inquiries, Rental Requests, Property Q&A
- Add / edit properties with Nominatim address autocomplete (Kosovo-only), lat/lng, home type, neighbourhood assignment
- Manage rental requests: calendar showing blocked dates, approve/reject, performance stats per property
- Customise Property Q&A: global template applies to all listings, per-property overrides, exclusion list
- Sign rental/purchase contracts; property status auto-updates to Sold/Rented on finalisation

### Admin
- Full Admin Dashboard with analytics: KPI cards, monthly Revenue vs Expenses SVG bar chart, property status donut chart, contract pipeline
- Properties: expandable Detail / Reviews / Q&A panel per row; search, type filter, agent name
- Agents, Users, Visits, Maintenance, Certifications, Neighbourhoods (with Leaflet map), Expenses (with chart), Notifications (broadcast), Support Tickets
- Moderate property reviews, edit/delete agent Q&A

---

## Full CRUD List (22)

Properties, Property Images, Property Features, Users, Agents, Certifications, Clients, Contracts, Transactions, Expenses, Maintenance Requests, Neighbourhoods, Offices, Contact Inquiries, Notifications, Visits, Agent Ratings, Search Alerts, Testimonials, Support Tickets, Property Reviews, Property Q&A

---

## Project Structure

```
realestate/
├── backend/
│   ├── controllers/        # Business logic (22 controllers)
│   ├── routes/             # Express routers
│   ├── middleware/         # Auth, error handling, uploads
│   ├── config/upload.js    # Multer config
│   ├── utils/notify.js     # createNotification helper
│   └── server.js           # Entry point, DB connection, auto-migrations
│
├── public/
│   └── photos/             # Static city / property hero images
│
└── src/
    ├── components/         # Reusable UI components
    │   ├── PropertyReviews.jsx
    │   ├── PropertyQA.jsx
    │   ├── AgentQAManager.jsx
    │   ├── RentalCalendar.jsx
    │   ├── PropertyMap.jsx
    │   ├── LocationAutocomplete.jsx
    │   ├── NeighborhoodAutocomplete.jsx
    │   ├── NotificationBell.jsx
    │   ├── NextChapterModal.jsx
    │   └── ...
    ├── pages/              # Route-level pages (lazy-loaded)
    │   ├── RealEstateHero.jsx
    │   ├── PublicProperties.jsx
    │   ├── PublicAgents.jsx
    │   ├── PublicNeighborhoods.jsx
    │   ├── UserDashboard.jsx
    │   ├── AgentDashboard.jsx
    │   ├── AdminDashboard.jsx
    │   └── ...
    ├── lib/
    │   ├── api.js          # apiFetch helper
    │   └── auth.js         # getCurrentUser, setCurrentUser, roles
    └── App.jsx             # Router + global state
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL / MariaDB
- npm

### 1. Clone the repo
```bash
git clone <repository-url>
cd realestate
```

### 2. Install dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 3. Set up the database
1. Open phpMyAdmin (or any MySQL client)
2. Create a database called `findhome_db`
3. Import the latest SQL dump from `backend/findhome_db.sql`

### 4. Configure backend
Create a `.env` file inside the `backend/` folder:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=findhome_db

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES=30d

PORT=5000
NODE_ENV=development
```
If no `.env` is present, the server falls back to `root` / no password on `localhost` (default XAMPP/WAMP setup).

### 5. Start the backend
```bash
cd backend
npm run dev     # starts on http://localhost:5000
```

### 6. Start the frontend
```bash
# from project root
npm run dev     # starts on http://localhost:5173
```

---

## Default Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `alba@ubt-uni.net` | *(see DB)* |
| Agent | `a21564756@gmail.com` | *(see DB)* |
| User | `Olti@user.com` | *(see DB)* |

---

## Key Environment Notes

- The frontend expects the backend at `http://localhost:5000` by default. Override by setting `VITE_API_URL` in a `.env` file at the project root.
- Uploaded files (photos, documents) are saved to `backend/uploads/`. This folder is auto-created on server start.
- The server auto-creates all required tables on startup if they don't exist.
- React-Leaflet requires `leaflet/dist/leaflet.css` — this is imported in `src/main.jsx`.

---

## Notable Technical Details

- **Fuzzy search** — Levenshtein distance matching for property search and neighbourhood city matching (tolerates typos like "Prishtine" → "Prishtina")
- **Lazy loading** — All heavy pages are loaded on-demand via `React.lazy()` + `Suspense`
- **Smart Alerts** — Search alerts use JS-side fuzzy matching (not SQL LIKE) so city name variants still trigger notifications
- **Property status sync** — When an agent signs a contract, the property automatically changes to Sold/Rented
- **Auto agent profile** — Registering as an agent automatically creates the `agents` table row
- **Q&A fallback** — If a property has no specific Q&A, it automatically inherits the agent's global template
- **Verified Reviews** — Review cards show a ✓ Verified badge if the reviewer has an approved visit or active contract for that property

---

## Authors

Developed by the KosovaNest team — UBT, Academic Year 2025/2026.
