# Drum Studio Booking System (JSON Edition)

A PHP-based drum studio booking system that stores data in JSON. MySQL, Composer, and Node.js are not required.

## Requirements
- PHP 8.1 or later, with sessions enabled
- A web browser
- Write access to the application's `data/` directory

## Run on Linux (including Parrot OS and Ubuntu), macOS, or Windows

1. Extract the ZIP file.
2. Open a terminal (PowerShell or Command Prompt on Windows) in the `drum-studio-booking` folder.
3. Start PHP's built-in development server:

   ```bash
   php -S 127.0.0.1:8000
   ```

   If `php` is not recognized, install PHP and ensure it is available in your system's PATH.
4. Open **http://127.0.0.1:8000/** in your browser.
5. To stop the server, press `Ctrl+C` in the terminal.

## Admin login
Use the same login page as clients:

- Login page: **http://127.0.0.1:8000/login.php**
- Email: `admin@drumstudio.local`
- Password: `Admin123!`

Change the demo password before using the system beyond local testing. Clients can register through the registration page.

## Booking workflow
1. A client registers, signs in, selects an available drum kit, and submits a booking.
2. The booking appears as **Pending** in the client's account and the admin booking queue.
3. The admin signs in, opens **Bookings**, and approves, rejects, completes, or cancels the request. The admin can also leave a note.
4. The client can sign in again to view the updated status and admin note. Clients can cancel eligible bookings.

Admins can also manage drum kits and client accounts from the admin dashboard.

## Data and troubleshooting
- Records are stored in `data/store.json`; no database setup is needed.
- The PHP process must be able to write to `data/` and `data/store.json`.
- If the session fails to start, verify PHP sessions are enabled and that the system's temporary directory is writable.
- Keep backups of `data/store.json`. This JSON edition is intended for local/classroom use, not high-concurrency production hosting.
