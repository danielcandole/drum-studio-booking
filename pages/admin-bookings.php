<?php
require_admin();
$rows = $s['bookings'];
usort($rows, fn($a, $b) => strcmp($b['created_at'], $a['created_at']));
?>
<h1>Manage bookings</h1>
<div class="stack">
    <?php foreach ($rows as $b): ?>
        <?php
        $client = array_values(array_filter($s['users'], fn($u) => (int)$u['id'] === (int)$b['user_id']))[0] ?? null;
        $kit = array_values(array_filter($s['kits'], fn($k) => (int)$k['id'] === (int)$b['kit_id']))[0] ?? null;
        ?>
        <article class="panel">
            <div class="row">
                <div>
                    <h3>Booking #<?= e($b['id']) ?> · <?= e($client['name'] ?? 'Unknown client') ?></h3>
                    <p><?= e($client['email'] ?? '') ?> · <?= e($kit['name'] ?? 'Removed kit') ?></p>
                    <p><?= e($b['start']) ?> – <?= e($b['end']) ?> · ₱<?= number_format((float)$b['price'], 2) ?></p>
                </div>
                <span class="badge <?= e($b['status']) ?>"><?= e(ucfirst($b['status'])) ?></span>
            </div>
            <p>Client notes: <?= e($b['notes'] ?: 'None') ?></p>
            <form method="post" class="formrow">
                <?php csrf_field(); ?>
                <input type="hidden" name="action" value="booking_status">
                <input type="hidden" name="booking_id" value="<?= e($b['id']) ?>">
                <label>Status
                    <select name="status">
                        <?php foreach (['pending', 'approved', 'rejected', 'completed', 'cancelled'] as $st): ?>
                            <option value="<?= $st ?>" <?= $st === $b['status'] ? 'selected' : '' ?>><?= ucfirst($st) ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
                <label>Admin note
                    <input name="admin_note" value="<?= e($b['admin_note']) ?>">
                </label>
                <button class="btn">Save changes</button>
            </form>
        </article>
    <?php endforeach; ?>
</div>