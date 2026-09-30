<?php
declare(strict_types=1);
session_start();

const DB_HOST = '127.0.0.1';
const DB_NAME = 'drum_studio_booking';
const DB_USER = 'root';
const DB_PASS = '';

function db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    $pdo = new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}
function e(?string $value): string { return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function redirect(string $path): never { header('Location: '.$path); exit; }
function csrf_token(): string { return $_SESSION['csrf'] ??= bin2hex(random_bytes(32)); }
function verify_csrf(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        http_response_code(400); exit('Invalid request token. Please go back and try again.');
    }
}
function flash(string $type, string $message): void { $_SESSION['flash'] = ['type'=>$type, 'message'=>$message]; }
function take_flash(): ?array { $f = $_SESSION['flash'] ?? null; unset($_SESSION['flash']); return $f; }
function user(): ?array { return $_SESSION['user'] ?? null; }
function require_login(): void { if (!user()) { flash('error', 'Please log in to continue.'); redirect('../login.php'); } }
function require_admin(): void { require_login(); if (user()['role'] !== 'admin') { http_response_code(403); exit('403 — Admin access required.'); } }
function require_client(): void { require_login(); if (user()['role'] !== 'client') { http_response_code(403); exit('403 — Client access required.'); } }
function page_header(string $title): void {
    $f = take_flash();
    $base = (str_contains($_SERVER['SCRIPT_NAME'] ?? '', '/admin/') || str_contains($_SERVER['SCRIPT_NAME'] ?? '', '/client/')) ? '../' : '';
    ?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title><?=e($title)?> · Drum Studio</title><link rel="stylesheet" href="<?=e($base)?>assets/style.css"></head><body><header class="topbar"><a class="brand" href="<?=e($base)?><?= user() ? (user()['role']==='admin'?'admin/index.php':'client/index.php') : 'index.php' ?>">🥁 Drum Studio</a><nav><?php if (user()): ?><span class="welcome">Hi, <?=e(user()['name'])?></span><?php if (user()['role']==='admin'): ?><a href="<?=e($base)?>admin/index.php">Dashboard</a><a href="<?=e($base)?>admin/drums.php">Drums</a><a href="<?=e($base)?>admin/bookings.php">Bookings</a><a href="<?=e($base)?>admin/users.php">Users</a><?php else: ?><a href="<?=e($base)?>client/index.php">My bookings</a><a href="<?=e($base)?>client/book.php">Book a drum</a><?php endif; ?><form class="navform" method="post" action="<?=e($base)?>logout.php"><input type="hidden" name="csrf" value="<?=e(csrf_token())?>"><button class="linkbutton" type="submit">Log out</button></form><?php else: ?><a href="<?=e($base)?>login.php">Log in</a><a class="nav-cta" href="<?=e($base)?>register.php">Register</a><?php endif; ?></nav></header><main class="container"><div class="page-heading"><h1><?=e($title)?></h1></div><?php if ($f): ?><div class="alert <?=e($f['type'])?>" role="status"><?=e($f['message'])?></div><?php endif; ?><?php
}
function page_footer(): void { ?></main><footer class="footer">Drum Studio Booking System · CC105 Human Computer Interaction</footer><script src="<?=e($base)?>assets/app.js"></script></body></html><?php }
function money(float|string $amount): string { return '₱'.number_format((float)$amount, 2); }
function booking_status_class(string $status): string { return 'status status-'.strtolower($status); }
