<?php
declare(strict_types=1);

// Cross-platform safe path loading
require_once __DIR__ . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'bootstrap.php';

$page = (string)($_GET['page'] ?? 'home');
$err = '';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_csrf();
        $action = post('action');

        if ($action === 'register') {
            $name = post('name');
            $email = strtolower(post('email'));
            $pass = (string)($_POST['password'] ?? '');
            $phone = post('phone');

            if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 8) {
                throw new RuntimeException('Enter your name, a valid email, and a password of at least 8 characters.');
            }

            change_store(function (&$s) use ($name, $email, $pass, $phone) {
                foreach ($s['users'] as $u) {
                    if (strtolower($u['email']) === $email) {
                        throw new RuntimeException('That email is already registered.');
                    }
                }
                $id = $s['meta']['next_user_id']++;
                $s['users'][] = [
                    'id' => $id,
                    'name' => $name,
                    'email' => $email,
                    'password' => password_hash($pass, PASSWORD_DEFAULT),
                    'role' => 'client',
                    'active' => true,
                    'phone' => $phone,
                    'created_at' => date('c')
                ];
            });

            flash('Account created. You can now sign in.');
            go('?page=login');
        }

        if ($action === 'login') {
            $email = strtolower(post('email'));
            $pass = (string)($_POST['password'] ?? '');
            $s = read_store();
            $found = null;

            foreach ($s['users'] as $u) {
                if (strtolower($u['email']) === $email) {
                    $found = $u;
                }
            }

            if (!$found || !password_verify($pass, $found['password'])) {
                throw new RuntimeException('Incorrect email or password.');
            }
            if (!$found['active']) {
                throw new RuntimeException('This account is inactive. Contact the administrator.');
            }

            session_regenerate_id(true);
            $_SESSION['user'] = [
                'id' => $found['id'],
                'name' => $found['name'],
                'email' => $found['email'],
                'role' => $found['role']
            ];

            flash('Welcome, ' . $found['name'] . '.');
            go('?page=home');
        }

        if ($action === 'logout') {
            session_unset();
            session_regenerate_id(true);
            flash('You have signed out.');
            go('?page=home');
        }

        if ($action === 'book') {
            require_login();
            if (is_admin()) {
                throw new RuntimeException('Client accounts are required to make bookings.');
            }

            $kit = (int)($_POST['kit_id'] ?? 0);
            $start = dt(post('start'));
            $hours = (int)($_POST['hours'] ?? 0);
            $note = post('notes');

            if (!$start || $start <= new DateTimeImmutable() || $hours < 1 || $hours > 8) {
                throw new RuntimeException('Choose a future start time and a duration from 1 to 8 hours.');
            }

            $s0 = $start->format('Y-m-d H:i');
            $end = $start->modify('+' . $hours . ' hours')->format('Y-m-d H:i');

            change_store(function (&$s) use ($kit, $s0, $end, $hours, $note) {
                $k = null;
                foreach ($s['kits'] as $x) {
                    if ((int)$x['id'] === $kit && $x['active']) {
                        $k = $x;
                    }
                }
                if (!$k) {
                    throw new RuntimeException('Selected drum kit is unavailable.');
                }
                if (booking_conflict($s, $kit, $s0, $end)) {
                    throw new RuntimeException('That kit is already requested or booked during this time.');
                }

                $id = $s['meta']['next_booking_id']++;
                $s['bookings'][] = [
                    'id' => $id,
                    'user_id' => user()['id'],
                    'kit_id' => $kit,
                    'start' => $s0,
                    'end' => $end,
                    'hours' => $hours,
                    'price' => (float)$k['price'] * $hours,
                    'status' => 'pending',
                    'notes' => $note,
                    'admin_note' => '',
                    'created_at' => date('c'),
                    'updated_at' => date('c')
                ];
            });

            flash('Booking request submitted. The administrator can now review it.');
            go('?page=my-bookings');
        }

        if ($action === 'cancel') {
            require_login();
            $id = (int)($_POST['booking_id'] ?? 0);

            change_store(function (&$s) use ($id) {
                foreach ($s['bookings'] as &$b) {
                    if ((int)$b['id'] === $id && ((int)$b['user_id'] === (int)user()['id'] || is_admin())) {
                        if (!in_array($b['status'], ['pending', 'approved'], true)) {
                            throw new RuntimeException('This booking can no longer be cancelled.');
                        }
                        $b['status'] = 'cancelled';
                        $b['updated_at'] = date('c');
                        return;
                    }
                }
                throw new RuntimeException('Booking not found or access denied.');
            });

            flash('Booking cancelled.');
            go(is_admin() ? '?page=admin-bookings' : '?page=my-bookings');
        }

        if ($action === 'booking_status') {
            require_admin();
            $id = (int)($_POST['booking_id'] ?? 0);
            $status = post('status');
            $note = post('admin_note');

            if (!in_array($status, ['pending', 'approved', 'rejected', 'completed', 'cancelled'], true)) {
                throw new RuntimeException('Invalid status.');
            }

            change_store(function (&$s) use ($id, $status, $note) {
                foreach ($s['bookings'] as &$b) {
                    if ((int)$b['id'] === $id) {
                        if ($status === 'approved' && booking_conflict($s, (int)$b['kit_id'], $b['start'], $b['end'], (int)$b['id'])) {
                            throw new RuntimeException('Cannot approve: another active booking overlaps this kit.');
                        }
                        $b['status'] = $status;
                        $b['admin_note'] = $note;
                        $b['updated_at'] = date('c');
                        return;
                    }
                }
                throw new RuntimeException('Booking not found.');
            });

            flash('Booking updated. The client will see the new status on their account.');
            go('?page=admin-bookings');
        }

        if ($action === 'save_kit') {
            require_admin();
            $id = (int)($_POST['kit_id'] ?? 0);
            $name = post('name');
            $brand = post('brand');
            $desc = post('description');
            $price = (float)($_POST['price'] ?? 0);

            if ($name === '' || $price < 0) {
                throw new RuntimeException('Enter a kit name and a valid non-negative hourly price.');
            }

            change_store(function (&$s) use ($id, $name, $brand, $desc, $price) {
                if ($id) {
                    foreach ($s['kits'] as &$k) {
                        if ((int)$k['id'] === $id) {
                            $k = array_merge($k, [
                                'name' => $name,
                                'brand' => $brand,
                                'description' => $desc,
                                'price' => $price
                            ]);
                            return;
                        }
                    }
                    throw new RuntimeException('Kit not found.');
                }
                $s['kits'][] = [
                    'id' => $s['meta']['next_kit_id']++,
                    'name' => $name,
                    'brand' => $brand,
                    'description' => $desc,
                    'price' => $price,
                    'active' => true
                ];
            });

            flash('Drum kit saved.');
            go('?page=admin-kits');
        }

        if ($action === 'toggle_kit') {
            require_admin();
            $id = (int)($_POST['kit_id'] ?? 0);

            change_store(function (&$s) use ($id) {
                foreach ($s['kits'] as &$k) {
                    if ((int)$k['id'] === $id) {
                        $k['active'] = !$k['active'];
                        return;
                    }
                }
                throw new RuntimeException('Kit not found.');
            });

            flash('Kit availability updated.');
            go('?page=admin-kits');
        }

        if ($action === 'toggle_client') {
            require_admin();
            $id = (int)($_POST['user_id'] ?? 0);

            change_store(function (&$s) use ($id) {
                foreach ($s['users'] as &$u) {
                    if ((int)$u['id'] === $id && $u['role'] === 'client') {
                        $u['active'] = !$u['active'];
                        return;
                    }
                }
                throw new RuntimeException('Client not found.');
            });

            flash('Client account updated.');
            go('?page=admin-clients');
        }

        if ($action === 'profile') {
            require_login();
            $name = post('name');
            $phone = post('phone');

            if ($name === '') {
                throw new RuntimeException('Name is required.');
            }

            change_store(function (&$s) use ($name, $phone) {
                foreach ($s['users'] as &$u) {
                    if ((int)$u['id'] === (int)user()['id']) {
                        $u['name'] = $name;
                        $u['phone'] = $phone;
                        return;
                    }
                }
            });

            $_SESSION['user']['name'] = $name;
            flash('Profile updated.');
            go('?page=profile');
        }

        if ($action === 'password') {
            require_login();
            $old = (string)($_POST['old_password'] ?? '');
            $new = (string)($_POST['new_password'] ?? '');

            if (strlen($new) < 8) {
                throw new RuntimeException('New password must be at least 8 characters.');
            }

            change_store(function (&$s) use ($old, $new) {
                foreach ($s['users'] as &$u) {
                    if ((int)$u['id'] === (int)user()['id']) {
                        if (!password_verify($old, $u['password'])) {
                            throw new RuntimeException('Current password is incorrect.');
                        }
                        $u['password'] = password_hash($new, PASSWORD_DEFAULT);
                        return;
                    }
                }
            });

            flash('Password changed.');
            go('?page=profile');
        }
    }
} catch (Throwable $ex) {
    $err = $ex->getMessage();
}

$s = read_store();
$me = user();
$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);

$title = ucwords(str_replace('-', ' ', $page));

// Header
require_once __DIR__ . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'header.php';

// Route view based on $page parameter
$pageFile = __DIR__ . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . $page . '.php';

if (file_exists($pageFile)) {
    require $pageFile;
} else {
    http_response_code(404);
    echo '<section class="panel"><h1>Page not found</h1><a href="?page=home">Return home</a></section>';
}

// Footer
require_once __DIR__ . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'footer.php';