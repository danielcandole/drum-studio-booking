<?php
require_login();
$meRow = array_values(array_filter($s['users'], fn($u) => (int)$u['id'] === (int)$me['id']))[0];
?>
<section class="panel narrow">
    <h1>My profile</h1>
    <form method="post">
        <?php csrf_field(); ?>
        <input type="hidden" name="action" value="profile">
        <label>Full name<input name="name" value="<?= e($meRow['name']) ?>" required></label>
        <label>Email<input value="<?= e($meRow['email']) ?>" disabled></label>
        <label>Contact number<input name="phone" value="<?= e($meRow['phone']) ?>"></label>
        <button class="btn">Save profile</button>
    </form>
    <hr>
    <h2>Change password</h2>
    <form method="post">
        <?php csrf_field(); ?>
        <input type="hidden" name="action" value="password">
        <label>Current password<input type="password" name="old_password" required></label>
        <label>New password<input type="password" name="new_password" minlength="8" required></label>
        <button class="btn secondary">Change password</button>
    </form>
</section>