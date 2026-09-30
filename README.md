# Drum Studio Booking System

A small PHP + MySQL booking application for the CC105 Human Computer Interaction project. It includes client registration/login, drum-kit management, booking requests, and admin approval/rejection.

## Requirements
- PHP 8.1+ with PDO MySQL enabled
- MySQL 8.0+ or MariaDB 10.4+
- Apache (XAMPP/LAMP) or PHP's built-in development server

## Setup
1. Copy this folder into your web server directory (for example, `/var/www/html/drum-studio-booking`).
2. Import `database.sql` using phpMyAdmin or the MySQL command line.
3. Open `includes/bootstrap.php` and set `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASS` for your local database.
4. Create an administrator account. Register normally at `/register.php`, then run the following SQL using the email you registered:

   ```sql
   USE drum_studio_booking;
   UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
   ```

   Log out and log in again so the admin role is loaded into the session. Do not expose the registration endpoint or database credentials on a public server without reviewing your deployment security.
5. Visit `http://localhost/drum-studio-booking/`.

For a quick local test from this folder, run `php -S 127.0.0.1:8000` and open `http://127.0.0.1:8000`.

## Roles and functionality
### Client
- Register and log in (passwords are stored using PHP's password hashing API).
- View active drum kits and submit a booking request with name/email/contact details, session date/time, duration, purpose, and optional notes.
- View booking details and status; cancel a pending request.

### Admin
- Dashboard with booking/client/drum counts.
- Create, read, update, and delete drum kits. A kit with booking history cannot be deleted; it can be deactivated instead.
- Read booking requests and approve, reject, or cancel them; add an admin note.
- View client accounts and activate/deactivate them.

## Booking rules
- Requests must be in the future (within one year) and last 1–12 hours.
- The application checks overlapping pending/approved bookings when a client submits a request. Admin approval also checks for overlapping approved sessions.
- Prices are calculated from the drum's hourly rate when the request is submitted and stored with the booking.
- A booking is not confirmed until an admin sets its status to `Approved`.

## Notes
- All database queries use PDO prepared statements.
- Forms use session-based CSRF tokens; output is HTML-escaped.
- Errors are shown in plain language; unexpected exceptions are logged to the PHP error log.
- This is a classroom/local project starter. Before public deployment, add HTTPS, secure cookie settings, rate limiting, email verification/password reset, audit logging, and a production secrets/configuration strategy.
