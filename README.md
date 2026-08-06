# Event Management App

Minimal starter with a Vite + React frontend and a Node.js (Express) backend.

Folders:
- client — Vite + React app
- server — Node.js (Express) API

Overview

This project is a simple event management demo that supports creating events, registering attendees, listing attendees, updating and deleting events. The server keeps data in-memory (an array) so all data is lost when the server restarts — this is intended for demo / learning purposes only.

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
# or for auto-reload during development:
# npm run dev
```

By default the frontend runs on http://localhost:5173 and the backend on http://localhost:5000.

Server notes

- The server uses Express and exposes a small REST API under /api/events.
- Basic security and middleware are enabled (helmet, cors, morgan) in the app entry.
- The server enforces validation and business rules (see API docs below).
- The in-memory data store means there is no persistence; switching to a database would require changing the model layer.

API

Base URL: http://localhost:5000/api/events

Routes

- GET /api/events
  - List all events (each event includes an attendees array).
  - Response: 200 OK, JSON array of events.

- POST /api/events
  - Create a new event.
  - Request JSON body fields:
    - title (string, required)
    - date (string, optional, YYYY-MM-DD; defaults to today)
    - location (string, optional)
    - description (string, optional)
    - maxCapacity (number, optional — 0 or omitted means unlimited)
  - Response: 201 Created, JSON of the created event.
  - Errors: 400 if title is missing.

- POST /api/events/:id/register
  - Register an attendee for the event with id = :id.
  - Request JSON body:
    - name (string, required)
    - email (string, required)
  - Behavior:
    - Rejects duplicate registrations by email (400).
    - Observes event.maxCapacity when > 0 and rejects if full (400).
    - Registration is protected by an in-memory lock to avoid race conditions when concurrent requests arrive.
  - Response: 201 Created, JSON { message, attendee } where attendee includes an id, name, email.
  - Errors: 400 for validation/capacity/duplicate; 404 if event not found.

- GET /api/events/:id/attendees
  - List attendees for a specific event.
  - Response: 200 OK, JSON array of attendee objects.
  - Errors: 404 if event not found.

- DELETE /api/events/:id/attendees/:attendeeId
  - Unregister an attendee by numeric attendeeId.
  - Response: 200 OK with the removed attendee object.
  - Errors: 404 if event or attendee not found.

- DELETE /api/events/:id/attendees
  - Unregister an attendee by providing identifying data in the request body (preferred: { email }).
  - Request JSON body examples:
    - { "email": "user@example.com" }
    - { "name": "Full Name" } (fallback — not guaranteed to be unique)
  - Response: 200 OK with the removed attendee object.
  - Errors: 400 if neither email nor name provided; 404 if event or attendee not found.

- PUT /api/events/:id
  - Update event fields.
  - Request JSON body fields allowed: title, date, location, description, maxCapacity.
  - Validation rules:
    - maxCapacity must be a non-negative number.
    - If maxCapacity > 0 it cannot be set lower than the current number of registered attendees.
  - Response: 200 OK with the updated event object.
  - Errors: 400 for invalid input; 404 if event not found.

- DELETE /api/events/:id
  - Delete an event by id.
  - Response: 200 OK with the deleted event object.
  - Errors: 404 if event not found.

Client integration notes

- The client uses fetch requests against the backend at http://localhost:5000 (see client code). If you run the server on a different host/port, update the client API URLs accordingly.
- The client prefers to delete attendees by id when available, and otherwise falls back to sending an email in the DELETE body.

Errors

- API error responses use JSON with an "error" message or the HTTP error body provided by the server. The server uses a central error handler which sets appropriate status codes (400, 404, 500, etc.).

Development

- server/package.json includes:
  - "start": "node server.js" — starts the server.
  - "dev": "nodemon server.js" — starts with nodemon for development.
- To extend this project for production, replace the in-memory models with a persistent datastore, add authentication, and tighten CORS origins.

Further questions or changes

If you'd like, I can:
- Add example curl commands for each endpoint.
- Add a short Postman/Insomnia collection to exercise the API.
- Convert the in-memory store to a simple file-based JSON persistence for development.

