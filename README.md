# BeatBase — Drum Studio Booking System

A prototype drum-studio booking application built with **HTML, SCSS, vanilla JavaScript, Node.js, and JSON file storage**. It does not use React, Vite, PHP, or a SQL database.

## Requirements

- Node.js 20 or newer
- npm

## Run on Linux, macOS, or Windows

From this project directory:

```bash
npm install
npm run build:css
npm start
```

Then open <http://localhost:3000>.

For frontend styling work, use a second terminal and run `npm run watch:css`; it recompiles SCSS whenever a source file changes. Restart the server after changing backend JavaScript.

## Demo accounts

**Studio owner**

- Email: `admin@beatbase.test`
- Password: `Admin123!`

**Drummer**

- Email: `jamie@example.com`
- Password: `Password123!`

## Storage

Application data is stored in `database/data.json`. Node.js reads and writes the file through the API; frontend JavaScript does not access the JSON file directly. The server blocks direct HTTP access to the data file.

The file contains users, bcrypt password hashes, rooms, bookings, and authentication tokens. Back it up before resetting demo data. JSON storage is appropriate for a local prototype, but it is not a production database: simultaneous writes and multi-process deployment are not robustly coordinated.

## Project structure

```text
beatbase-drum-studio-booking/
├── server.js
├── package.json
├── .env.example
├── index.html
├── database/
│   └── data.json
└── frontend/
    └── src/
        ├── components/       # shared HTML fragments
        ├── css/               # compiled CSS served by the browser
        ├── scss/              # editable SCSS sources
        └── js/                # vanilla JavaScript modules
```

## API overview

- `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`
- `POST /api/users/register`, `GET|PUT|DELETE /api/users/profile`
- `GET|POST /api/rooms`, `PUT|DELETE /api/rooms/:id`
- `GET|POST /api/bookings`, `GET|PUT|DELETE /api/bookings/:id`
- `GET /api/bookings/availability?roomId=:id&date=YYYY-MM-DD`

## Prototype limitations

- Account roles are selected during registration for demonstration; do not expose this registration flow publicly without restricting owner creation.
- JSON storage is for local/classroom use and is not designed for concurrent production traffic.
- Use only local/test data. This prototype is not hardened for public internet deployment.
