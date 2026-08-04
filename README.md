# Event Management App

Minimal starter with a Vite + React frontend and a Node.js (Express) backend.

Folders:
- client — Vite + React app
- server — Node.js (Express) API

Quick start

1. In two terminals, install dependencies:

```bash
cd client
npm install

# in a separate terminal
cd server
npm install
```

2. Run the dev servers:

```bash
# client (Vite)
cd client
npm run dev

# server (Express)
cd server
npm start
```

Frontend runs on http://localhost:5173 and the backend on http://localhost:5000.

API

- GET /api/events — list events
- POST /api/events — add an event (JSON)
