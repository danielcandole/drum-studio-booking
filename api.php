<?php
declare(strict_types=1);

const DATA_FILE = __DIR__ . '/database/data.json';
const SESSION_DIR = __DIR__ . '/database/sessions';

if (!is_dir(SESSION_DIR)) {
    mkdir(SESSION_DIR, 0775, true);
}

session_save_path(SESSION_DIR);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function response(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function read_data(): array {
    if (!file_exists(DATA_FILE)) {
        file_put_contents(DATA_FILE, json_encode(['users' => [], 'rooms' => [], 'bookings' => []], JSON_PRETTY_PRINT), LOCK_EX);
    }
    $data = json_decode((string) file_get_contents(DATA_FILE), true);
    return is_array($data) ? $data : ['users' => [], 'rooms' => [], 'bookings' => []];
}

function write_data(array $data): void {
    file_put_contents(DATA_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
}

function input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return $_POST ?: [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function user(): ?array {
    if (!isset($_SESSION['user_id'])) return null;
    foreach (read_data()['users'] as $item) {
        if ((int)$item['id'] === (int)$_SESSION['user_id']) {
            unset($item['password']);
            return $item;
        }
    }
    return null;
}

function require_user(): array {
    $current = user();
    if (!$current) response(['message' => 'Please log in first.'], 401);
    return $current;
}

function require_owner(): array {
    $current = require_user();
    if ($current['role'] !== 'owner') response(['message' => 'Owner access required.'], 403);
    return $current;
}

function next_id(array $items, int $fallback = 1): int {
    $ids = array_map(fn($item) => (int)($item['id'] ?? 0), $items);
    return $ids ? max($ids) + 1 : $fallback;
}

$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$data = read_data();

try {
    if ($route === 'auth/session' && $method === 'GET') {
        response(['authenticated' => (bool) user(), 'user' => user()]);
    }

    if ($route === 'auth/login' && $method === 'POST') {
        $payload = input();
        $email = strtolower(trim((string)($payload['email'] ?? '')));
        $password = (string)($payload['password'] ?? '');
        foreach ($data['users'] as $item) {
            if (strtolower($item['email']) === $email && password_verify($password, $item['password'])) {
                $_SESSION['user_id'] = (int)$item['id'];
                unset($item['password']);
                response(['message' => 'Login successful.', 'user' => $item]);
            }
        }
        response(['message' => 'Invalid email or password.'], 401);
    }

    if ($route === 'auth/logout' && $method === 'POST') {
        $_SESSION = [];
        session_destroy();
        response(['message' => 'Logged out.']);
    }

    if ($route === 'users/register' && $method === 'POST') {
        $payload = input();
        $email = strtolower(trim((string)($payload['email'] ?? '')));
        foreach ($data['users'] as $item) {
            if (strtolower($item['email']) === $email) response(['message' => 'That email is already registered.'], 409);
        }
        $user = [
            'id' => next_id($data['users']),
            'name' => trim((string)($payload['name'] ?? '')),
            'email' => $email,
            'password' => password_hash((string)($payload['password'] ?? ''), PASSWORD_DEFAULT),
            'role' => ($payload['role'] ?? 'drummer') === 'owner' ? 'owner' : 'drummer',
            'phone' => trim((string)($payload['phone'] ?? '')),
            'created_at' => date(DATE_ATOM),
        ];
        $data['users'][] = $user;
        write_data($data);
        $_SESSION['user_id'] = $user['id'];
        unset($user['password']);
        response(['message' => 'Account created.', 'user' => $user], 201);
    }

    if ($route === 'users/profile' && $method === 'GET') {
        response(['user' => require_user()]);
    }

    if ($route === 'users/profile' && $method === 'PUT') {
        $current = require_user();
        $payload = input();
        foreach ($data['users'] as &$item) {
            if ((int)$item['id'] === (int)$current['id']) {
                $item['name'] = trim((string)($payload['name'] ?? $item['name']));
                $item['email'] = strtolower(trim((string)($payload['email'] ?? $item['email'])));
                $item['phone'] = trim((string)($payload['phone'] ?? $item['phone']));
                if (!empty($payload['password'])) $item['password'] = password_hash((string)$payload['password'], PASSWORD_DEFAULT);
                $current = $item;
                break;
            }
        }
        unset($item);
        write_data($data);
        unset($current['password']);
        response(['message' => 'Profile updated.', 'user' => $current]);
    }

    if ($route === 'users/profile' && $method === 'DELETE') {
        $current = require_user();
        $data['users'] = array_values(array_filter($data['users'], fn($item) => (int)$item['id'] !== (int)$current['id']));
        $data['bookings'] = array_values(array_filter($data['bookings'], fn($item) => (int)($item['user_id'] ?? 0) !== (int)$current['id']));
        write_data($data);
        $_SESSION = [];
        session_destroy();
        response(['message' => 'Account deleted.']);
    }

    if ($route === 'rooms' && $method === 'GET') {
        response(['rooms' => array_values(array_filter($data['rooms'], fn($room) => !isset($room['active']) || $room['active']))]);
    }

    if ($route === 'rooms/all' && $method === 'GET') {
        require_owner();
        response(['rooms' => $data['rooms']]);
    }

    if ($route === 'rooms' && $method === 'POST') {
        require_owner();
        $payload = input();
        $room = [
            'id' => next_id($data['rooms']),
            'name' => trim((string)($payload['name'] ?? 'New Room')),
            'price' => (float)($payload['price'] ?? 0),
            'capacity' => (int)($payload['capacity'] ?? 1),
            'equipment' => trim((string)($payload['equipment'] ?? '')),
            'image' => (string)($payload['image'] ?? 'https://images.unsplash.com/photo-1537054388073-cf990597af2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'),
            'active' => true,
            'created_at' => date(DATE_ATOM),
        ];
        $data['rooms'][] = $room;
        write_data($data);
        response(['message' => 'Room saved.', 'room' => $room], 201);
    }

    if (preg_match('#^rooms/(\d+)$#', $route, $matches) && $method === 'PUT') {
        require_owner();
        $id = (int)$matches[1];
        $payload = input();
        foreach ($data['rooms'] as &$room) {
            if ((int)$room['id'] === $id) {
                foreach (['name', 'equipment', 'image'] as $key) if (isset($payload[$key])) $room[$key] = trim((string)$payload[$key]);
                if (isset($payload['price'])) $room['price'] = (float)$payload['price'];
                if (isset($payload['capacity'])) $room['capacity'] = (int)$payload['capacity'];
                if (isset($payload['active'])) $room['active'] = (bool)$payload['active'];
                write_data($data);
                response(['message' => 'Room updated.', 'room' => $room]);
            }
        }
        unset($room);
        response(['message' => 'Room not found.'], 404);
    }

    if (preg_match('#^rooms/(\d+)$#', $route, $matches) && $method === 'DELETE') {
        require_owner();
        $id = (int)$matches[1];
        $data['rooms'] = array_values(array_filter($data['rooms'], fn($room) => (int)$room['id'] !== $id));
        write_data($data);
        response(['message' => 'Room deleted.']);
    }

    if ($route === 'bookings' && $method === 'GET') {
        $current = require_user();
        $bookings = $current['role'] === 'owner' ? $data['bookings'] : array_values(array_filter($data['bookings'], fn($item) => (int)$item['user_id'] === (int)$current['id']));
        response(['bookings' => $bookings]);
    }

    if ($route === 'bookings' && $method === 'POST') {
        $current = require_user();
        $payload = input();
        $roomId = (int)($payload['room_id'] ?? 0);
        $room = null;
        foreach ($data['rooms'] as $item) if ((int)$item['id'] === $roomId && ($item['active'] ?? true)) $room = $item;
        if (!$room) response(['message' => 'Room not found.'], 404);
        $booking = [
            'id' => next_id($data['bookings'], 1001),
            'user_id' => (int)$current['id'],
            'customer' => $current['name'],
            'room_id' => $room['id'],
            'room' => $room['name'],
            'date' => (string)($payload['date'] ?? date('Y-m-d')),
            'time' => (string)($payload['time'] ?? '10:00 AM – 11:00 AM'),
            'start_time' => (string)($payload['start_time'] ?? '10:00'),
            'duration' => (int)($payload['duration'] ?? 1),
            'status' => 'pending',
            'payment' => 'Pending',
            'amount' => (float)$room['price'] * (int)($payload['duration'] ?? 1),
            'image' => $room['image'],
            'created_at' => date(DATE_ATOM),
        ];
        $data['bookings'][] = $booking;
        write_data($data);
        response(['message' => 'Booking created.', 'booking' => $booking], 201);
    }

    if (preg_match('#^bookings/(\d+)$#', $route, $matches) && $method === 'PUT') {
        $current = require_user();
        $id = (int)$matches[1];
        $payload = input();
        foreach ($data['bookings'] as &$booking) {
            if ((int)$booking['id'] !== $id) continue;
            if ($current['role'] !== 'owner' && (int)$booking['user_id'] !== (int)$current['id']) response(['message' => 'Booking access denied.'], 403);
            foreach (['status', 'payment', 'date', 'time', 'start_time'] as $key) if (isset($payload[$key])) $booking[$key] = $payload[$key];
            if (isset($payload['duration'])) $booking['duration'] = (int)$payload['duration'];
            if (isset($payload['amount'])) $booking['amount'] = (float)$payload['amount'];
            write_data($data);
            response(['message' => 'Booking updated.', 'booking' => $booking]);
        }
        unset($booking);
        response(['message' => 'Booking not found.'], 404);
    }

    if (preg_match('#^bookings/(\d+)$#', $route, $matches) && $method === 'DELETE') {
        $current = require_user();
        $id = (int)$matches[1];
        foreach ($data['bookings'] as &$booking) {
            if ((int)$booking['id'] === $id) {
                if ($current['role'] !== 'owner' && (int)$booking['user_id'] !== (int)$current['id']) response(['message' => 'Booking access denied.'], 403);
                $booking['status'] = 'cancelled';
                $booking['payment'] = $booking['payment'] === 'Paid' ? 'Refunded' : 'Cancelled';
                write_data($data);
                response(['message' => 'Booking cancelled.', 'booking' => $booking]);
            }
        }
        unset($booking);
        response(['message' => 'Booking not found.'], 404);
    }

    response(['message' => 'Route not found.'], 404);
} catch (Throwable $e) {
    response(['message' => 'Server error: ' . $e->getMessage()], 500);
}
