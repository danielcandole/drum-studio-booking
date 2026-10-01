<?php
declare(strict_types=1);

$root = dirname(__DIR__);
$dataDir = $root . DIRECTORY_SEPARATOR . 'data';
$storeFile = $dataDir . DIRECTORY_SEPARATOR . 'store.json';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0775, true);
}

// Private, app-specific session directory to avoid broken system session settings
$sessionDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'drum_studio_sessions_' . substr(hash('sha256', $root), 0, 12);
if (!is_dir($sessionDir)) {
    @mkdir($sessionDir, 0700, true);
}
if (!is_writable($sessionDir)) {
    http_response_code(500);
    exit('Session directory is not writable: ' . $sessionDir);
}

ini_set('session.save_path', $sessionDir);
ini_set('session.use_strict_mode', '1');
session_name('DRUMSTUDIOSESSID');
session_start();

function seed(): array {
    return [
        'meta' => ['next_user_id' => 2, 'next_kit_id' => 3, 'next_booking_id' => 1],
        'users' => [[
            'id' => 1,
            'name' => 'Studio Administrator',
            'email' => 'admin@drumstudio.local',
            'password' => password_hash('Admin123!', PASSWORD_DEFAULT),
            'role' => 'admin',
            'active' => true,
            'phone' => '',
            'created_at' => date('c')
        ]],
        'kits' => [
            [
                'id' => 1,
                'name' => 'Standard Drum Kit',
                'brand' => 'Pearl',
                'description' => 'A versatile acoustic kit for practice and recording.',
                'price' => 250,
                'active' => true
            ],
            [
                'id' => 2,
                'name' => 'Professional Drum Kit',
                'brand' => 'Tama',
                'description' => 'A professional kit with premium hardware.',
                'price' => 400,
                'active' => true
            ]
        ],
        'bookings' => []
    ];
}

function read_store(): array {
    global $storeFile;
    if (!file_exists($storeFile)) {
        $s = seed();
        file_put_contents($storeFile, json_encode($s, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
        return $s;
    }
    $raw = file_get_contents($storeFile);
    $s = json_decode((string)$raw, true);
    if (!is_array($s) || !isset($s['users'], $s['kits'], $s['bookings'], $s['meta'])) {
        throw new RuntimeException('JSON data is invalid. Back up and repair data/store.json.');
    }
    return $s;
}

function change_store(callable $fn): mixed {
    global $storeFile;
    $fp = fopen($storeFile, 'c+');
    if (!$fp) {
        throw new RuntimeException('Cannot open data/store.json for writing. Check permissions.');
    }
    try {
        if (!flock($fp, LOCK_EX)) {
            throw new RuntimeException('Cannot lock JSON store.');
        }
        rewind($fp);
        $raw = stream_get_contents($fp);
        $s = $raw === '' ? seed() : json_decode($raw, true);
        if (!is_array($s) || !isset($s['users'], $s['kits'], $s['bookings'], $s['meta'])) {
            throw new RuntimeException('JSON data is invalid.');
        }
        $result = $fn($s);
        $json = json_encode($s, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        rewind($fp);
        if (!ftruncate($fp, 0) || fwrite($fp, $json) === false) {
            throw new RuntimeException('Could not save JSON data.');
        }
        fflush($fp);
        return $result;
    } finally {
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

function e(mixed $v): string {
    return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function user(): ?array {
    return $_SESSION['user'] ?? null;
}

function is_admin(): bool {
    return (user()['role'] ?? '') === 'admin';
}

function require_login(): void {
    if (!user()) {
        flash('Please sign in first.', 'error');
        go('?page=login');
    }
    $s = read_store();
    $valid = false;
    foreach ($s['users'] as $u) {
        if ((int)$u['id'] === (int)user()['id'] && !empty($u['active']) && $u['role'] === user()['role']) {
            $valid = true;
            break;
        }
    }
    if (!$valid) {
        session_unset();
        flash('Your account is inactive or no longer available. Please contact the administrator.', 'error');
        go('?page=login');
    }
}

function require_admin(): void {
    require_login();
    if (!is_admin()) {
        flash('Administrator access is required.', 'error');
        go('?page=home');
    }
}

function go(string $url): never {
    header('Location: ' . $url);
    exit;
}

function flash(string $m, string $type = 'success'): void {
    $_SESSION['flash'] = ['message' => $m, 'type' => $type];
}

function csrf(): string {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function check_csrf(): void {
    if (!hash_equals(csrf(), (string)($_POST['csrf'] ?? ''))) {
        http_response_code(419);
        exit('Invalid form token. Refresh the page and try again.');
    }
}

function post(string $key): string {
    return trim((string)($_POST[$key] ?? ''));
}

function dt(string $s): ?DateTimeImmutable {
    try {
        return new DateTimeImmutable($s);
    } catch (Throwable) {
        return null;
    }
}

function booking_conflict(array $s, int $kitId, string $start, string $end, int $except = 0): bool {
    foreach ($s['bookings'] as $b) {
        if ((int)$b['id'] === $except || (int)$b['kit_id'] !== $kitId || !in_array($b['status'], ['pending', 'approved'], true)) {
            continue;
        }
        if ($start < $b['end'] && $end > $b['start']) {
            return true;
        }
    }
    return false;
}

function csrf_field(): void {
    echo '<input type="hidden" name="csrf" value="' . e(csrf()) . '">';
}