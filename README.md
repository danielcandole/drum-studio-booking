# BeatBase Drum Studio Booking System

A dynamic Drum Studio Booking System using:

- Vite frontend
- Vanilla JavaScript frontend modules
- PHP API backend
- `database/data.json` as the application data store

The existing UI is preserved. Application data is loaded from JSON through the PHP API.

## Requirements

- Node.js and npm
- PHP 8.x or newer
- A modern browser

No MySQL or other database server is required.

## Run on Linux

From the project directory:

```bash
npm install
npm run dev
```

`npm run dev` starts both:

- Vite frontend: `http://localhost:8443`
- PHP API: `http://127.0.0.1:8000`

Open:

```text
http://localhost:8443
```

## Run on Windows

Open PowerShell or Command Prompt in the project directory:

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:8443
```

PHP must be available in your PATH. If Windows cannot find `php`, install PHP and add its directory to PATH.

## Run on macOS

From Terminal:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:8443
```

PHP must be installed and available through the `php` command.

## Default accounts

### Studio Owner

```text
Email: admin@beatbase.test
Password: Admin123!
```

### Drummer

```text
Email: jamie@example.com
Password: Password123!
```

These are seed accounts in `database/data.json`.

## Data storage

Persistent application data is stored in:

```text
database/data.json
```

The frontend does not directly read this file. It communicates with `api.php`, which reads and writes the JSON database.

The application uses a client-side authentication token rather than PHP sessions. The token is stored in the browser and validated by the PHP API.

## Important

Do not open `index.html` directly with `file://`.

Use:

```bash
npm run dev
```

The Vite development server proxies `/api.php` requests to the PHP backend.

Direct access to `database/data.json` is blocked by the development server and PHP router.

## Main API routes

```text
GET    /api.php?route=auth/session
POST   /api.php?route=auth/login
POST   /api.php?route=auth/logout

POST   /api.php?route=users/register
GET    /api.php?route=users/profile
PUT    /api.php?route=users/profile
DELETE /api.php?route=users/profile

GET    /api.php?route=rooms
POST   /api.php?route=rooms
PUT    /api.php?route=rooms/{id}
DELETE /api.php?route=rooms/{id}

GET    /api.php?route=bookings
POST   /api.php?route=bookings
GET    /api.php?route=bookings/{id}
PUT    /api.php?route=bookings/{id}
DELETE /api.php?route=bookings/{id}

GET    /api.php?route=bookings/availability&roomId={id}&date={date}
```

## Currency

All application prices and revenue use Philippine pesos:

```text
₱28.00
```

## Roles

### Drummer

Can:

- view the drummer dashboard
- browse rooms
- check availability
- create bookings
- view bookings
- edit eligible bookings
- cancel bookings
- update their profile
- delete their account

### Studio Owner

Can:

- view the owner dashboard
- manage rooms
- create rooms
- edit rooms
- delete rooms when they have no active bookings
- view all bookings
- approve bookings
- edit bookings
- cancel bookings
- update their profile
- delete their account

## Notes

This project is intended as a local/classroom application. JSON storage and client-side authentication are intentionally used instead of a production database and server-side session system.
