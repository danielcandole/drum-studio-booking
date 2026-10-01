<?php
require_login();
$rows = array_values(array_filter($s['bookings'], fn($b) => (int)$b['user_id'] === (int)$me['id']));
usort($rows, fn($a, $b) => strcmp($b['start'], $a['start']));
?>
<h1>My bookings</h1>
<?php if (!$rows): ?>
    <div class="panel">You have no bookings yet. <a href="?page=book">Request a session</a>.</div>
<?php endif; ?>
<div class="stack">
    <?php foreach ($rows as $b): ?>
        <?php $kit = array_values(array_filter($s['kits'], fn($k) => (int)$k['id'] === (int)$b['kit_id']))[0] ?? null; ?>
        <article class="panel">
            <div class="row">
                <div>
                    <h3>Booking #<?= e($b['id']) ?> · <?= e($kit['name'] ?? 'Removed kit') ?></h3>
                    <p><?= e($b['start']) ?> – <?= e($b['end']) ?></p>
                </div>
                <span class="badge <?= e($b['status']) ?>"><?= e(ucfirst($b['status'])) ?></span>
            </div>
            <p>Duration: <?= e($b['hours']) ?> hour(s) · Total: ₱<?= number_format((float)$b['price'], 2) ?></p>
            <?php if ($b['notes']): ?>
                <p>Notes: <?= e($b['notes']) ?></p>
            <?php endif; ?>
            <?php if ($b['admin_note']): ?>
                <p class="notice"><b>Admin note:</b> <?= e($b['admin_note']) ?></p>
            <?php endif; ?>
            <?php if (in_array($b['status'], ['pending', 'approved'], true)): ?>
                <form method="post" onsubmit="return confirm('Cancel this booking?')">
                    <?php csrf_field(); ?>
                    <input type="hidden" name="action" value="cancel">
                    <input type="hidden" name="booking_id" value="<?= e($b['id']) ?>">
                    <button class="btn danger">Cancel booking</button>
                </form>
            <?php endif; ?>
        </article>
    <?php endforeach; ?>
</div>