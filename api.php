<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const DB_FILE = __DIR__ . '/database/data.json';
date_default_timezone_set('Asia/Manila');

function respond(mixed $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function read_db(): array {
    if (!file_exists(DB_FILE)) {
        respond(['message' => 'Database file not found.'], 500);
    }
    $raw = file_get_contents(DB_FILE);
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) {
        respond(['message' => 'Database JSON is invalid.'], 500);
    }
    $data['users'] ??= [];
    $data['rooms'] ??= [];
    $data['bookings'] ??= [];
    $data['tokens'] ??= [];
    return $data;
}

function write_db(array $data): void {
    $dir = dirname(DB_FILE);
    if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
        respond(['message' => 'Unable to create database directory.'], 500);
    }
    $fp = fopen(DB_FILE, 'c+');
    if (!$fp) respond(['message' => 'Unable to open database.'], 500);
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        respond(['message' => 'Unable to lock database.'], 500);
    }
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
}

function body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function route(): string {
    return trim((string)($_GET['route'] ?? ''), '/');
}

function public_user(array $user): array {
    unset($user['password']);
    return $user;
}

function token_from_request(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $header, $m)) return trim($m[1]);
    return null;
}

function current_user(array &$db): ?array {
    $token = token_from_request();
    if (!$token) return null;
    foreach ($db['tokens'] as $entry) {
        if (($entry['token'] ?? '') === $token) {
            foreach ($db['users'] as $user) {
                if ((int)$user['id'] === (int)$entry['userId']) return $user;
            }
        }
    }
    return null;
}

function require_user(array &$db): array {
    $user = current_user($db);
    if (!$user) respond(['message' => 'Authentication required.'], 401);
    return $user;
}

function require_owner(array &$db): array {
    $user = require_user($db);
    if (($user['role'] ?? '') !== 'owner') respond(['message' => 'Owner access required.'], 403);
    return $user;
}

function next_id(array $items): int {
    $ids = array_map(fn($item) => (int)($item['id'] ?? 0), $items);
    return $ids ? max($ids) + 1 : 1;
}

function room_by_id(array $db, int $id): ?array {
    foreach ($db['rooms'] as $room) if ((int)$room['id'] === $id) return $room;
    return null;
}

function user_by_id(array $db, int $id): ?array {
    foreach ($db['users'] as $user) if ((int)$user['id'] === $id) return $user;
    return null;
}

function booking_view(array $db, array $booking): array {
    $user = user_by_id($db, (int)$booking['userId']);
    $room = room_by_id($db, (int)$booking['roomId']);
    return [
        ...$booking,
        'customer' => $user['name'] ?? 'Unknown customer',
        'customerEmail' => $user['email'] ?? '',
        'room' => $room['name'] ?? 'Unknown room',
        'roomPrice' => (float)($room['price'] ?? 0),
        'image' => $room['image'] ?? '',
        'total' => round((float)($room['price'] ?? 0) * (float)($booking['duration'] ?? 1), 2),
    ];
}

function validate_booking(array $db, array $payload, ?int $ignoreId = null): array {
    $roomId = (int)($payload['roomId'] ?? 0);
    $date = trim((string)($payload['date'] ?? ''));
    $time = trim((string)($payload['time'] ?? ''));
    $duration = (float)($payload['duration'] ?? 1);

    if (!$roomId || !room_by_id($db, $roomId)) respond(['message' => 'Selected room does not exist.'], 422);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) respond(['message' => 'Invalid booking date.'], 422);
    if (!preg_match('/^\d{2}:\d{2}$/', $time)) respond(['message' => 'Invalid booking time.'], 422);
    if ($duration <= 0 || $duration > 12) respond(['message' => 'Invalid booking duration.'], 422);

    $start = strtotime("$date $time");
    if ($start === false) respond(['message' => 'Invalid booking date/time.'], 422);
    $end = $start + (int)($duration * 3600);

    foreach ($db['bookings'] as $existing) {
        if ($ignoreId !== null && (int)$existing['id'] === $ignoreId) continue;
        if ((int)$existing['roomId'] !== $roomId || $existing['date'] !== $date) continue;
        if (($existing['status'] ?? '') === 'cancelled') continue;

        $existingStart = strtotime($existing['date'] . ' ' . $existing['time']);
        $existingEnd = $existingStart + (int)(((float)($existing['duration'] ?? 1)) * 3600);
        if ($start < $existingEnd && $end > $existingStart) {
            respond(['message' => 'That room and time is already unavailable.'], 409);
        }
    }

    return ['roomId' => $roomId, 'date' => $date, 'time' => $time, 'duration' => $duration];
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$route = route();
$db = read_db();

