<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($title) ?> · Drum Studio</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<header class="top">
    <a class="brand" href="?page=home">
        <!-- Replaced Emoji with Logo Placeholder -->
        <span class="logo-placeholder">Logo Here</span>
        <span>Drum Studio</span>
    </a>
    <nav>
        <a href="?page=home">Home</a>
        <?php if (user() && !is_admin()): ?>
            <a href="?page=book">Book a session</a>
            <a href="?page=my-bookings">My bookings</a>
            <a href="?page=profile">Profile</a>
        <?php endif; ?>
        <?php if (is_admin()): ?>
            <a href="?page=admin">Dashboard</a>
            <a href="?page=admin-bookings">Bookings</a>
            <a href="?page=admin-kits">Drum kits</a>
            <a href="?page=admin-clients">Clients</a>
        <?php endif; ?>
        <?php if (user()): ?>
            <form method="post" class="navform">
                <?php csrf_field(); ?>
                <input type="hidden" name="action" value="logout">
                <button class="linkbtn">Sign out</button>
            </form>
        <?php else: ?>
            <a href="?page=login">Sign in</a>
            <a class="navcta" href="?page=register">Register</a>
        <?php endif; ?>
    </nav>
</header>
<main class="wrap">
    <div class="hello">
        <?php if (user()): ?>
            Signed in as <?= e(user()['name']) ?> · <?= e(user()['role']) ?>
        <?php endif; ?>
    </div>
    <?php if ($flash): ?>
        <div class="alert <?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
    <?php endif; ?>
    <?php if (!empty($err)): ?>
        <div class="alert error"><?= e($err) ?></div>
    <?php endif; ?>