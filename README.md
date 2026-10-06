# BeatBase Drum Studio Booking System

Dynamic Drum Studio Booking System using **PHP + JavaScript + JSON**. All persistent application data is stored in:

```text
database/data.json
```

No MySQL database is required.

## Run on Linux / macOS / Windows

Install PHP 8.x, then open a terminal in the project directory:

```bash
php -S 127.0.0.1:8000
```

Open:

```text
http://127.0.0.1:8000
```

Do not open `index.html` directly with `file://`; the PHP API and sessions require the PHP server.

## Admin account

Login from the normal Login page:

```text
Email:    admin@drumstudio.local
Password: Admin123!
```

The admin account uses the `owner` role and can manage rooms and bookings.

## Demo client account

```text
Email:    jamie@example.com
Password: Jamie123!
```

## Data storage

`database/data.json` contains:

- users
- studio rooms
- bookings

PHP reads and writes this file through `api.php`. PHP sessions are stored in `database/sessions/`.

The dashboard, booking pages, owner pages, rooms, profile, login, registration, and booking status are loaded from the JSON data rather than hard-coded demo arrays.

## Money format

All displayed monetary values use the Philippine peso symbol:

```text
₱
```

Example:

```text
₱1,400.00
```
