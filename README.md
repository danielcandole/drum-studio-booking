# Drum Studio Booking System

A simple, web-based **Drum Studio Booking System** developed for a Human-Computer Interaction (HCI) project. The system allows customers to browse available drum kits, submit booking requests, and manage their reservations. Administrators can manage drum kits, review booking requests, and approve or reject reservations.

The project demonstrates fundamental **Human-Computer Interaction (HCI)** principles while implementing a full-stack web application using HTML, CSS, JavaScript, PHP, and MySQL.

---

## Table of Contents

- [Project Information](#project-information)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Windows](#windows)
  - [Linux](#linux)
- [Database Configuration](#database-configuration)
- [Running the Application](#running-the-application)
  - [Using Apache](#using-apache)
  - [Using PHP Built-in Development Server](#using-php-built-in-development-server)
- [Creating an Administrator Account](#creating-an-administrator-account)
- [Application Usage](#application-usage)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Security Considerations](#security-considerations)
- [License](#license)

---

## Project Information

| Information | Details |
|---|---|
| Project Name | Drum Studio Booking System |
| Subject | CC105 - Human Computer Interaction |
| Course | Information Technology / Computer Science |
| Sections | CCS056 & CCS063 |
| Application Type | Web Application |
| Architecture | Client-Server |
| Backend | PHP |
| Database | MySQL / MariaDB |

## Features

### Client Features

- **User Registration:** Create an account using personal information and login credentials.
- **User Authentication:** Log in and securely access the system.
- **Drum Kit Browsing:** View available drum kits and their details.
- **Booking Management:** Submit booking requests by selecting a drum kit, date, and other required information.
- **Booking History:** View previous and current booking requests.
- **Booking Status:** Track whether a booking is pending, approved, rejected, or cancelled.
- **Account Management:** Manage personal account information.

### Administrator Features

- **Admin Dashboard:** View and manage the system's booking information.
- **Drum Kit Management:** Add, view, update, and delete drum kits.
- **Booking Management:** View, approve, reject, and manage customer booking requests.
- **Customer Management:** View and manage registered customer accounts.
- **Booking Status Management:** Update booking statuses and monitor reservations.

### System Features

- **CRUD Operations:** Create, read, update, and delete supported records.
- **Database Integration:** Store and retrieve application data using MySQL or MariaDB.
- **Input Validation:** Validate user input before processing.
- **Error Handling:** Display appropriate error messages when operations fail.
- **Role-Based Access:** Separate client and administrator functionality.
- **User-Friendly Interface:** Provide a straightforward interface for customers and administrators.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure and content |
| CSS3 | Styling and responsive layouts |
| Vanilla JavaScript | Client-side interactions and validation |
| PHP | Server-side logic and request processing |
| MySQL | Relational database management |
| Apache | Web server |
| XAMPP | Local development environment for Windows |
| MariaDB | Alternative database server for Linux |

---

## Requirements

Before installing the application, make sure you have the following:

- PHP 8.x or a compatible version
- MySQL or MariaDB
- Apache HTTP Server (optional if using PHP's built-in server)
- PHP MySQL extension (`mysqli` or `pdo_mysql`, depending on the application's configuration)
- A modern web browser
- Git (optional, for cloning the repository)

### Recommended Development Environments

**Windows**
- XAMPP
- PHP
- MySQL or MariaDB

**Linux**
- Apache
- PHP
- MariaDB
- PHP MySQL extension

You can also use PHP's built-in development server on either operating system.

---

# Installation

Choose the instructions for your operating system.

- [Windows Installation](#windows)
- [Linux Installation](#linux)

# Windows

The recommended way to run the application on Windows is through **XAMPP**, which provides Apache, PHP, and MariaDB/MySQL in one package.

## 1. Install XAMPP

Download and install XAMPP from the official website:

https://www.apachefriends.org/

During installation, make sure the following components are selected:

- Apache
- MySQL
- PHP
- phpMyAdmin

After installation, open the XAMPP Control Panel.

Start the following services:

- Apache
- MySQL

Both services should display a running status.

## 2. Clone the Repository

Open Command Prompt, PowerShell, or Git Bash.

Navigate to your XAMPP `htdocs` directory.

For a typical installation:

```powershell
cd C:\xampp\htdocs
```

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the actual URL of your GitHub repository.

Alternatively, download the repository as a ZIP file from GitHub and extract it into:

```text
C:\xampp\htdocs\
```

Make sure the project folder contains the application's PHP files, including its entry point.

For example:

```text
C:\xampp\htdocs\drum-studio-booking\
```

## 3. Create the Database

Open your browser and navigate to:

```text
http://localhost/phpmyadmin/
```

In phpMyAdmin:

1. Select **New** from the sidebar.
2. Enter the database name:

   ```text
   drum_studio_booking
   ```

3. Select `utf8mb4_unicode_ci` as the collation if available.
4. Click **Create**.

## 4. Import the Database

After creating the database:

1. Select `drum_studio_booking` from the sidebar.
2. Open the **Import** tab.
3. Click **Choose File**.
4. Select the `database.sql` file from the project directory.
5. Click **Import** or **Go**.

Wait for the import to finish.

If successful, the database tables should appear in phpMyAdmin.

## 5. Configure the Database Connection

Open the project's database configuration file:

```text
includes/bootstrap.php
```

Locate the database connection settings.

Configure them to match your local MySQL installation.

For a typical XAMPP installation:

```php
$host = 'localhost';
$dbname = 'drum_studio_booking';
$username = 'root';
$password = '';
```

These are example values for a default local XAMPP installation. If your database uses a different username or password, update the settings accordingly.

Preserve the existing configuration structure if it differs from this example.

Save the file after making your changes.

## 6. Run the Application

Make sure Apache and MySQL are running in the XAMPP Control Panel.

Open your browser and navigate to:

```text
http://localhost/drum-studio-booking/
```

If your project folder has a different name, replace `drum-studio-booking` with that folder name.

You should now be able to access the application.

---

# Linux

These instructions are intended for Debian-based distributions, including Ubuntu, Debian, and Parrot OS.

The commands below use MariaDB, which is compatible with most MySQL applications.

## 1. Update Your System

Open a terminal and run:

```bash
sudo apt update
```

## 2. Install the Required Packages

Install Apache, PHP, MariaDB, and the required PHP extensions:

```bash
sudo apt install apache2 php libapache2-mod-php php-mysql php-cli mariadb-server git unzip
```

This installs:

| Package | Purpose |
|---|---|
| `apache2` | Web server |
| `php` | PHP runtime |
| `libapache2-mod-php` | PHP integration with Apache |
| `php-mysql` | PHP database connectivity |
| `php-cli` | PHP command-line interface |
| `mariadb-server` | Database server |
| `git` | Repository cloning |
| `unzip` | Extracting ZIP archives |

## 3. Start Apache and MariaDB

Enable and start both services:

```bash
sudo systemctl enable --now apache2
sudo systemctl enable --now mariadb
```

Check their status:

```bash
systemctl status apache2
```

```bash
systemctl status mariadb
```

Both services should report:

```text
Active: active (running)
```

Press `q` to exit the status screen.

## 4. Clone the Repository

Navigate to Apache's default document root:

```bash
cd /var/www/html
```

Clone the repository:

```bash
sudo git clone YOUR_GITHUB_REPOSITORY_URL drum-studio-booking
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the actual GitHub repository URL.

Alternatively, download the ZIP archive and extract it into `/var/www/html/`.

Your project directory should be:

```text
/var/www/html/drum-studio-booking/
```

## 5. Set Directory Permissions

Set the project directory's ownership:

```bash
sudo chown -R www-data:www-data /var/www/html/drum-studio-booking
```

Set directory and file permissions:

```bash
sudo find /var/www/html/drum-studio-booking -type d -exec chmod 755 {} \;
```

```bash
sudo find /var/www/html/drum-studio-booking -type f -exec chmod 644 {} \;
```

These permissions allow Apache to read the application files.

If the application needs to write to specific directories, configure write permissions for those directories separately.

## 6. Create the Database

Open the MariaDB command-line interface:

```bash
sudo mariadb
```

Create the database:

```sql
CREATE DATABASE drum_studio_booking
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Exit MariaDB:

```sql
EXIT;
```

## 7. Import the Database

Navigate to the project directory:

```bash
cd /var/www/html/drum-studio-booking
```

Import the database schema:

```bash
sudo mariadb drum_studio_booking < database.sql
```

If the import succeeds, the database tables should be available.

You can verify them by running:

```bash
sudo mariadb drum_studio_booking -e "SHOW TABLES;"
```

## 8. Configure the Database Connection

Open the database configuration file:

```bash
sudo nano /var/www/html/drum-studio-booking/includes/bootstrap.php
```

Locate the database connection settings.

For example:

```php
$host = 'localhost';
$dbname = 'drum_studio_booking';
$username = 'root';
$password = '';
```

**Important:** These are example values. MariaDB on Linux may use Unix socket authentication for its root account. In that case, the PHP application may not be able to connect using the `root` account and an empty password.

For a more reliable configuration, create a dedicated database user.

Open MariaDB:

```bash
sudo mariadb
```

Create a dedicated user:

```sql
CREATE USER 'drum_app'@'localhost'
IDENTIFIED BY 'CHANGE_THIS_TO_A_STRONG_PASSWORD';
```

Grant access to the application's database:

```sql
GRANT ALL PRIVILEGES
ON drum_studio_booking.*
TO 'drum_app'@'localhost';
```

Exit MariaDB:

```sql
EXIT;
```

Update the application's database configuration:

```php
$host = 'localhost';
$dbname = 'drum_studio_booking';
$username = 'drum_app';
$password = 'CHANGE_THIS_TO_A_STRONG_PASSWORD';
```

Replace the example password with the password you used when creating the database user.

Do not commit real database credentials to a public GitHub repository.

Save the configuration file.

## 9. Access the Application

Open your browser and navigate to:

```text
http://localhost/drum-studio-booking/
```

You should now be able to access the application.

---

# Database Configuration

The application uses MySQL or MariaDB to store its data.

The database must be created and initialized using the SQL file included in the project.

### Database Name

```text
drum_studio_booking
```

### Database Import

The database schema is provided in:

```text
database.sql
```

Import this file before running the application.

### Database Connection

The application requires valid database connection settings.

Make sure the following values match your local database configuration:

| Setting | Description |
|---|---|
| Host | Database server hostname |
| Database | `drum_studio_booking` |
| Username | Database account |
| Password | Database account password |

The database connection settings are located in:

```text
includes/bootstrap.php
```

If you change the database name or credentials, update the configuration accordingly.

---

# Running the Application

There are two ways to run the application locally.

1. Apache
2. PHP's built-in development server

Choose the method that suits your development environment.

## Using Apache

Apache is recommended if you want to use a traditional PHP web server setup.

### Windows

Start Apache and MySQL using the XAMPP Control Panel.

Open:

```text
http://localhost/drum-studio-booking/
```

### Linux

Start Apache:

```bash
sudo systemctl start apache2
```

Start MariaDB:

```bash
sudo systemctl start mariadb
```

Open:

```text
http://localhost/drum-studio-booking/
```

If you have configured a different Apache virtual host or project directory, use the corresponding URL.

## Using PHP Built-in Development Server

PHP includes a lightweight development server that can run the application without Apache.

This is useful for local development and testing.

**Note:** MariaDB or MySQL must still be running because the application needs its database.

### Windows

Open PowerShell or Command Prompt.

Navigate to the project directory:

```powershell
cd C:\xampp\htdocs\drum-studio-booking
```

Start the development server:

```powershell
php -S 127.0.0.1:8000
```

Open your browser:

```text
http://127.0.0.1:8000/
```

If PHP is not recognized as a command, use the PHP executable included with XAMPP:

```powershell
C:\xampp\php\php.exe -S 127.0.0.1:8000
```

### Linux

Navigate to the project directory:

```bash
cd /var/www/html/drum-studio-booking
```

Start the development server:

```bash
php -S 127.0.0.1:8000
```

Open your browser:

```text
http://127.0.0.1:8000/
```

Alternatively, you can specify the project directory without changing your current working directory:

```bash
php -S 127.0.0.1:8000 -t /var/www/html/drum-studio-booking
```

### Stopping the Development Server

To stop PHP's built-in server, return to the terminal where it is running and press:

```text
CTRL + C
```

The development server will stop.

---

# Creating an Administrator Account

The application supports separate client and administrator functionality.

To access the administrator dashboard, you need an account with administrator privileges.

## 1. Register an Account

Open the application in your browser.

Navigate to the registration page and create a new account.

Use the account you intend to use for administration.

## 2. Promote the Account to Administrator

The administrator role must be assigned through the database unless the application provides a separate administrator creation feature.

Open phpMyAdmin or your database command-line interface.

For example, on Linux:

```bash
sudo mariadb drum_studio_booking
```

Inspect the database tables:

```sql
SHOW TABLES;
```

Identify the user table and inspect its structure:

```sql
DESCRIBE users;
```

The exact table name and role column depend on the database schema included in the project.

Follow the project's database structure and administrator setup instructions when assigning the administrator role.

**Security note:** Never allow ordinary clients to assign themselves administrator privileges.

After assigning the role, log out and log back in to access the administrator dashboard.

---

# Application Usage

## Client

Clients can use the application to:

1. Register an account.
2. Log in.
3. Browse available drum kits.
4. Select a drum kit.
5. Enter the required booking information.
6. Submit a booking request.
7. View booking history.
8. Check booking status.
9. Manage their account.

## Administrator

Administrators can use the application to:

1. Log in using an administrator account.
2. Access the admin dashboard.
3. View booking requests.
4. Approve or reject booking requests.
5. Manage existing bookings.
6. Add new drum kits.
7. Update drum kit information.
8. Remove drum kits when appropriate.
9. View and manage customer accounts.

---

# Troubleshooting

This section covers common installation and runtime issues.

## Windows

### Apache Fails to Start

Another application may already be using port `80` or `443`.

Check the ports configured in XAMPP and close any conflicting services or configure Apache to use another port.

### MySQL Fails to Start

Check whether another MySQL or MariaDB service is already running.

Make sure only the intended database server is using the configured port.

### PHP Is Not Recognized

If you receive an error such as:

```text
'php' is not recognized as an internal or external command
```

Use XAMPP's PHP executable:

```powershell
C:\xampp\php\php.exe -v
```

You can also add the XAMPP PHP directory to your Windows PATH.

### Database Connection Failed

Check the database name, username, password, and host in the application's configuration file.

Make sure MySQL is running in XAMPP.

### Page Not Found

Verify that the project is located in:

```text
C:\xampp\htdocs\drum-studio-booking\
```

Make sure the project contains its expected entry point, such as `index.php`.

---

## Linux

### Apache Is Not Running

Start Apache:

```bash
sudo systemctl start apache2
```

Check its status:

```bash
sudo systemctl status apache2
```

### MariaDB Is Not Running

Start MariaDB:

```bash
sudo systemctl start mariadb
```

Check its status:

```bash
sudo systemctl status mariadb
```

### Database Connection Failed

Verify the database connection settings in:

```text
includes/bootstrap.php
```

Make sure the database exists and the configured user has the required permissions.

You can test the database connection from the terminal:

```bash
mariadb -u drum_app -p drum_studio_booking
```

Enter the database user's password when prompted.

### PHP MySQL Extension Is Missing

Install the extension:

```bash
sudo apt install php-mysql
```

Restart Apache:

```bash
sudo systemctl restart apache2
```

### Permission Denied

Check the project directory's ownership:

```bash
ls -ld /var/www/html/drum-studio-booking
```

Set the appropriate ownership if necessary:

```bash
sudo chown -R www-data:www-data /var/www/html/drum-studio-booking
```

Avoid using `chmod 777` as a workaround.

### HTTP 500 Internal Server Error

Check the Apache error log:

```bash
sudo tail -f /var/log/apache2/error.log
```

This may reveal PHP errors, missing extensions, or file permission problems.

You can also check PHP's version and installed extensions:

```bash
php -v
```

```bash
php -m
```

Look for the `mysqli` or `pdo_mysql` extension, depending on which database driver the application uses.

---

# Project Structure

The project is organized into separate directories for its application components.

```text
drum-studio-booking/
│
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
│
├── includes/
│   └── bootstrap.php
│
├── database.sql
├── index.php
└── README.md
```

The structure above illustrates the main application components. Additional directories and files may be present in the repository.

| Directory or File | Description |
|---|---|
| `assets/` | Static resources used by the application |
| `assets/css/` | Stylesheets |
| `assets/js/` | Client-side JavaScript |
| `assets/images/` | Images and other visual resources |
| `includes/` | Shared PHP components and configuration |
| `includes/bootstrap.php` | Application initialization and database configuration |
| `database.sql` | Database schema and initialization |
| `index.php` | Application entry point |
| `README.md` | Project documentation |

---

# Security Considerations

The application is intended primarily for local development and academic demonstration.

When running the application, consider the following:

- Use password hashing for stored passwords.
- Use prepared statements for database queries.
- Validate and sanitize user input appropriately.
- Enforce role-based authorization on the server.
- Protect state-changing requests against CSRF attacks.
- Do not expose database credentials in public repositories.
- Avoid displaying detailed PHP errors to ordinary users.
- Use HTTPS and secure session settings when deploying to a public server.

For local development, the PHP built-in server is convenient. For production, use a properly configured web server and database environment.

---

# License

This project was developed for academic purposes as part of the CC105 - Human Computer Interaction subject.

Unless a separate license is provided in this repository, all rights remain with the project authors.