try {
    switch (true) {
        case $route === 'auth/session' && $method === 'GET':
            $user = current_user($db);
            respond(['authenticated' => (bool)$user, 'user' => $user ? public_user($user) : null]);

        case $route === 'auth/login' && $method === 'POST':
            $payload = body();
            $email = strtolower(trim((string)($payload['email'] ?? '')));
            $password = (string)($payload['password'] ?? '');
            foreach ($db['users'] as $user) {
                if (strtolower($user['email']) === $email && password_verify($password, $user['password'])) {
                    $token = bin2hex(random_bytes(32));
                    $db['tokens'] = array_values(array_filter($db['tokens'], fn($t) => (int)$t['userId'] !== (int)$user['id']));
                    $db['tokens'][] = ['token' => $token, 'userId' => (int)$user['id'], 'createdAt' => date(DATE_ATOM)];
                    write_db($db);
                    respond(['user' => public_user($user), 'token' => $token]);
                }
            }
            respond(['message' => 'Invalid email or password.'], 401);

        case $route === 'auth/logout' && $method === 'POST':
            $token = token_from_request();
            $db['tokens'] = array_values(array_filter($db['tokens'], fn($t) => ($t['token'] ?? '') !== $token));
            write_db($db);
            respond(['message' => 'Logged out successfully.']);

        case $route === 'users/register' && $method === 'POST':
            $payload = body();
            $name = trim((string)($payload['name'] ?? ''));
            $email = strtolower(trim((string)($payload['email'] ?? '')));
            $password = (string)($payload['password'] ?? '');
            $role = ($payload['role'] ?? 'drummer') === 'owner' ? 'owner' : 'drummer';
            if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
                respond(['message' => 'Please provide a valid name, email, and password of at least 8 characters.'], 422);
            }
            foreach ($db['users'] as $u) {
                if (strtolower($u['email']) === $email) respond(['message' => 'That email address is already registered.'], 409);
            }
            $user = [
                'id' => next_id($db['users']),
                'name' => $name,
                'email' => $email,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'role' => $role,
                'phone' => '',
                'createdAt' => date(DATE_ATOM),
            ];
            $db['users'][] = $user;
            write_db($db);
            $token = bin2hex(random_bytes(32));
            $db['tokens'][] = ['token' => $token, 'userId' => (int)$user['id'], 'createdAt' => date(DATE_ATOM)];
            write_db($db);
            respond(['user' => public_user($user), 'token' => $token], 201);

        case $route === 'users/profile' && $method === 'GET':
            $user = require_user($db);
            respond(['user' => public_user($user)]);

        case $route === 'users/profile' && $method === 'PUT':
            $user = require_user($db);
            $payload = body();
            $name = trim((string)($payload['name'] ?? $user['name']));
            $email = strtolower(trim((string)($payload['email'] ?? $user['email'])));
            $phone = trim((string)($payload['phone'] ?? ($user['phone'] ?? '')));
            if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['message' => 'Please provide a valid name and email.'], 422);
            foreach ($db['users'] as $other) {
                if ((int)$other['id'] !== (int)$user['id'] && strtolower($other['email']) === $email) respond(['message' => 'That email address is already in use.'], 409);
            }
            foreach ($db['users'] as &$item) {
                if ((int)$item['id'] === (int)$user['id']) {
                    $item['name'] = $name; $item['email'] = $email; $item['phone'] = $phone;
                    $user = $item; break;
                }
            }
            unset($item);
            write_db($db);
            respond(['user' => public_user($user)]);

        case $route === 'users/profile' && $method === 'DELETE':
            $user = require_user($db);
            $uid = (int)$user['id'];
            $db['users'] = array_values(array_filter($db['users'], fn($u) => (int)$u['id'] !== $uid));
            foreach ($db['bookings'] as &$b) {
                if ((int)$b['userId'] === $uid && ($b['status'] ?? '') !== 'cancelled') $b['status'] = 'cancelled';
            }
            unset($b);
            $db['tokens'] = array_values(array_filter($db['tokens'], fn($t) => (int)$t['userId'] !== $uid));
            write_db($db);
            respond(['message' => 'Account deleted.']);

        case $route === 'rooms' && $method === 'GET':
            respond(['rooms' => $db['rooms']]);

        case $route === 'rooms' && $method === 'POST':
            require_owner($db);
            $payload = body();
            $name = trim((string)($payload['name'] ?? ''));
            $price = (float)($payload['price'] ?? 0);
            $capacity = (int)($payload['capacity'] ?? 0);
            if ($name === '' || $price < 0 || $capacity < 1) respond(['message' => 'Invalid room data.'], 422);
            $room = ['id'=>next_id($db['rooms']), 'name'=>$name, 'price'=>$price, 'capacity'=>$capacity, 'equipment'=>trim((string)($payload['equipment'] ?? '')), 'image'=>(string)($payload['image'] ?? '')];
            $db['rooms'][] = $room; write_db($db); respond(['room'=>$room], 201);

        case preg_match('#^rooms/(\d+)$#', $route, $m) && $method === 'PUT':
            require_owner($db); $id=(int)$m[1]; $payload=body();
            foreach ($db['rooms'] as &$room) if ((int)$room['id']===$id) {
                $room['name']=trim((string)($payload['name'] ?? $room['name']));
                $room['price']=(float)($payload['price'] ?? $room['price']);
                $room['capacity']=(int)($payload['capacity'] ?? $room['capacity']);
                $room['equipment']=trim((string)($payload['equipment'] ?? $room['equipment']));
                if (array_key_exists('image',$payload) && $payload['image'] !== '') $room['image']=(string)$payload['image'];
                write_db($db); respond(['room'=>$room]);
            }
            unset($room); respond(['message'=>'Room not found.'],404);

        case preg_match('#^rooms/(\d+)$#', $route, $m) && $method === 'DELETE':
            require_owner($db); $id=(int)$m[1];
            foreach ($db['bookings'] as $booking) {
                if ((int)$booking['roomId'] === $id && ($booking['status'] ?? '') !== 'cancelled') {
                    respond(['message' => 'This room cannot be deleted while it has active bookings.'], 409);
                }
            }
            $db['rooms']=array_values(array_filter($db['rooms'],fn($r)=>(int)$r['id']!==$id));
            write_db($db); respond(['message'=>'Room deleted.']);

        case $route === 'bookings/availability' && $method === 'GET':
            require_user($db);
            $roomId = (int)($_GET['roomId'] ?? 0);
            $date = trim((string)($_GET['date'] ?? ''));
            if (!$roomId || !room_by_id($db, $roomId) || !preg_match('/^\\d{4}-\\d{2}-\\d{2}$/', $date)) {
                respond(['message' => 'Invalid availability request.'], 422);
            }
            $booked = [];
            foreach ($db['bookings'] as $b) {
                if ((int)$b['roomId'] === $roomId && $b['date'] === $date && ($b['status'] ?? '') !== 'cancelled') {
                    $booked[] = $b['time'];
                }
            }
            respond(['bookedTimes' => array_values(array_unique($booked))]);

        case $route === 'bookings' && $method === 'GET':
            $user=require_user($db); $items=$db['bookings'];
            if ($user['role'] !== 'owner') $items=array_values(array_filter($items,fn($b)=>(int)$b['userId']===(int)$user['id']));
            usort($items,fn($a,$b)=>strcmp(($a['date'].' '.$a['time']),($b['date'].' '.$b['time'])));
            respond(['bookings'=>array_map(fn($b)=>booking_view($db,$b),$items)]);

        case $route === 'bookings' && $method === 'POST':
            $user=require_user($db); $payload=body(); $validated=validate_booking($db,$payload);
            $booking=['id'=>next_id($db['bookings']),'userId'=>(int)$user['id'],...$validated,'status'=>'pending','payment'=>'Pending','createdAt'=>date(DATE_ATOM)];
            $db['bookings'][]=$booking; write_db($db); respond(['booking'=>booking_view($db,$booking)],201);

        case preg_match('#^bookings/(\d+)$#',$route,$m) && $method === 'PUT':
            $user=require_user($db); $id=(int)$m[1]; $payload=body();
            foreach($db['bookings'] as &$booking) if((int)$booking['id']===$id){
                if($user['role']!=='owner' && (int)$booking['userId']!==(int)$user['id']) respond(['message'=>'You cannot modify this booking.'],403);
                if(isset($payload['status']) && $user['role']!=='owner') respond(['message'=>'Only the owner can change booking status.'],403);
                if(isset($payload['roomId'])||isset($payload['date'])||isset($payload['time'])||isset($payload['duration'])){
                    $merged=array_merge($booking,$payload);
                    $validated=validate_booking($db,$merged,$id);
                    $booking=array_merge($booking,$validated);
                }
                if($user['role']==='owner' && isset($payload['status'])){
                    $status=(string)$payload['status'];
                    if(!in_array($status,['pending','approved','cancelled'],true)) respond(['message'=>'Invalid booking status.'],422);
                    $booking['status']=$status;
                    $booking['payment']=$status==='approved'?'Paid':($status==='cancelled'?'Refunded':'Pending');
                }
                write_db($db); respond(['booking'=>booking_view($db,$booking)]);
            }
            unset($booking); respond(['message'=>'Booking not found.'],404);

        case preg_match('#^bookings/(\d+)$#',$route,$m) && $method === 'DELETE':
            $user=require_user($db); $id=(int)$m[1];
            foreach($db['bookings'] as &$booking) if((int)$booking['id']===$id){
                if($user['role']!=='owner' && (int)$booking['userId']!==(int)$user['id']) respond(['message'=>'You cannot cancel this booking.'],403);
                $booking['status']='cancelled'; $booking['payment']='Refunded';
                write_db($db); respond(['message'=>'Booking cancelled.','booking'=>booking_view($db,$booking)]);
            }
            unset($booking); respond(['message'=>'Booking not found.'],404);

        default:
            respond(['message'=>'API route not found.'],404);
    }
} catch (Throwable $e) {
    respond(['message' => 'Server error: '.$e->getMessage()], 500);
}
